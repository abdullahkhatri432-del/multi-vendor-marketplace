import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { ScrollProgressBar } from '../ui/Motion';

/* Every element that opts into the global motion system. */
const REVEAL_SELECTOR = [
  '.reveal',
  '.reveal-left',
  '.reveal-right',
  '.reveal-scale',
  '.stagger',
  '.anim-rise',
  '.anim-slide',
  '.anim-scale',
].join(',');

export default function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  /**
   * Global motion engine.
   *
   * A single IntersectionObserver drives every reveal on the site, and a
   * MutationObserver re-scans for content that arrives asynchronously
   * (Firestore lists, filters, modals, toasts). Pages therefore only need to
   * add a class — no per-component wiring, no animation library.
   */
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const seen = new WeakSet();
    let frame = 0;
    let sweepFrame = 0;
    let observer = null;

    const reveal = (el) => el.classList.add('is-visible');

    const supportsObserver = typeof IntersectionObserver !== 'undefined';

    if (!reduced && supportsObserver) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0, rootMargin: '0px 0px -6% 0px' }
      );
    }

    const inView = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
    };

    const scan = () => {
      frame = 0;
      const nodes = document.querySelectorAll(REVEAL_SELECTOR);
      nodes.forEach((el) => {
        if (seen.has(el) || el.classList.contains('is-visible')) return;
        seen.add(el);
        if (observer) {
          observer.observe(el);
          // Late-mounted content (async lists) can sit inside a container taller
          // than the viewport, where a ratio threshold never fires. Reveal it now
          // instead of waiting for the next scroll event.
          if (inView(el)) reveal(el);
        } else {
          reveal(el);
        }
      });
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(scan);
    };

    scan();

    // Re-scan whenever React mounts new content (routes, async data, modals).
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });

    // Anything already above the fold on first paint should not wait for scroll.
    // The sweep also runs on scroll/resize so layout shifts (late images, fonts,
    // async lists) can never leave an in-view element stuck at opacity 0.
    const sweep = () => {
      sweepFrame = 0;
      const vh = window.innerHeight;
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.95 && rect.bottom > 0) reveal(el);
      });
    };
    const onScroll = () => {
      if (!sweepFrame) sweepFrame = window.requestAnimationFrame(sweep);
    };

    const paint = window.setTimeout(sweep, 120);

    // Safety net for elements inside hidden/zero-height containers: never leave
    // content invisible (accessibility + SEO) if it never intersects.
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (el.getBoundingClientRect().height === 0) reveal(el);
      });
    }, 2500);

    window.addEventListener('load', schedule);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.clearTimeout(paint);
      window.clearTimeout(failsafe);
      window.removeEventListener('load', schedule);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (sweepFrame) window.cancelAnimationFrame(sweepFrame);
      mutations.disconnect();
      observer?.disconnect();
    };
  }, [location.pathname]);

  // Scroll to top on route change (except when a hash is present).
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return (
    <div className="relative flex min-h-screen flex-col bg-surface-50">
      <ScrollProgressBar />
      <Header />
      <main key={location.pathname} className="page-enter flex-1">
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
