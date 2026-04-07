type SeparatorAlign = 'center' | 'start' | 'end';

interface SeparatorProps {
  image: string;
  title: string;
  subtitle?: string;
  /**
   * محاذاة النص: في صفحة RTL، start يضع الكتلة عند يمين الحاوية (مناسب لصور فيها فراغ على اليمين).
   */
  align?: SeparatorAlign;
}

const ALIGN: Record<SeparatorAlign, string> = {
  center: 'items-center text-center',
  start: 'items-start text-right',
  end: 'items-end text-left',
};

export default function Separator({ image, title, subtitle, align = 'center' }: SeparatorProps) {
  return (
    <section className="relative h-[58vh] min-h-[280px] md:h-[62vh] md:min-h-[320px] w-full overflow-hidden my-16 md:my-24">
      <div
        className="absolute inset-0 bg-cover bg-center parallax"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/60"
        aria-hidden
      />
      {align === 'start' && (
        <div
          className="absolute inset-0 bg-gradient-to-l from-transparent via-black/25 to-black/70 pointer-events-none"
          aria-hidden
        />
      )}
      {align === 'end' && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-black/25 to-black/70 pointer-events-none"
          aria-hidden
        />
      )}

      <div
        className={`relative h-full flex flex-col justify-center z-10 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto w-full ${ALIGN[align]}`}
      >
        <div
          className={`max-w-lg md:max-w-xl space-y-4 md:space-y-5 fade-in-up flex flex-col ${
            align === 'center'
              ? 'mx-auto items-center text-center'
              : align === 'start'
                ? 'items-start text-right'
                : 'items-end text-left'
          }`}
        >
          <div className="h-px w-16 md:w-20 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gold-gradient-text text-shadow-gold leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base sm:text-lg md:text-xl text-white/90 font-light leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
