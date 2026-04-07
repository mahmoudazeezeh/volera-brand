import { insforge } from './insforgeClient';
import type { CartLine } from '../types/Cart';
import { ADMIN_WHATSAPP_DISPLAY } from '../config/volera';

export type CheckoutPayload = {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryZoneId: number;
  deliveryDetails: string;
  lines: CartLine[];
};

export type OrderItemRow = {
  product_id: number;
  name_ar: string;
  size: string;
  quantity: number;
  unit_price: number;
};

function buildNotifyMessage(params: {
  orderId: number;
  customerName: string;
  customerPhone: string;
  zoneName: string;
  deliveryDetails: string;
  itemsSummary: string;
  total: number;
}): string {
  return [
    'طلب جديد من متجر VOLERA',
    '',
    `الاسم: ${params.customerName}`,
    `الهاتف: ${params.customerPhone}`,
    `المنتجات: ${params.itemsSummary}`,
    `منطقة التوصيل: ${params.zoneName}`,
    `تفاصيل الطلب: ${params.deliveryDetails || '—'}`,
    `الإجمالي: ${params.total} ₪`,
    '',
    `رقم الطلب: ${params.orderId}`,
    `(إشعار للمشرف ${ADMIN_WHATSAPP_DISPLAY})`,
  ].join('\n');
}

export async function submitOrder(
  payload: CheckoutPayload
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const { data: zoneRow, error: zoneErr } = await insforge.database
    .from('delivery_zones')
    .select('name_ar, delivery_price')
    .eq('id', payload.deliveryZoneId)
    .maybeSingle();

  if (zoneErr || !zoneRow) {
    return { ok: false, error: 'منطقة التوصيل غير صالحة' };
  }

  const zone = zoneRow as { name_ar: string; delivery_price: number };
  const itemsJson: OrderItemRow[] = payload.lines.map((line) => ({
    product_id: line.productId,
    name_ar: line.nameAr,
    size: line.size,
    quantity: line.quantity,
    unit_price: line.price,
  }));

  const subtotal = payload.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total_amount = subtotal + Number(zone.delivery_price);

  const itemsSummary = payload.lines
    .map((l) => `${l.nameAr} ×${l.quantity} (${l.size})`)
    .join('، ');

  const { data: orderRows, error: orderErr } = await insforge.database
    .from('orders')
    .insert([
      {
        user_id: payload.userId ?? null,
        customer_name: payload.customerName.trim(),
        customer_phone: payload.customerPhone.trim(),
        customer_email: payload.customerEmail?.trim() || null,
        customer_city: null,
        customer_address: null,
        notes: null,
        delivery_zone_id: payload.deliveryZoneId,
        delivery_details: payload.deliveryDetails.trim() || null,
        total_amount,
        items: itemsJson,
        status: 'pending',
      },
    ])
    .select('id');

  if (orderErr) {
    return { ok: false, error: (orderErr as Error).message || 'فشل إنشاء الطلب' };
  }

  const row = Array.isArray(orderRows) ? orderRows[0] : orderRows;
  const orderId =
    row && typeof row === 'object' && 'id' in row ? Number((row as { id: number }).id) : 0;
  if (!orderId) {
    return { ok: false, error: 'لم يُرجَد رقم الطلب' };
  }

  for (const line of payload.lines) {
    const { error: liErr } = await insforge.database.from('order_items').insert([
      {
        order_id: orderId,
        product_id: line.productId,
        name_ar: line.nameAr,
        size: line.size,
        quantity: line.quantity,
        unit_price: line.price,
      },
    ]);
    if (liErr) {
      return { ok: false, error: (liErr as Error).message || 'فشل حفظ بنود الطلب' };
    }
  }

  const message = buildNotifyMessage({
    orderId,
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    zoneName: zone.name_ar,
    deliveryDetails: payload.deliveryDetails.trim(),
    itemsSummary,
    total: total_amount,
  });

  try {
    await insforge.functions.invoke('notify-admin-order', {
      body: {
        message,
        orderId,
        customerName: payload.customerName.trim(),
        customerPhone: payload.customerPhone.trim(),
        zone: zone.name_ar,
        deliveryDetails: payload.deliveryDetails.trim(),
        total: total_amount,
        items: itemsJson,
      },
    });
  } catch {
    /* الإشعار اختياري — لا نفشل الطلب */
  }

  return { ok: true, id: orderId };
}
