import { Link } from 'react-router-dom';
import { Instagram, Mail, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import VoleraLogo from './VoleraLogo';
import { INSTAGRAM_URL, WHATSAPP_URL } from '../lib/siteConfig';

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-[#D4AF37]/20 scroll-mt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a080c] via-[#0d0508] to-black" />
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(ellipse_at_top,_#D4AF37_0%,_transparent_55%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-14">
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              <VoleraLogo variant="footer" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              دار عطور فاخرة — نختار لك مكونات نادرة وتجارب عطرية تدوم، لأن الأناقة تبدأ من التفاصيل.
            </p>
            <div className="flex gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-3 bg-[#2d0a12] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/15 transition-colors"
                aria-label="واتساب"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-3 bg-[#2d0a12] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/15 transition-colors"
                aria-label="إنستغرام"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              استكشف
            </h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <a href="/#women" className="hover:text-[#D4AF37] transition-colors">
                  عطور نسائية
                </a>
              </li>
              <li>
                <a href="/#men" className="hover:text-[#D4AF37] transition-colors">
                  عطور رجالية
                </a>
              </li>
              <li>
                <a href="/#packages" className="hover:text-[#D4AF37] transition-colors">
                  بكجات عطر
                </a>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#D4AF37] transition-colors">
                  سلة التسوق
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-[#D4AF37] transition-colors">
                  قائمة الأمنيات
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest uppercase mb-6">خدمة العملاء</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <a href="/#contact" className="hover:text-[#D4AF37] transition-colors">
                  تواصل معنا
                </a>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-[#D4AF37] transition-colors">
                  إتمام الطلب
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#D4AF37] transition-colors">
                  تسجيل الدخول
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#D4AF37] transition-colors">
                  إنشاء حساب
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest uppercase mb-6">تواصل</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>فلسطين — توصيل لمناطق محددة عبر المتجر</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <a href={WHATSAPP_URL} className="hover:text-[#D4AF37] transition-colors" target="_blank" rel="noreferrer">
                  واتساب — استفسارات وسريع
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <span className="break-all">mahmmoadaziza@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <p className="text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} VOLERA — فولـيرا. جميع الحقوق محفوظة.
          </p>
          <p className="text-[#D4AF37]/70 text-xs font-light tracking-wide">رائحة تتجاوز الكلمات</p>
        </div>
      </div>
    </footer>
  );
}
