// Minimal GA4 + Meta Pixel tracker. Loads scripts on demand, sends standard
// e-commerce events. Everything is disabled in local dev to avoid skewing data.
// Configure via env:
//   VITE_GA_MEASUREMENT_ID  (defaults to the Firebase project GA4 id)
//   VITE_META_PIXEL_ID      (Meta/Facebook pixel, optional)

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-QTF3SGCR3B';
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

const enabled = () => {
  const blocked = import.meta.env.DEV || (typeof window === 'undefined');
  if (blocked) return false;
  try {
    if (localStorage.getItem('sm_analytics_optout') === '1') return false;
  } catch {
    /* ignore */
  }
  return true;
};

let gtagReady = false;

function ensureGtag() {
  if (gtagReady) return;
  gtagReady = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function ensurePixel() {
  if (!PIXEL_ID || window.fbq) return;
  (function () {
    const f = (window._fbq = window._fbq || []);
    window.fbq = function fbq() {
      f.push(arguments);
    };
    window.fbq('init', PIXEL_ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  })();
}

export function initAnalytics() {
  if (!enabled()) return;
  ensureGtag();
  ensurePixel();
}

export function trackPageView(path, title) {
  if (!enabled()) return;
  ensureGtag();
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
  if (window.fbq) window.fbq('track', 'PageView');
}

export function trackEvent(name, params = {}) {
  if (!enabled()) return;
  ensureGtag();
  window.gtag('event', name, {
    ...params,
    currency: params.currency || 'INR',
  });
  if (window.fbq && name !== 'page_view') window.fbq('track', name, params);
}
