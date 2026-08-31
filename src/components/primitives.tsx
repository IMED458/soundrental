import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { cx } from '../lib/utils';
import { href, isExternal } from '../lib/links';
import type { Loc } from '../lib/types';

/** Fades content in once, and does nothing at all under prefers-reduced-motion. */
export function Reveal({
  children, delay = 0, as: Tag = 'div', className,
}: { children: React.ReactNode; delay?: number; as?: React.ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={cx('reveal', shown && 'in', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Lazy image with localized alt text and a graceful placeholder. */
export function Img({
  src, alt, className, ratio, priority, cover = true,
}: {
  src?: string; alt?: Loc | string; className?: string; ratio?: string; priority?: boolean; cover?: boolean;
}) {
  const { L } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const altText = typeof alt === 'string' ? alt : L(alt);

  if (!src) {
    return (
      <div
        className={cx('bg-[#131316] border border-[#1E1E22] grid place-items-center', className)}
        style={ratio ? { aspectRatio: ratio } : undefined}
        aria-hidden="true"
      >
        <span className="w-8 h-8 border border-[#2C2C31] rounded-full" />
      </div>
    );
  }

  return (
    <div className={cx('relative overflow-hidden bg-[#131316]', className)} style={ratio ? { aspectRatio: ratio } : undefined}>
      <img
        src={src}
        alt={altText}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cx(
          'w-full h-full transition-opacity duration-700',
          cover ? 'object-cover' : 'object-contain',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow, title, subtitle, action, align = 'left',
}: {
  eyebrow?: string; title?: string; subtitle?: string;
  action?: React.ReactNode; align?: 'left' | 'center';
}) {
  if (!title && !subtitle && !eyebrow) return null;
  return (
    <div className={cx('flex flex-wrap items-end gap-6 mb-10 md:mb-14', align === 'center' && 'justify-center text-center')}>
      <div className="flex-1 min-w-[260px]">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        {title && <h2 className="text-3xl md:text-5xl leading-[1.05] max-w-3xl">{title}</h2>}
        {subtitle && <p className="mt-4 text-[#9A9AA0] max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SmartLink({
  to, children, className, newTab,
}: { to: string; children: React.ReactNode; className?: string; newTab?: boolean }) {
  const { lang } = useI18n();
  const target = href(lang, to);
  if (isExternal(to) || newTab) {
    return (
      <a href={to} className={className} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    );
  }
  return <Link to={target} className={className}>{children}</Link>;
}

export function EmptyState({ title, hint }: { title?: string; hint?: string }) {
  const { t } = useI18n();
  return (
    <div className="border border-dashed border-[#26262B] py-20 px-6 text-center">
      <p className="text-[#9A9AA0]">{title || t('empty')}</p>
      {hint && <p className="mt-2 text-sm text-[#6A6A72]">{hint}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="py-16 flex items-center justify-center gap-3 text-[#6A6A72] text-sm" role="status">
      <span className="w-4 h-4 border border-[#3a3a41] border-t-[var(--accent)] rounded-full animate-spin" />
      {label || t('loading')}
    </div>
  );
}

export function Accordion({ items }: { items: Array<{ id: string; q: string; a: string }> }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="border-t border-[#202024]">
      {items.map((it) => {
        const isOpen = open === it.id;
        return (
          <div key={it.id} className="border-b border-[#202024]">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : it.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-6 py-6 text-left hover:text-[var(--accent)] transition-colors"
            >
              <span className="font-display text-lg md:text-xl">{it.q}</span>
              <ChevronDown className={cx('w-5 h-5 shrink-0 transition-transform duration-300', isOpen && 'rotate-180')} />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-400 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="pb-6 text-[#9A9AA0] leading-relaxed max-w-3xl whitespace-pre-line">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Accessible gallery lightbox: focus-trapped, Esc to close, arrows to navigate. */
export function Lightbox({
  images, index, onClose, onIndex, alt,
}: { images: string[]; index: number; onClose: () => void; onIndex: (i: number) => void; alt?: string }) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [index, images.length, onClose, onIndex]);

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      <div className="flex justify-end p-5">
        <button type="button" className="p-2 text-[#9A9AA0] hover:text-white" aria-label={t('close')} onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <img src={images[index]} alt={alt || ''} className="max-h-full max-w-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-3 pb-8" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`${i + 1}`}
              className={cx('w-14 h-10 border overflow-hidden', i === index ? 'border-[var(--accent)]' : 'border-[#2C2C31] opacity-50 hover:opacity-100')}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
