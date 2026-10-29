import { useRef, useCallback } from 'react';
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
export function TiltCard({ children, className = '', intensity = 10, glare = true }) {
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
    el.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) translateZ(0)';
    if (glareRef.current) glareRef.current.style.background = 'transparent';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt preserve-3d ${className}`}
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
  const track = [...items, ...items];
  return (
    <div className={`group relative flex overflow-hidden marquee-mask ${className}`}>
      <div
        className={`flex shrink-0 items-center gap-14 pr-14 ${reverse ? 'marquee-track-rev' : 'marquee-track'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {track.map((item, i) => renderItem(item, i))}
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
