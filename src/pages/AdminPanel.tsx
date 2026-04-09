import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { PRODUCT_CATEGORIES } from '../config/volera';
import type { Product } from '../types/Product';
import {
  fetchAdminStats,
  fetchAdminOrders,
  fetchAdminProducts,
  updateOrderStatus,
  adminInsertProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminRollbackInsertedProduct,
  fetchProductImages,
  uploadProductImage,
  deleteProductImage,
  type AdminOrder,
  type OrderStatus,
  type ProductImageRow,
} from '../lib/voleraAdminApi';
import {
  fetchAllZonesAdmin,
  insertDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  type DeliveryZone,
} from '../lib/zonesApi';
import HeroSlidesAdminTab from '../components/admin/HeroSlidesAdminTab';
import VoleraLogo from '../components/VoleraLogo';
import { enhanceAdminDbErrorMessage } from '../lib/adminDbMessages';
import { ensureValidInsforgeAccessToken } from '../lib/insforgeSession';

const PLACEHOLDER_IMAGE =
  'https://placehold.co/600x600/111111/D4AF37/png?text=VOLERA';

type Tab = 'overview' | 'products' | 'orders' | 'zones' | 'hero';

export default function AdminPanel() {
  const { ready, user, isAdmin } = useAuth();
  const { refetch: refetchCatalog } = useCatalog();

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void ensureValidInsforgeAccessToken();
  }, [ready, isAdmin]);

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, pendingOrders: 0, totalProducts: 0 });
  const [statsErr, setStatsErr] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const [formMsg, setFormMsg] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const s = await fetchAdminStats();
    if (s.error) setStatsErr(s.error.message);
    else setStatsErr(null);
    setStats({
      totalUsers: s.totalUsers,
      totalOrders: s.totalOrders,
      pendingOrders: s.pendingOrders,
      totalProducts: s.totalProducts,
    });
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    const { data, error } = await fetchAdminProducts();
    setProductsLoading(false);
    if (error) {
      setFormMsg(error.message);
      return;
    }
    setProducts(data);
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data, error } = await fetchAdminOrders();
    setOrdersLoading(false);
    if (error) {
      setFormMsg(error.message);
      return;
    }
    setOrders(data);
  }, []);

  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    const { data, error } = await fetchAllZonesAdmin();
    setZonesLoading(false);
    if (error) {
      setFormMsg(error.message);
      return;
    }
    setZones(data);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void loadStats();
  }, [ready, isAdmin, loadStats]);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    if (tab === 'products') void loadProducts();
    if (tab === 'orders') void loadOrders();
    if (tab === 'zones') void loadZones();
  }, [ready, isAdmin, tab, loadProducts, loadOrders, loadZones]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">جاري التحميل…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 px-4 text-center text-gray-300">
          <p className="text-xl mb-4">لا تملك صلاحية الوصول إلى لوحة التحكم.</p>
          <Link to="/" className="text-[#D4AF37] underline">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <VoleraLogo variant="admin" />
          <h1 className="text-3xl md:text-4xl font-bold gold-gradient-text">لوحة تحكم VOLERA</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">إدارة المنتجات، الطلبات، المخزون، المناطق، وسلايدر الصفحة الرئيسية</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {(
            [
              ['overview', 'نظرة عامة'],
              ['hero', 'سلايدر الرئيسية'],
              ['products', 'المنتجات'],
              ['orders', 'الطلبات'],
              ['zones', 'مناطق التوصيل'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setTab(k);
                setFormMsg(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                tab === k
                  ? 'bg-[#D4AF37] text-black'
                  : 'glass text-gray-300 hover:border-[#D4AF37]/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {formMsg && (
          <p className="text-amber-200/90 text-sm mb-4 glass rounded-xl px-4 py-2 whitespace-pre-line">
            {enhanceAdminDbErrorMessage(formMsg)}
          </p>
        )}

        {tab === 'overview' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsErr && (
              <p className="text-red-400 col-span-full text-sm whitespace-pre-line">
                {enhanceAdminDbErrorMessage(statsErr)}
              </p>
            )}
            <StatCard title="المستخدمون" value={stats.totalUsers} />
            <StatCard title="الطلبات" value={stats.totalOrders} />
            <StatCard title="قيد الانتظار" value={stats.pendingOrders} />
            <StatCard title="المنتجات" value={stats.totalProducts} />
          </div>
        )}

        {tab === 'hero' && <HeroSlidesAdminTab onMessage={setFormMsg} />}

        {tab === 'products' && (
          <ProductsAdminTab
            products={products}
            loading={productsLoading}
            onRefresh={async () => {
              await loadProducts();
              await refetchCatalog();
              await loadStats();
            }}
            onMessage={setFormMsg}
          />
        )}

        {tab === 'orders' && (
          <OrdersAdminTab
            orders={orders}
            loading={ordersLoading}
            onRefresh={loadOrders}
            onMessage={setFormMsg}
          />
        )}

        {tab === 'zones' && (
          <ZonesAdminTab
            zones={zones}
            loading={zonesLoading}
            onRefresh={loadZones}
            onMessage={setFormMsg}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="glass-strong rounded-2xl p-6 text-center">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className="text-4xl font-bold text-[#D4AF37]">{value}</p>
    </div>
  );
}

