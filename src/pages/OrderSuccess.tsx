import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VoleraLogo from '../components/VoleraLogo';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const id = params.get('id');

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-40 px-4 max-w-lg mx-auto text-center">
        <div className="glass-strong rounded-3xl p-12">
          <div className="flex justify-center mb-6">
            <VoleraLogo variant="compact" />
          </div>
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold gold-gradient-text mb-4">تم استلام طلبك</h1>
          <p className="text-gray-300 mb-6">
            شكراً لثقتك بفوليرا. سنتواصل معك قريباً لتأكيد الطلب والتوصيل.
          </p>
          {id && (
            <p className="text-sm text-gray-500 mb-8">
              رقم الطلب: <span className="text-[#D4AF37] font-mono">{id}</span>
            </p>
          )}
          <Link
            to="/"
            className="luxury-button inline-block px-10 py-4 rounded-full text-black font-bold"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
