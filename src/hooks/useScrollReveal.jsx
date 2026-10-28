import { useEffect, useState, useRef } from 'react';

/**
 * useScrollReveal — triggers CSS reveal animations when elements enter the viewport.
 * Respects prefers-reduced-motion (reveals immediately).
 */
export function useScrollReveal(options = {}) {
  const { threshold = 0.12, rootMargin = '-60px', once = true } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect reduced motion: reveal immediately without IntersectionObserver.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

export default useScrollReveal;
