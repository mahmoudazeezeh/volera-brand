import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import { INSTAGRAM_URL } from '../lib/siteConfig';
import { FALLBACK_HERO_SLIDES, fetchPublicHeroSlides, type HeroSlide } from '../lib/heroSlidesApi';

const INTERVAL_MS = 7000;

function fallbackAsSlides(): HeroSlide[] {
  return FALLBACK_HERO_SLIDES.map((s, i) => ({
    id: -(i + 1),
    image_url: s.image_url,
    headline_ar: s.headline_ar ?? null,
    subline_ar: s.subline_ar ?? null,
    cta_label_ar: s.cta_label_ar ?? 'اكتشف المجموعة',
    cta_href: s.cta_href ?? '#products',
    sort_order: s.sort_order,
    active: true,
  }));
}

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackAsSlides);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error } = await fetchPublicHeroSlides();
      if (!error && data.length > 0) {
        setSlides(data);
        setIndex(0);
      }
    })();
  }, []);

  const n = slides.length;
  const current = useMemo(() => slides[Math.min(index, Math.max(0, n - 1))] ?? slides[0], [slides, index, n]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  useEffect(() => {
    if (n <= 1 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [n, paused]);

  const ctaHref = current?.cta_href?.trim() || '#products';
  const ctaLabel = current?.cta_label_ar?.trim() || 'اكتشف المجموعة';
  const ctaExternal = /^https?:\/\//i.test(ctaHref);

  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-out"
          style={{
            backgroundImage: `url(${s.image_url})`,
            opacity: i === index ? 1 : 0,
            zIndex: i === index ? 0 : -1,
          }}
          aria-hidden={i !== index}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0508]/88 via-black/55 to-black z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#4a0e1e]/35 via-transparent to-transparent z-[1]" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-5 sm:px-8 z-10 pt-24 pb-36">
        <p className="text-[#D4AF37]/90 text-xs sm:text-sm tracking-[0.25em] uppercase mb-2 font-light">
          Luxury Parfum
        </p>
        <p className="text-white/70 text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed font-light">
          حيث يلتقي العبق بالذوق الرفيع — تجربة عطرية تليق بك
        </p>

        <div className="h-px w-20 sm:w-28 mx-auto bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-8 opacity-80" />

        <div className="max-w-3xl mx-auto space-y-5 mb-10">
          <h2
            key={current?.id + '-h'}
            className="text-3xl sm:text-4xl md:text-6xl font-bold text-white leading-tight text-shadow-gold drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]"
          >
            {current?.headline_ar || 'فولـيرا'}
          </h2>
          <p
            key={current?.id + '-s'}
            className="text-base sm:text-lg md:text-2xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md"
          >
            {current?.subline_ar || 'رائحة تتجاوز الكلمات'}
          </p>
        </div>

        <a
          href={ctaHref}
          {...(ctaExternal ? { target: '_blank', rel: 'noopener noreferrer' } : undefined)}
          className="inline-block luxury-button px-10 sm:px-12 py-3.5 sm:py-4 rounded-full text-black font-bold text-base sm:text-lg shadow-lg shadow-black/40 mb-12"
        >
          {ctaLabel}
        </a>

        <div className="flex flex-col items-center gap-3">
          <span className="text-white/45 text-xs tracking-widest">تابعنا</span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-300 text-sm font-medium"
            aria-label="إنستغرام"
          >
            <Instagram className="w-5 h-5" />
            إنستغرام
          </a>
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 glass rounded-full p-3 border border-white/10 hover:border-[#D4AF37]/50 text-white"
              aria-label="السابق"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 glass rounded-full p-3 border border-white/10 hover:border-[#D4AF37]/50 text-white"
              aria-label="التالي"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`شريحة ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <a
          href="#products"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-[#D4AF37]"
          aria-label="انتقل للمنتجات"
        >
          <ChevronDown className="w-8 h-8" />
        </a>
      </div>
    </section>
  );
}
