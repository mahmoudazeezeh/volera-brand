/**
 * VOLERA — إشعار المشرف عند طلب جديد.
 * أضف في أسرار الدالة (InsForge): ORDER_NOTIFY_WEBHOOK_URL
 * يمكن ربطه بـ n8n / Make / Zapier لإرسال واتساب، أو أي API (Twilio / Meta WhatsApp Cloud).
 *
 * الجسم المتوقع: { message, orderId, ... }
 */
module.exports = async function (request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const webhook =
    typeof Deno !== 'undefined' && Deno.env
      ? Deno.env.get('ORDER_NOTIFY_WEBHOOK_URL')
      : '';

  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      webhookConfigured: Boolean(webhook),
      hint: webhook
        ? null
        : 'Set ORDER_NOTIFY_WEBHOOK_URL secret to forward order payloads (e.g. to WhatsApp automation).',
    }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
};
