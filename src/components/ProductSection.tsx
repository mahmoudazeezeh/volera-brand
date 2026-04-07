import { Search } from 'lucide-react';
import { Product } from '../types/Product';
import ProductCard from './ProductCard';

interface ProductSectionProps {
  id: string;
  title: string;
  subtitle: string;
  products: Product[];
  sectionSearch: string;
  onSectionSearchChange: (query: string) => void;
}

export default function ProductSection({
  id,
  title,
  subtitle,
  products,
  sectionSearch,
  onSectionSearchChange,
}: ProductSectionProps) {
  return (
    <section id={id} className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 fade-in-up">
          <h2 className="text-5xl md:text-6xl font-bold gold-gradient-text mb-4 text-shadow-gold">
            {title}
          </h2>
          <p className="text-xl text-gray-400">{subtitle}</p>
          <div className="h-px w-32 mx-auto mt-6 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
        </div>

        <div className="max-w-xl mx-auto mb-12 relative">
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/70 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={sectionSearch}
            onChange={(e) => onSectionSearchChange(e.target.value)}
            placeholder={`ابحث في ${title}…`}
            className="w-full glass rounded-full pr-12 pl-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 border border-white/5"
            dir="rtl"
          />
          <p className="text-gray-600 text-xs mt-2 text-center">البحث يخص هذا القسم فقط</p>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {sectionSearch.trim()
              ? 'لا توجد نتائج مطابقة في هذا القسم.'
              : 'لا توجد منتجات في هذا القسم حالياً.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="fade-in-up"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
