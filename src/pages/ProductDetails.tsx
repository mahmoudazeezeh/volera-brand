import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { fetchProductById } from '../lib/productApi';
import type { Product } from '../types/Product';
import Navbar from '../components/Navbar';
import VoleraLogo from '../components/VoleraLogo';
import WhatsAppButton from '../components/WhatsAppButton';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('50 مل');
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartNotice, setCartNotice] = useState(false);

  const gallery = useMemo(() => {
    if (!product) return [];
    const u = [product.image, ...product.images].filter(Boolean);
    return [...new Set(u)];
  }, [product]);

  const wishlistOn = user?.id && product ? isSaved(product.id) : false;

  useEffect(() => {
    if (!id || Number.isNaN(numericId)) {
      setLoading(false);
      setProduct(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchProductById(numericId);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setProduct(null);
      } else {
        setLoadError(null);
        setProduct(data);
        if (data?.sizes?.length) {
          setSelectedSize(data.sizes[0]);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, numericId]);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">جاري التحميل…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-12 text-center max-w-lg">
          <p className="text-red-400 mb-2">تعذر تحميل المنتج</p>
          <p className="text-gray-500 text-sm mb-6">{loadError}</p>
          <Link to="/" className="luxury-button inline-block px-8 py-3 rounded-full text-black font-bold">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-12">
          <p className="text-2xl text-white">المنتج غير موجود</p>
          <Link to="/" className="luxury-button inline-block mt-6 px-8 py-3 rounded-full text-black font-bold">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const showPriceStrike =
    product.discount != null && product.discount > 0 && product.price !== product.finalPrice;

  return (
    <div className="min-h-screen">
      <Navbar />
      <WhatsAppButton />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-6">
            <VoleraLogo variant="compact" />
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 mb-8 hover:bg-[#D4AF37] hover:bg-opacity-20 transition-all duration-300"
          >
            <span>العودة للمنتجات</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="fade-in">
              <div className="glass-card rounded-3xl overflow-hidden mb-4">
                <img
                  src={gallery[selectedImage] ?? product.image}
                  alt={product.nameAr}
                  className="w-full aspect-square object-cover"
                />
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-4">
                  {gallery.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`glass-card rounded-2xl overflow-hidden flex-1 transition-all duration-300 ${
                        selectedImage === index ? 'border-[#D4AF37] border-2' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.nameAr} ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="fade-in-up">
              <div className="glass-strong rounded-3xl p-8">
                {product.discount != null && product.discount > 0 && (
                  <div className="inline-block glass rounded-full px-6 py-2 mb-4">
                    <span className="text-[#D4AF37] font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      خصم {product.discount}%
                    </span>
                  </div>
                )}
                {product.lowStock && (
                  <p className="text-amber-300 text-sm mb-4">تنبيه: مخزون هذا العطر منخفض.</p>
                )}

                <h1 className="text-4xl md:text-5xl font-bold gold-gradient-text mb-3 text-shadow-gold">
                  {product.nameAr}
                </h1>
                <p className="text-xl text-gray-400 mb-6">{product.name}</p>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-6"></div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-5xl font-bold text-[#D4AF37]">{product.finalPrice} ₪</span>
                    {showPriceStrike && (
                      <span className="text-2xl text-gray-500 line-through">{product.price} ₪</span>
                    )}
                    {product.originalPrice != null &&
                      product.originalPrice > 0 &&
                      product.originalPrice !== product.price && (
                        <span className="text-xl text-gray-500 line-through">{product.originalPrice} ₪</span>
                      )}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">الوصف</h3>
                  <p className="text-gray-300 leading-relaxed">{product.descriptionAr}</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">الحجم</h3>
                  <div className="flex gap-3 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`glass rounded-2xl px-6 py-3 transition-all duration-300 ${
                          selectedSize === size
                            ? 'bg-[#D4AF37] bg-opacity-30 border-[#D4AF37]'
                            : 'hover:bg-[#D4AF37] hover:bg-opacity-10'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {cartNotice && (
                  <p className="text-green-400 text-sm mb-4 text-center bg-green-950/30 rounded-xl py-2">
                    تمت الإضافة إلى السلة —{' '}
                    <Link to="/cart" className="underline font-bold text-[#D4AF37]">
                      عرض السلة
                    </Link>
                  </p>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!product) return;
                      addItem(product, selectedSize, 1);
                      setCartNotice(true);
                      window.setTimeout(() => setCartNotice(false), 4000);
                    }}
                    className="flex-1 luxury-button rounded-full py-4 text-black font-bold text-lg flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    أضف للسلة
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!user?.id) {
                        navigate('/login', { state: { from: `/product/${product.id}` } });
                        return;
                      }
                      const r = await toggle(product.id);
                      if (r.error === 'login') {
                        navigate('/login', { state: { from: `/product/${product.id}` } });
                      }
                    }}
                    className={`glass rounded-full p-4 transition-all duration-300 ${
                      wishlistOn ? 'bg-[#8B1538] bg-opacity-30' : 'hover:bg-[#D4AF37] hover:bg-opacity-20'
                    }`}
                    aria-label={wishlistOn ? 'إزالة من الأمنيات' : 'حفظ في الأمنيات'}
                  >
                    <Heart
                      className={`w-6 h-6 ${wishlistOn ? 'fill-[#8B1538] text-[#8B1538]' : 'text-[#D4AF37]'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
