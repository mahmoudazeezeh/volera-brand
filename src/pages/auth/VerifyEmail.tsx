import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import VoleraLogo from '../../components/VoleraLogo';
import { useAuth } from '../../context/AuthContext';
import { insertProfile } from '../../lib/profileApi';
import { ADMIN_EMAIL } from '../../config/volera';

const PENDING_KEY = 'volera_pending_profile';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as { email?: string } | null)?.email ?? '';
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err, userId } = await verifyEmail(email.trim(), otp.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }

    let pending: { fullName?: string; phoneE164?: string; email?: string } = {};
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || '{}');
    } catch {
      pending = {};
    }

    if (
      userId &&
      pending.fullName &&
      pending.phoneE164 &&
      pending.email === email.trim().toLowerCase()
    ) {
      await insertProfile({
        id: userId,
        full_name: pending.fullName,
        phone_e164: pending.phoneE164,
        email: pending.email,
        account_status: 'active',
      });
      sessionStorage.removeItem(PENDING_KEY);
    }

    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <VoleraLogo variant="compact" />
        </div>
        <h1 className="text-3xl font-bold gold-gradient-text text-center mb-4">تأكيد البريد</h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          أدخل رمز التحقق المكوّن من 6 أرقام المرسل إلى بريدك (حسب إعدادات InsForge).
        </p>
        {email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
          <p className="text-amber-200/90 text-xs text-center mb-4 glass rounded-xl p-3">
            بعد التحقق، نفّذ في InsForge SQL لمنح صلاحية المشرف: UPDATE public.volera_profiles SET
            role = &apos;admin&apos; WHERE lower(email) = lower(&apos;{ADMIN_EMAIL}&apos;);
          </p>
        )}
        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-4">
          <div>
            <label className="text-gray-400 text-sm">البريد</label>
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
            <label className="text-gray-400 text-sm">رمز التحقق (OTP)</label>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full mt-1 glass rounded-2xl px-4 py-3 text-white tracking-widest text-center text-xl"
              placeholder="••••••"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {done && <p className="text-green-400 text-sm text-center">تم التحقق. جاري التوجيه لتسجيل الدخول…</p>}
          <button
            type="submit"
            disabled={loading || done}
            className="w-full luxury-button py-3 rounded-full text-black font-bold disabled:opacity-60"
          >
            {loading ? 'جاري التحقق…' : 'تأكيد'}
          </button>
          <p className="text-center">
            <Link to="/login" className="text-[#D4AF37] text-sm">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
