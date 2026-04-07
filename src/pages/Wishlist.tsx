import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VoleraLogo from '../components/VoleraLogo';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { user, ready } = useAuth();
  const { products, loading } = useCatalog();
  const { ids } = useWishlist();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">جاري التحميل…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/wishlist' }} />;
  }

  const saved = products.filter((p) => ids.has(p.id));

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex justify-center mb-6">
          <VoleraLogo variant="compact" />
        </div>
        <h1 className="text-3xl font-bold gold-gradient-text mb-2">قائمة الأمنيات</h1>
        <p className="text-gray-500 text-sm mb-10">العطور التي حفظتَها للمراجعة لاحقاً</p>
        {loading ? (
          <p className="text-gray-400">جاري التحميل…</p>
        ) : ids.size === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center text-gray-400">
            <p className="mb-6">لم تحفظ أي عطر بعد.</p>
            <Link to="/" className="luxury-button inline-block px-8 py-3 rounded-full text-black font-bold">
              تصفح المنتجات
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {saved.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {ids.size > 0 && saved.length === 0 && !loading && (
          <p className="text-gray-500 text-sm">
            بعض العناصر المحفوظة لم تعد متوفرة في الكتالوج.
          </p>
        )}
      </div>
    </div>
  );
}
