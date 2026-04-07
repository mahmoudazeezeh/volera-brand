import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../types/Product';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onWishlistChange?: (productId: number, saved: boolean) => void;
}

export default function ProductCard({ product, onWishlistChange }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const navigate = useNavigate();
  const defaultSize = product.sizes[0] ?? '50 مل';
  const saved = user?.id ? isSaved(product.id) : false;

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    const r = await toggle(product.id);
    if (r.error === 'login') {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    if (!r.ok) return;
    onWishlistChange?.(product.id, !saved);
  }

  const showStrike =
    product.discount != null && product.discount > 0 && product.price !== product.finalPrice;

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className="glass-card rounded-3xl overflow-hidden h-full group">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.nameAr}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.lowStock && (
            <div className="absolute top-4 right-4 glass-strong rounded-full px-3 py-1">
              <span className="text-amber-300 font-bold text-xs">مخزون منخفض</span>
            </div>
          )}
          {product.discount != null && product.discount > 0 && (
            <div className="absolute top-4 left-4 glass-strong rounded-full px-4 py-2">
              <span className="text-[#D4AF37] font-bold text-sm">خصم {product.discount}%</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute bottom-4 right-4 glass-strong rounded-full p-3 z-10 hover:bg-[#D4AF37]/20 transition-colors"
            aria-label={saved ? 'إزالة من الأمنيات' : 'إضافة للأمنيات'}
          >
            <Heart
              className={`w-5 h-5 ${saved ? 'fill-[#8B1538] text-[#8B1538]' : 'text-[#D4AF37]'}`}
            />
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors duration-300">
            {product.nameAr}
          </h3>
          <p className="text-sm text-gray-400 mb-4">{product.name}</p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              {showStrike && (
                <span className="text-lg text-gray-500 line-through">{product.price} ₪</span>
              )}
              <span className="text-2xl font-bold text-[#D4AF37]">{product.finalPrice} ₪</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product, defaultSize, 1);
            }}
            className="w-full luxury-button rounded-full py-3 text-black font-bold flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            أضف للسلة
          </button>
        </div>
      </div>
    </Link>
  );
}
