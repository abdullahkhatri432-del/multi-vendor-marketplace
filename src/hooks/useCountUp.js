import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — animates 0 → `target` once the element enters the viewport.
 * Returns { ref, value } where value is the current animated number.
 */
export function useCountUp(target, { duration = 1800, decimals = 0, start = 0 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(start);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (doneRef.current) return;
      doneRef.current = true;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setValue(target);
        return;
      }

      const startTime = performance.now();
      const tick = (now) => {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
        setValue(start + (target - start) * eased);
        if (p < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, start]);

  const formatted = decimals > 0 ? Number(value).toFixed(decimals) : Math.round(value).toLocaleString();
  return { ref, value, formatted };
}

export default useCountUp;
