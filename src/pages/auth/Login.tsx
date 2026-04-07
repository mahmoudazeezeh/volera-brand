import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import VoleraLogo from '../../components/VoleraLogo';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate(from.startsWith('/') ? from : '/', { replace: true });
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <VoleraLogo variant="compact" />
        </div>
        <h1 className="text-3xl font-bold gold-gradient-text text-center mb-8">تسجيل الدخول</h1>
        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-4">
          <div>
            <label className="text-gray-400 text-sm">البريد الإلكتروني</label>
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
            <label className="text-gray-400 text-sm">كلمة المرور</label>
            <input
              required
              type="password"
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
            {loading ? 'جاري الدخول…' : 'دخول'}
          </button>
          <p className="text-center text-gray-500 text-sm">
            <Link to="/register" className="text-[#D4AF37]">إنشاء حساب جديد</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
