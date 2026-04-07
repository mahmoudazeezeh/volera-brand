import { useState } from 'react';
import { Link } from 'react-router-dom';
import { VOLERA_LOGO_PATH } from '../config/branding';

export type VoleraLogoVariant = 'navbar' | 'hero' | 'footer' | 'compact' | 'admin';

const IMG: Record<VoleraLogoVariant, string> = {
  navbar:
    'h-9 sm:h-10 w-auto max-w-[150px] object-contain object-center',
  hero: 'h-16 sm:h-24 md:h-28 w-auto max-w-[min(320px,88vw)] object-contain drop-shadow-[0_0_28px_rgba(212,175,55,0.45)]',
  footer: 'h-14 sm:h-16 w-auto max-w-[220px] object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.25)]',
  compact: 'h-11 sm:h-12 w-auto max-w-[180px] object-contain mx-auto',
  admin: 'h-9 sm:h-10 w-auto max-w-[120px] object-contain',
};

const TITLE: Record<VoleraLogoVariant, string> = {
  navbar: 'text-lg sm:text-xl',
  hero: 'text-5xl sm:text-6xl md:text-8xl',
  footer: 'text-3xl',
  compact: 'text-2xl sm:text-3xl',
  admin: 'text-xl sm:text-2xl',
};

const SUB: Record<VoleraLogoVariant, string> = {
  navbar: 'text-[9px] sm:text-[10px]',
  hero: 'text-xl sm:text-2xl',
  footer: 'text-sm',
  compact: 'text-sm',
  admin: 'text-[10px] sm:text-xs',
};

type VoleraLogoProps = {
  variant: VoleraLogoVariant;
  /** يضيف رابطاً للصفحة الرئيسية (مناسب للشريط العلوي) */
  linkToHome?: boolean;
  className?: string;
};

export default function VoleraLogo({ variant, linkToHome = false, className = '' }: VoleraLogoProps) {
  const [failed, setFailed] = useState(false);

  /** شريط التنقل: مربع بلا حشوة والصورة تملأ الإطار بالكامل */
  const navbarSquareFrame = variant === 'navbar' && linkToHome && !failed;

  const fallback = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span className={`font-bold gold-gradient-text text-shadow-gold tracking-wider leading-tight ${TITLE[variant]}`}>
        VOLERA
      </span>
      <span className={`text-[#D4AF37] font-light ${SUB[variant]}`}>فولـيرا</span>
    </div>
  );

  const imgClass =
    navbarSquareFrame
      ? 'h-full w-full min-h-0 min-w-0 object-cover object-center'
      : IMG[variant];

  const img = (
    <img
      src={VOLERA_LOGO_PATH}
      alt="VOLERA فولـيرا"
      className={imgClass}
      onError={() => setFailed(true)}
      loading="eager"
      decoding="async"
    />
  );

  const content = failed ? fallback : img;

  if (linkToHome) {
    const linkFrame = navbarSquareFrame
      ? `inline-flex items-center justify-center shrink-0 rounded-xl sm:rounded-2xl p-0 overflow-hidden h-10 w-10 sm:h-11 sm:w-11 glass hover:border-[#D4AF37]/50 border border-[#D4AF37]/30 transition-all duration-300 ${className}`
      : `inline-flex items-center justify-center shrink-0 rounded-2xl px-2 py-1 sm:px-3 sm:py-1.5 glass hover:border-[#D4AF37]/40 border border-transparent transition-all duration-300 ${className}`;

    return (
      <Link to="/" className={linkFrame}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center justify-center ${className}`}>{content}</div>;
}
