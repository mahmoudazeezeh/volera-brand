import { useState } from 'react';
import { Menu, X, ShoppingBag, Heart, Shield, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import VoleraLogo from './VoleraLogo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="glass-strong rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
              <div className="hidden lg:flex items-center gap-2 flex-wrap">
                <NavAnchor path="/" label="الرئيسية" onNavigate={() => setIsMobileMenuOpen(false)} />
                <NavAnchor path="/#products" label="المنتجات" onNavigate={() => setIsMobileMenuOpen(false)} />
                <NavAnchor path="/#women" label="عطور نسائية" onNavigate={() => setIsMobileMenuOpen(false)} />
                <NavAnchor path="/#men" label="عطور رجالية" onNavigate={() => setIsMobileMenuOpen(false)} />
                <NavAnchor path="/#packages" label="بكجات عطور" onNavigate={() => setIsMobileMenuOpen(false)} />
              </div>
            </div>

            <VoleraLogo variant="navbar" linkToHome />

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:flex glass rounded-full p-2.5 hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300"
                  aria-label="لوحة التحكم"
                >
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                </Link>
              )}
              <Link
                to="/wishlist"
                className="glass rounded-full p-2.5 hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300"
                aria-label="الأمنيات"
              >
                <Heart className="w-5 h-5 text-[#D4AF37]" />
              </Link>
              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="hidden sm:block glass rounded-full px-4 py-2 text-xs text-gray-300 hover:text-white max-w-[140px] truncate"
                  title={user.email ?? ''}
                >
                  خروج
                </button>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex glass rounded-full p-2.5 hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300"
                  aria-label="تسجيل الدخول"
                >
                  <LogIn className="w-5 h-5 text-[#D4AF37]" />
                </Link>
              )}
              <Link
                to="/cart"
                className="relative glass rounded-full p-2.5 hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300"
                aria-label="السلة"
              >
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#D4AF37] text-black text-xs font-bold flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden glass rounded-full p-2.5 hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300"
                aria-label="القائمة"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#D4AF37]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#D4AF37]" />
                )}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 space-y-2 fade-in">
              <MobileNav href="/" label="الرئيسية" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNav href="/#products" label="المنتجات" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNav href="/#women" label="عطور نسائية" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNav href="/#men" label="عطور رجالية" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNav href="/#packages" label="بكجات عطور" onClick={() => setIsMobileMenuOpen(false)} />
              <Link
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block glass rounded-2xl px-6 py-3 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-center"
              >
                سلة التسوق {totalItems > 0 ? `(${totalItems})` : ''}
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block glass rounded-2xl px-6 py-3 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-center"
              >
                قائمة الأمنيات
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block glass rounded-2xl px-6 py-3 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-center"
                >
                  لوحة التحكم
                </Link>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    void signOut();
                  }}
                  className="w-full glass rounded-2xl px-6 py-3 text-white hover:bg-red-900/30 transition-all duration-300 text-center"
                >
                  تسجيل الخروج
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block glass rounded-2xl px-6 py-3 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-center"
                >
                  تسجيل الدخول
                </Link>
              )}
              {!user && (
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block glass rounded-2xl px-6 py-3 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-center"
                >
                  إنشاء حساب
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavAnchor({
  path,
  label,
  onNavigate,
}: {
  path: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <a
      href={path}
      onClick={onNavigate}
      className="glass rounded-full px-4 xl:px-6 py-2.5 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-sm font-medium whitespace-nowrap"
    >
      {label}
    </a>
  );
}

function MobileNav({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block glass rounded-2xl px-6 py-3 text-white hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300 text-center"
    >
      {label}
    </a>
  );
}
