import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { ScrollProgressBar } from '../ui/Motion';

export default function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Global scroll-reveal observer for `.reveal*` elements rendered by pages.
  useEffect(() => {
    const els = document.querySelectorAll(
      '.reveal:not(.is-visible), .reveal-left:not(.is-visible), .reveal-right:not(.is-visible), .reveal-scale:not(.is-visible)'
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  // Scroll to top on route change (except when a hash is present).
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return (
    <div className="relative flex min-h-screen flex-col bg-surface-50">
      <ScrollProgressBar />
      <Header />
      <main key={location.pathname} className="flex-1 animate-fade-in">
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
