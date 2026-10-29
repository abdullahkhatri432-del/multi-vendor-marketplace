import { useEffect, useRef, useState } from 'react';

/**
 * useStickyScene — powers "scrollytelling": a tall container whose inner panel
 * stays pinned (sticky) while the user scrolls, revealing `steps` scenes in turn.
 *
 * Returns:
 *   containerRef — attach to the tall outer wrapper
 *   progress     — 0..1 through the whole scene
 *   activeStep   — index of the current step (0..steps-1)
 *   stepProgress — 0..1 through the current step
 */
export function useStickyScene(steps, { stepHeight = 0.9 } = {}) {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [windowHeight, setWindowHeight] = useState(800);

  useEffect(() => {
    if (typeof window !== 'undefined') setWindowHeight(window.innerHeight);
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let frame = 0;
    const compute = () => {
      frame = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - windowHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [windowHeight]);

  const count = Math.max(steps, 1);
  const scaled = Math.min(progress * count, count - 1e-6);
  const activeStep = Math.floor(scaled);
  const stepProgress = scaled - activeStep;

  return { containerRef, progress, activeStep, stepProgress, windowHeight, stepHeight };
}

export default useStickyScene;
