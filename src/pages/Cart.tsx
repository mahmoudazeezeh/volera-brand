import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import VoleraLogo from '../components/VoleraLogo';
import WhatsAppButton from '../components/WhatsAppButton';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { lines, setQuantity, removeLine, subtotal, totalItems } = useCart();

  return (
    <div className="min-h-screen">
      <Navbar />
      <WhatsAppButton />

      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <VoleraLogo variant="compact" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold gold-gradient-text mb-10 text-center text-shadow-gold">
          سلة التسوق
        </h1>

        {lines.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-[#D4AF37] mx-auto mb-6 opacity-60" />
            <p className="text-xl text-gray-300 mb-8">السلة فارغة</p>
            <Link
              to="/"
              className="luxury-button inline-block px-10 py-4 rounded-full text-black font-bold"
            >
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.size}`}
                className="glass-strong rounded-3xl p-6 flex flex-col sm:flex-row gap-6 items-center"
              >
                <Link to={`/product/${line.productId}`} className="shrink-0">
                  <img
                    src={line.image}
                    alt=""
                    className="w-28 h-28 object-cover rounded-2xl border border-[#D4AF37]/30"
                  />
                </Link>
                <div className="flex-1 text-center sm:text-right w-full">
                  <Link
                    to={`/product/${line.productId}`}
                    className="text-xl font-bold text-white hover:text-[#D4AF37] transition-colors"
                  >
                    {line.nameAr}
                  </Link>
                  <p className="text-gray-400 mt-1">الحجم: {line.size}</p>
                  <p className="text-[#D4AF37] font-bold text-lg mt-2">{line.price} ₪</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.size, line.quantity - 1)}
                    className="glass rounded-full p-2 hover:bg-[#D4AF37]/20"
                    aria-label="تقليل الكمية"
                  >
                    <Minus className="w-5 h-5 text-[#D4AF37]" />
                  </button>
                  <span className="text-white font-bold w-8 text-center">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.size, line.quantity + 1)}
                    className="glass rounded-full p-2 hover:bg-[#D4AF37]/20"
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="w-5 h-5 text-[#D4AF37]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId, line.size)}
                    className="glass rounded-full p-2 hover:bg-red-900/40 mr-2"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
                <div className="text-left sm:text-center min-w-[100px]">
                  <p className="text-gray-500 text-sm">المجموع</p>
                  <p className="text-xl font-bold text-white">{line.price * line.quantity} ₪</p>
                </div>
              </div>
            ))}

            <div className="glass-strong rounded-3xl p-8 mt-10">
              <div className="flex justify-between items-center text-xl mb-6">
                <span className="text-gray-300">عدد القطع: {totalItems}</span>
                <span className="text-[#D4AF37] font-bold text-2xl">الإجمالي: {subtotal} ₪</span>
              </div>
              <Link
                to="/checkout"
                className="block w-full luxury-button text-center py-4 rounded-full text-black font-bold text-lg"
              >
                إتمام الطلب
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
