import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import VoleraLogo from '../../components/VoleraLogo';
import { useAuth } from '../../context/AuthContext';
import { PHONE_PREFIXES } from '../../config/volera';

const PENDING_KEY = 'volera_pending_profile';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState<string>(PHONE_PREFIXES[0]);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const local = phoneLocal.replace(/\D/g, '');
    if (local.length < 7) {
      setError('أدخل رقم الهاتف كاملاً بعد اختيار المقدمة');
      return;
    }
    const phoneE164 = `${phonePrefix}${local}`;
    setLoading(true);
    const { error: err, requireEmailVerification } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          fullName: fullName.trim(),
          phoneE164,
          email: email.trim().toLowerCase(),
        })
      );
    } catch {
      /* ignore */
    }
    if (requireEmailVerification) {
      navigate('/verify-email', { state: { email: email.trim() } });
    } else {
      navigate('/login');
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <VoleraLogo variant="compact" />
        </div>
        <h1 className="text-3xl font-bold gold-gradient-text text-center mb-8">إنشاء حساب</h1>
        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-4">
          <div>
            <label className="text-gray-400 text-sm">الاسم الكامل *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 glass rounded-2xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">رقم الهاتف *</label>
            <div className="flex gap-2 mt-1" dir="ltr">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="glass rounded-2xl px-2 py-3 text-white"
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
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d]/g, ''))}
                className="flex-1 glass rounded-2xl px-4 py-3 text-white"
                placeholder="XXXXXXXXX"
              />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm">البريد الإلكتروني *</label>
            <input
              required
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 glass rounded-2xl px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">كلمة المرور *</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 glass rounded-2xl px-4 py-3 text-white"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full luxury-button py-3 rounded-full text-black font-bold disabled:opacity-60"
          >
            {loading ? 'جاري التسجيل…' : 'تسجيل'}
          </button>
          <p className="text-center text-gray-500 text-sm">
            لديك حساب؟ <Link to="/login" className="text-[#D4AF37]">تسجيل الدخول</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