function ProductsAdminTab({
  products,
  loading,
  onRefresh,
  onMessage,
}: {
  products: Product[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onMessage: (s: string | null) => void;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImageRow[]>([]);

  useEffect(() => {
    if (!editing) {
      setImages([]);
      return;
    }
    void (async () => {
      const { data } = await fetchProductImages(editing.id);
      setImages(data);
    })();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const t = window.setTimeout(() => {
      document.getElementById('volera-product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [editing?.id]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">إدارة المنتجات</h2>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            onMessage(null);
            window.setTimeout(() => {
              document.getElementById('volera-product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          className="luxury-button px-6 py-2.5 rounded-full text-black font-bold text-sm"
        >
          + إضافة منتج جديد
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">تنبيه المخزون المنخفض</h2>
        <div className="glass rounded-2xl divide-y divide-white/10">
          {products.filter((p) => p.lowStock).length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">لا توجد منتجات منخفضة المخزون حالياً.</p>
          ) : (
            products
              .filter((p) => p.lowStock)
              .map((p) => (
                <div key={p.id} className="p-4 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-white">{p.nameAr}</span>
                  <span className="text-amber-300">
                    المتبقي: {p.stockQuantity} (حد التنبيه: {p.lowStockThreshold})
                  </span>
                </div>
              ))
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">جميع المنتجات</h2>
          <button
            type="button"
            onClick={() => onRefresh()}
            className="text-sm text-[#D4AF37] underline"
          >
            تحديث القائمة
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500">جاري التحميل…</p>
        ) : (
          <div className="overflow-x-auto glass rounded-2xl">
            <table className="w-full text-sm text-right min-w-[640px]">
              <thead className="text-gray-400 border-b border-white/10">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">الاسم</th>
                  <th className="p-3">السعر النهائي</th>
                  <th className="p-3">المخزون</th>
                  <th className="p-3">تنبيه</th>
                  <th className="p-3 whitespace-nowrap">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 text-gray-500">{p.id}</td>
                    <td className="p-3 text-white">{p.nameAr}</td>
                    <td className="p-3 text-[#D4AF37]">{p.finalPrice} ₪</td>
                    <td className="p-3">{p.stockQuantity}</td>
                    <td className="p-3">{p.lowStock ? '⚠️' : '—'}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(p);
                            onMessage(null);
                          }}
                          className="text-[#D4AF37] underline"
                        >
                          تعديل
                        </button>
                        <span className="text-white/20">|</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`حذف المنتج «${p.nameAr}» نهائياً؟`)) return;
                            const r = await adminDeleteProduct(p.id);
                            if (!r.ok) onMessage(r.error);
                            else {
                              onMessage(null);
                              if (editing?.id === p.id) setEditing(null);
                              await onRefresh();
                            }
                          }}
                          className="text-red-400 hover:text-red-300 underline text-xs"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">صور المنتج: {editing.nameAr}</h3>
          <p className="text-gray-500 text-xs">
            ارفع من <strong className="text-gray-400">معرض الصور</strong> على الهاتف أو من مجلد الصور على
            اللابتوب. لاستبدال صورة: احذفها ثم ارفع أخرى.
          </p>
          <div className="flex flex-wrap gap-4">
            {images.map((im) => (
              <div key={im.id} className="relative w-28 h-28 rounded-xl overflow-hidden border border-white/10">
                <img src={im.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  className="absolute bottom-1 left-1 right-1 text-xs bg-red-900/90 text-white rounded py-1"
                  onClick={async () => {
                    const r = await deleteProductImage(im.id, im.storage_key, editing.id);
                    if (!r.ok) onMessage(r.error);
                    else {
                      const { data } = await fetchProductImages(editing.id);
                      setImages(data);
                      await onRefresh();
                    }
                  }}
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
          <div>
            <input
              id="volera-extra-product-images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files?.length) return;
                for (const f of Array.from(files)) {
                  const r = await uploadProductImage(editing.id, f);
                  if (!r.ok) onMessage(r.error);
                }
                const { data } = await fetchProductImages(editing.id);
                setImages(data);
                await onRefresh();
                e.target.value = '';
              }}
            />
            <label
              htmlFor="volera-extra-product-images"
              className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer glass rounded-2xl p-4 border border-dashed border-[#D4AF37]/35 hover:border-[#D4AF37]/70 active:scale-[0.99] transition-all"
            >
              <span className="luxury-button px-6 py-3 rounded-full text-black font-bold text-center shrink-0 pointer-events-none">
                إضافة صور من المعرض
              </span>
              <span className="text-gray-500 text-xs leading-relaxed">
                يفتح على الهاتف خيار «معرض الصور» أو «الملفات»؛ على الكمبيوتر نافذة اختيار الملفات. يمكنك
                اختيار أكثر من صورة معاً.
              </span>
            </label>
          </div>
        </div>
      )}

      <div id="volera-product-editor" className="scroll-mt-28">
        <ProductEditorForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            onMessage(null);
            await onRefresh();
            setEditing(null);
          }}
          onMediaChanged={() => void onRefresh()}
          onMessage={onMessage}
        />
      </div>
    </div>
  );
}

function ProductEditorForm({
  initial,
  onSaved,
  onCancel,
  onMessage,
  onMediaChanged,
}: {
  initial: Product | null;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  onMessage: (s: string | null) => void;
  onMediaChanged?: () => void;
}) {
  function parseDiscountInput(raw: string): number | null {
    const normalized = raw.trim().replace(',', '.');
    if (!normalized) return 0;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return null;
    return Math.round(parsed * 10) / 10;
  }

  const [name, setName] = useState(initial?.name ?? '');
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? '');
  const [price, setPrice] = useState(String(initial?.price ?? ''));
  const [discount, setDiscount] = useState(String(initial?.discount ?? '0'));
  const [category, setCategory] = useState(initial?.category ?? PRODUCT_CATEGORIES[0]);
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [descAr, setDescAr] = useState(initial?.descriptionAr ?? '');
  const [stock, setStock] = useState(String(initial?.stockQuantity ?? 0));
  const [lowTh, setLowTh] = useState(String(initial?.lowStockThreshold ?? 5));
  const [imageUrl, setImageUrl] = useState(initial?.image ?? '');
  const [primaryLocalFile, setPrimaryLocalFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    };
  }, [primaryPreview]);

  useEffect(() => {
    setName(initial?.name ?? '');
    setNameAr(initial?.nameAr ?? '');
    setPrice(String(initial?.price ?? ''));
    setDiscount(String(initial?.discount ?? '0'));
    setCategory(initial?.category ?? PRODUCT_CATEGORIES[0]);
    setDesc(initial?.description ?? '');
    setDescAr(initial?.descriptionAr ?? '');
    setStock(String(initial?.stockQuantity ?? 0));
    setLowTh(String(initial?.lowStockThreshold ?? 5));
    setImageUrl(initial?.image ?? '');
    setPrimaryLocalFile(null);
    setPrimaryPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [initial]);

  async function handlePrimaryFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (initial?.id != null) {
      setBusy(true);
      const r = await uploadProductImage(initial.id, f);
      setBusy(false);
      if (r.ok) {
        setImageUrl(r.url);
        onMessage(null);
        onMediaChanged?.();
      } else {
        onMessage(r.error);
      }
      return;
    }
    setPrimaryLocalFile(f);
    setPrimaryPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onMessage(null);
    const parsedDiscount = parseDiscountInput(discount);
    if (parsedDiscount == null || parsedDiscount < 0 || parsedDiscount > 100) {
      onMessage('نسبة الخصم يجب أن تكون رقماً بين 0 و 100 (مثال: 12.5)');
      return;
    }
    setBusy(true);
    const img = imageUrl.trim() || PLACEHOLDER_IMAGE;
    if (initial) {
      const r = await adminUpdateProduct(initial.id, {
        name: name.trim(),
        name_ar: nameAr.trim(),
        price: Number(price),
        discount: parsedDiscount,
        category,
        description: desc.trim(),
        description_ar: descAr.trim(),
        stock_quantity: Number(stock),
        low_stock_threshold: Number(lowTh) || 5,
        image: img,
        images: initial.images?.length ? [...new Set([img, ...initial.images])] : [img],
      });
      setBusy(false);
      if (!r.ok) onMessage(r.error);
      else await onSaved();
      return;
    }
    const ins = await adminInsertProduct({
      name: name.trim(),
      name_ar: nameAr.trim(),
      price: Number(price),
      discount: parsedDiscount,
      category,
      description: desc.trim(),
      description_ar: descAr.trim(),
      stock_quantity: Number(stock),
      low_stock_threshold: Number(lowTh) || 5,
      image: img,
      images: [img],
    });
    if (!ins.ok) {
      setBusy(false);
      onMessage(ins.error);
      return;
    }
    if (primaryLocalFile) {
      const up = await uploadProductImage(ins.id, primaryLocalFile);
      if (!up.ok) {
        // تراجع: حذف المنتج للتو لتجنب سجلات يتيمة
        await adminRollbackInsertedProduct(ins.id);
        setBusy(false);
        onMessage(`فشل رفع الصورة: ${up.error}`);
        return;
      }
    }
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryPreview(null);
    setPrimaryLocalFile(null);
    setBusy(false);
    onMessage('تم حفظ المنتج بنجاح ✔️');
    await onSaved();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm('حذف المنتج نهائياً؟')) return;
    setBusy(true);
    const r = await adminDeleteProduct(initial.id);
    setBusy(false);
    if (!r.ok) onMessage(r.error);
    else await onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold text-white mb-2">{initial ? 'تعديل منتج' : 'إضافة منتج'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="الاسم (عربي)" value={nameAr} onChange={setNameAr} required />
        <Field label="الاسم (إنجليزي)" value={name} onChange={setName} required />
        <Field label="السعر الأساسي" value={price} onChange={setPrice} type="number" required />
        <div>
          <label className="text-gray-400 text-sm">نسبة الخصم %</label>
          <input
            type="text"
            inputMode="decimal"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="مثال: 12.5"
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-gray-400 text-sm">التصنيف</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-gray-400 text-sm">الوصف (عربي)</label>
          <textarea
            required
            value={descAr}
            onChange={(e) => setDescAr(e.target.value)}
            rows={3}
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-gray-400 text-sm">الوصف (إنجليزي)</label>
          <textarea
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
          />
        </div>
        <Field label="المخزون" value={stock} onChange={setStock} type="number" required />
        <Field label="حد التنبيه المنخفض" value={lowTh} onChange={setLowTh} type="number" />
        <div className="sm:col-span-2 space-y-3">
          <p className="text-gray-400 text-sm">صورة المنتج من المعرض أو الجهاز</p>
          <input
            id="volera-primary-product-image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void handlePrimaryFileInput(e)}
          />
          <label
            htmlFor="volera-primary-product-image"
            className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer glass rounded-2xl p-4 border border-dashed border-[#D4AF37]/35 hover:border-[#D4AF37]/70 active:scale-[0.99] transition-all"
          >
            <span className="luxury-button px-6 py-3 rounded-full text-black font-bold text-center shrink-0 pointer-events-none">
              {initial ? 'تغيير الصورة من المعرض' : 'اختر صورة من المعرض'}
            </span>
            <span className="text-gray-500 text-xs leading-relaxed">
              على الهاتف: معرض الصور أو الملفات. على اللابتوب: نافذة اختيار الصور من القرص.
            </span>
          </label>
          {(primaryPreview || imageUrl.trim()) && (
            <div className="flex items-start gap-4 mt-2">
              <img
                src={primaryPreview ?? imageUrl}
                alt=""
                className="w-32 h-32 rounded-xl object-cover border border-white/10"
              />
              <p className="text-gray-600 text-xs pt-2">
                {primaryLocalFile ? `جاهزة للرفع مع الحفظ: ${primaryLocalFile.name}` : 'صورة حالية'}
              </p>
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="text-gray-400 text-sm">أو رابط صورة من الإنترنت (اختياري)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            dir="ltr"
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="luxury-button px-8 py-3 rounded-full text-black font-bold disabled:opacity-50"
        >
          {busy ? 'جاري الحفظ…' : 'حفظ'}
        </button>
        {initial && (
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="glass px-8 py-3 rounded-full text-red-300 border border-red-900/50"
          >
            حذف المنتج
          </button>
        )}
        {initial && (
          <button type="button" onClick={onCancel} className="glass px-8 py-3 rounded-full text-gray-300">
            إغلاق التعديل
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-gray-400 text-sm">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
      />
    </div>
  );
}

type OrderDisplayItem = {
  name_ar: string;
  size: string;
  quantity: number;
  unit_price: number;
};

function parseOrderItems(items: unknown): OrderDisplayItem[] {
  let raw: unknown = items;
  if (typeof items === 'string') {
    try {
      raw = JSON.parse(items);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      if (!it || typeof it !== 'object') return null;
      const row = it as Record<string, unknown>;
      return {
        name_ar: typeof row.name_ar === 'string' ? row.name_ar : 'منتج',
        size: typeof row.size === 'string' ? row.size : '—',
        quantity: Number(row.quantity) || 0,
        unit_price: Number(row.unit_price) || 0,
      } as OrderDisplayItem;
    })
    .filter((x): x is OrderDisplayItem => Boolean(x));
}

function OrdersAdminTab({
  orders,
  loading,
  onRefresh,
  onMessage,
}: {
  orders: AdminOrder[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onMessage: (s: string | null) => void;
}) {
  const statuses: OrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];

  async function setStatus(id: number, status: OrderStatus) {
    const r = await updateOrderStatus(id, status);
    if (!r.ok) onMessage(r.error);
    else {
      onMessage(null);
      await onRefresh();
    }
  }

  return (
    <div>
      {loading ? (
        <p className="text-gray-500">جاري التحميل…</p>
      ) : (
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm text-right min-w-[900px]">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">العميل</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">المنطقة</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">البنود</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 align-top">
                  <td className="p-3 text-gray-500">{o.id}</td>
                  <td className="p-3 text-white">{o.customer_name}</td>
                  <td className="p-3" dir="ltr">
                    {o.customer_phone}
                  </td>
                  <td className="p-3">{o.zoneName}</td>
                  <td className="p-3 text-[#D4AF37]">{o.total_amount} ₪</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => void setStatus(o.id, e.target.value as OrderStatus)}
                      className="glass rounded-lg px-2 py-1 text-white text-xs max-w-[140px]"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-gray-400 max-w-xs whitespace-pre-wrap break-words">
                    {(() => {
                      const parsedItems = parseOrderItems(o.items);
                      if (!parsedItems.length) {
                        return <span className="text-gray-500">لا توجد بنود مفهومة لهذا الطلب</span>;
                      }
                      return (
                        <div className="space-y-2">
                          {parsedItems.map((item, idx) => (
                            <div
                              key={`${o.id}-item-${idx}`}
                              className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5"
                            >
                              <p className="text-white text-xs font-medium">{item.name_ar}</p>
                              <p className="text-gray-400 text-[11px]">
                                الحجم: {item.size} | الكمية: {item.quantity} | سعر الوحدة:{' '}
                                {item.unit_price} ₪ | المجموع: {item.unit_price * item.quantity} ₪
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {o.delivery_details ? (
                      <div className="mt-2 text-gray-500">تفاصيل: {o.delivery_details}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ZonesAdminTab({
  zones,
  loading,
  onRefresh,
  onMessage,
}: {
  zones: DeliveryZone[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onMessage: (s: string | null) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  async function addZone(e: React.FormEvent) {
    e.preventDefault();
    const r = await insertDeliveryZone({ name_ar: name, delivery_price: Number(price) });
    if (!r.ok) onMessage(r.error);
    else {
      onMessage(null);
      setName('');
      setPrice('');
      await onRefresh();
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={addZone} className="glass-strong rounded-2xl p-6 flex flex-wrap gap-4 items-end max-w-xl">
        <div className="flex-1 min-w-[160px]">
          <label className="text-gray-400 text-sm">اسم المنطقة</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
          />
        </div>
        <div className="w-36">
          <label className="text-gray-400 text-sm">سعر التوصيل ₪</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full mt-1 glass rounded-xl px-4 py-3 text-white"
          />
        </div>
        <button type="submit" className="luxury-button px-6 py-3 rounded-full text-black font-bold">
          إضافة
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">جاري التحميل…</p>
      ) : (
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="p-3 text-right">#</th>
                <th className="p-3 text-right">المنطقة</th>
                <th className="p-3 text-right">السعر</th>
                <th className="p-3 text-right">نشط</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <ZoneRow key={z.id} zone={z} onRefresh={onRefresh} onMessage={onMessage} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ZoneRow({
  zone,
  onRefresh,
  onMessage,
}: {
  zone: DeliveryZone;
  onRefresh: () => Promise<void>;
  onMessage: (s: string | null) => void;
}) {
  const [name, setName] = useState(zone.name_ar);
  const [price, setPrice] = useState(String(zone.delivery_price));
  const [active, setActive] = useState(zone.active);

  useEffect(() => {
    setName(zone.name_ar);
    setPrice(String(zone.delivery_price));
    setActive(zone.active);
  }, [zone]);

  async function save() {
    const r = await updateDeliveryZone(zone.id, {
      name_ar: name.trim(),
      delivery_price: Number(price),
      active,
    });
    if (!r.ok) onMessage(r.error);
    else {
      onMessage(null);
      await onRefresh();
    }
  }

  async function del() {
    if (!window.confirm('حذف المنطقة؟ قد تفشل إن وُجدت طلبات مرتبطة.')) return;
    const r = await deleteDeliveryZone(zone.id);
    if (!r.ok) onMessage(r.error);
    else {
      onMessage(null);
      await onRefresh();
    }
  }

  return (
    <tr className="border-b border-white/5">
      <td className="p-3 text-gray-500">{zone.id}</td>
      <td className="p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full glass rounded-lg px-2 py-1 text-white text-sm"
        />
      </td>
      <td className="p-3">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 glass rounded-lg px-2 py-1 text-white text-sm"
        />
      </td>
      <td className="p-3">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </td>
      <td className="p-3 space-x-2 space-x-reverse">
        <button type="button" onClick={() => void save()} className="text-[#D4AF37] text-xs underline">
          حفظ
        </button>
        <button type="button" onClick={() => void del()} className="text-red-400 text-xs underline">
          حذف
        </button>
      </td>
    </tr>
  );
}
