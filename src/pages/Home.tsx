import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductSection from '../components/ProductSection';
import Separator from '../components/Separator';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { useCatalog } from '../context/CatalogContext';
import { PRODUCT_CATEGORIES } from '../config/volera';
import type { Product } from '../types/Product';

/** تخزين مؤقت — غيّره عند استبدال صور الأقسام في public/sections */
const SECTION_IMG = (name: string) => `/sections/${name}?v=20260407sec`;

function matchesSectionSearch(p: Product, q: string): boolean {
  const term = q.trim();
  if (!term) return true;
  const lower = term.toLowerCase();
  return (
    p.name.toLowerCase().includes(lower) ||
    p.nameAr.includes(term) ||
    p.description.toLowerCase().includes(lower) ||
    p.descriptionAr.includes(term)
  );
}

export default function Home() {
  const { products, loading, loadError } = useCatalog();

  const [catWomen, catMen, catPackages] = PRODUCT_CATEGORIES;
  const [searchWomen, setSearchWomen] = useState('');
  const [searchMen, setSearchMen] = useState('');
  const [searchPackages, setSearchPackages] = useState('');

  const womenProducts = useMemo(
    () =>
      products.filter((p) => p.category === catWomen && matchesSectionSearch(p, searchWomen)),
    [products, catWomen, searchWomen]
  );
  const menProducts = useMemo(
    () => products.filter((p) => p.category === catMen && matchesSectionSearch(p, searchMen)),
    [products, catMen, searchMen]
  );
  const packageProducts = useMemo(
    () =>
      products.filter((p) => p.category === catPackages && matchesSectionSearch(p, searchPackages)),
    [products, catPackages, searchPackages]
  );

  return (
    <div className="min-h-screen smooth-scroll">
      <Navbar />
      <Hero />
      <WhatsAppButton />

      <div id="products">
        {loading && (
          <div className="py-24 text-center text-gray-400 text-lg">جاري تحميل المنتجات…</div>
        )}
        {loadError && (
          <div className="py-24 px-4 text-center">
            <p className="text-red-400 mb-2">تعذر تحميل المنتجات من الخادم.</p>
            <p className="text-gray-500 text-sm">{loadError}</p>
          </div>
        )}
        {!loading && !loadError && products.length === 0 && (
          <div className="py-24 text-center text-gray-400">لا توجد منتجات حالياً.</div>
        )}
        {!loading && !loadError && products.length > 0 && (
          <>
            <ProductSection
              id="women"
              title="عطور نسائية"
              subtitle="اكتشفي عالم الأنوثة والرقي"
              products={womenProducts}
              sectionSearch={searchWomen}
              onSectionSearchChange={setSearchWomen}
            />

            <Separator
              image={SECTION_IMG('volera-section-box.png')}
              title="هوية فولـيرا"
              subtitle="عبقٌ يروي قصة فخامة — صُنع بلمسة ذهبية وتفاصيل تُحسّ بها قبل أن تُرى."
              align="start"
            />

            <ProductSection
              id="men"
              title="عطور رجالية"
              subtitle="قوة وجاذبية لا تُقاوم"
              products={menProducts}
              sectionSearch={searchMen}
              onSectionSearchChange={setSearchMen}
            />

            <Separator
              image={SECTION_IMG('volera-section-pen.png')}
              title="أصالة التوقيع"
              subtitle="جاذبية صامتة وهيبة تدوم — كهوية من يختار التميز في كل يوم."
              align="start"
            />

            <ProductSection
              id="packages"
              title="بكجات عطور"
              subtitle="مجموعات فاخرة بأسعار مميزة"
              products={packageProducts}
              sectionSearch={searchPackages}
              onSectionSearchChange={setSearchPackages}
            />
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
