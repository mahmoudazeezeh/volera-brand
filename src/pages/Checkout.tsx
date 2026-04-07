import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VoleraLogo from '../components/VoleraLogo';
import WhatsAppButton from '../components/WhatsAppButton';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder } from '../lib/orderApi';
import { fetchDeliveryZones, type DeliveryZone } from '../lib/zonesApi';
import { PHONE_PREFIXES } from '../config/volera';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { lines, subtotal, clearCart } = useCart();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [name, setName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState<string>(PHONE_PREFIXES[0]);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [email, setEmail] = useState('');
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [deliveryDetails, setDeliveryDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await fetchDeliveryZones();
      setZones(data);
      if (data[0]) setZoneId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (user?.email) setEmail(user.email);
    if (profile?.phone_e164) {
      const p = PHONE_PREFIXES.find((pre) => profile.phone_e164.startsWith(pre));
      if (p) {
        setPhonePrefix(p);
        setPhoneLocal(profile.phone_e164.slice(p.length).replace(/\D/g, ''));
      }
    }
  }, [user, profile]);

  const selectedZone = zones.find((z) => z.id === zoneId);
  const deliveryFee = selectedZone ? Number(selectedZone.delivery_price) : 0;
  const grandTotal = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const local = phoneLocal.replace(/\D/g, '');
    if (!name.trim() || local.length < 7) {
      setError('الاسم ورقم الجوال الكامل مطلوبان');
      return;
    }
    if (zoneId === '') {
      setError('اختر منطقة التوصيل');
      return;
    }
    if (lines.length === 0) {
      setError('السلة فارغة');
      return;
    }
    const fullPhone = `${phonePrefix}${local}`;

    setSubmitting(true);
    const result = await submitOrder({
      userId: user?.id ?? null,
      customerName: name,
      customerPhone: fullPhone,
      customerEmail: email || undefined,
      deliveryZoneId: Number(zoneId),
      deliveryDetails,
      lines,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    clearCart();
    navigate(`/order-success?id=${result.id}`);
  }

  if (lines.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-40 px-4 text-center">
          <div className="flex justify-center mb-6">
            <VoleraLogo variant="compact" />
          </div>
          <p className="text-gray-400 text-xl mb-8">لا يوجد شيء للطلب. أضف منتجات من السلة.</p>
          <Link to="/cart" className="luxury-button inline-block px-8 py-3 rounded-full text-black font-bold">
            العودة للسلة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <WhatsAppButton />

      <div className="pt-32 pb-20 px-4 max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <VoleraLogo variant="compact" />
        </div>
        <h1 className="text-4xl font-bold gold-gradient-text mb-2 text-center text-shadow-gold">
          إتمام الطلب
        </h1>
        <div className="text-center text-gray-400 mb-10 space-y-1">
          <p>المجموع الفرعي: {subtotal} ₪</p>
          <p>التوصيل: {deliveryFee} ₪</p>
          <p className="text-[#D4AF37] font-bold text-lg">الإجمالي: {grandTotal} ₪</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-5">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">الاسم الكامل *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">رقم الهاتف *</label>
            <div className="flex gap-2 flex-wrap" dir="ltr">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="glass rounded-2xl px-3 py-3 text-white min-w-[100px]"
              >
                {PHONE_PREFIXES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                required
                type="tel"
                placeholder="XXXXXXXXX"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, ''))}
                className="flex-1 min-w-[160px] glass rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">مثال: {phonePrefix}599123456</p>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">البريد الإلكتروني</label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">منطقة التوصيل *</label>
            <select
              required
              value={zoneId === '' ? '' : String(zoneId)}
              onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')}
              className="w-full glass rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              {zones.length === 0 && <option value="">جاري التحميل…</option>}
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name_ar} — {z.delivery_price} ₪
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm">تفاصيل الطلب</label>
            <p className="text-gray-500 text-xs mb-2">
              العنوان بالتفصيل، اسم الشارع، الطابق، أقرب معلم…
            </p>
            <textarea
              rows={4}
              value={deliveryDetails}
              onChange={(e) => setDeliveryDetails(e.target.value)}
              className="w-full glass rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-950/30 rounded-xl py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full luxury-button py-4 rounded-full text-black font-bold text-lg disabled:opacity-60"
          >
            {submitting ? 'جاري الإرسال…' : 'تأكيد الطلب'}
          </button>

          <Link
            to="/cart"
            className="block text-center text-gray-400 hover:text-[#D4AF37] text-sm py-2"
          >
            العودة للسلة
          </Link>
        </form>
      </div>
    </div>
  );
}
