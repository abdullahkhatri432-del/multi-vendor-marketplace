import { useRef, useCallback, useEffect } from 'react';
import {
  useScrollReveal,
} from '../../hooks/useScrollReveal.jsx';
import useCountUp from '../../hooks/useCountUp.js';
import useScrollProgress from '../../hooks/useScrollProgress.js';

/* ----------------------------------------------------------------- Reveal */
const VARIANTS = {
  up: 'reveal',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
};

export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  as: Tag = 'div',
  className = '',
  threshold,
  ...rest
}) {
  const { ref, isVisible } = useScrollReveal(threshold ? { threshold } : undefined);
  const base = VARIANTS[variant] || VARIANTS.up;
  return (
    <Tag
      ref={ref}
      className={`${base} ${isVisible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- TiltCard */
export function TiltCard({
  children,
  className = '',
  intensity = 10,
  glare = true,
  onMouseEnter,
  ...rest
}) {
  const ref = useRef(null);
  const glareRef = useRef(null);

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * intensity * 2;
      const ry = (px - 0.5) * intensity * 2;
      // Follow the cursor immediately; the CSS transition is only for the
      // smooth return-to-rest on mouse leave.
      el.style.transition = 'transform 0ms, box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      if (glareRef.current) {
        glareRef.current.style.background =
          `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.35), transparent 55%)`;
      }
    },
    [intensity],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = '';
    el.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateZ(0)';
    if (glareRef.current) glareRef.current.style.background = 'transparent';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onMouseEnter}
      className={`tilt preserve-3d ${className}`}
      {...rest}
    >
      {children}
      {glare && (
        <span
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-[background] duration-200"
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Stagger */
/**
 * Wraps a list/grid so its direct children cascade in when scrolled into view.
 * Late-arriving children (async data) still animate because the CSS keyframes
 * are gated on the parent's `.is-visible` class.
 */
export function Stagger({
  children,
  as: Tag = 'div',
  className = '',
  threshold = 0,
  style,
  ...rest
}) {
  const { ref, isVisible } = useScrollReveal({
    threshold,
    rootMargin: '0px 0px -40px 0px',
  });
  return (
    <Tag
      ref={ref}
      className={`stagger ${isVisible ? 'is-visible' : ''} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------- Magnetic */
/** Subtle magnetic pull toward the cursor — buttons, CTAs, badges. */
export function Magnetic({ children, strength = 12, className = '', as: Tag = 'span', ...rest }) {
  const ref = useRef(null);

  const onMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    },
    [strength],
  );

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate3d(0,0,0)';
  }, []);

  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`magnetic inline-block ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------- Parallax */
/** Gentle scroll parallax for decorative media. Disabled for reduced motion. */
export function Parallax({ children, speed = 0.12, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/* --------------------------------------------------------- PageTransition */
export function PageTransition({ children, className = '' }) {
  return <div className={`page-enter ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------ AnimatedBar */
/** A value bar that grows from zero the first time it is seen. */
export function AnimatedBar({ value = 0, className = '', barClassName = '', label }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      ref={ref}
      className={`relative h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span
        className={`block h-full rounded-full bg-gradient-to-r from-primary-600 to-accent transition-[width] duration-1000 ease-out ${barClassName}`}
        style={{ width: isVisible ? `${pct}%` : '0%' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Shine */
export function Shine({ children, className = '' }) {
  return <div className={`shine-sweep ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------ SplitWords */
/** Word-by-word headline entrance, timed with CSS only. */
export function SplitWords({ text, className = '', delay = 0, step = 55, as: Tag = 'span' }) {
  const words = String(text).split(' ');
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="word-rise-wrap">
          <span
            className="word-rise"
            style={{ animationDelay: `${delay + i * step}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  );
}

/* ---------------------------------------------------------------- Counter */
export function Counter({ value, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const { ref, formatted } = useCountUp(value, { decimals });
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ---------------------------------------------------------------- Marquee */
export function Marquee({ items, renderItem, reverse = false, speed = 40, className = '' }) {
  return (
    <div className={`group relative flex overflow-hidden marquee-mask ${className}`}>
      <div
        className={`flex w-max shrink-0 ${reverse ? 'marquee-track-rev' : 'marquee-track'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {/* Two identical copies: translating the track by exactly -50% loops
            seamlessly because each copy carries the same trailing padding. */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 || undefined}
            className="flex shrink-0 items-center gap-14 pr-14"
          >
            {items.map((item, i) => renderItem(item, i))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- ScrollProgress (top) */
export function ScrollProgressBar() {
  const progress = useScrollProgress();
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div
        className="h-full origin-left bg-gradient-to-r from-primary-600 via-primary-500 to-accent transition-transform duration-100 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

export default Reveal;
