import { useEffect } from 'react';

// Canonical origin for absolute URLs (canonical, Open Graph, sitemap links).
// Set VITE_SITE_URL in production if the site moves to a custom domain.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://speedersmania.vercel.app'
).replace(/\/$/, '');

const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets per-page title, description, canonical, Open Graph, Twitter and robots
 * tags. Client-side only (this is a Vite SPA), but it prevents every route from
 * sharing the homepage metadata and lets private routes opt out of indexing.
 */
export default function usePageMeta({
  title,
  description,
  path,
  image,
  robots = 'index, follow',
  type = 'website',
} = {}) {
  useEffect(() => {
    if (title) {
      document.title = title;
      upsertMeta('property', 'og:title', title);
      upsertMeta('name', 'twitter:title', title);
    }
    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }

    const canonical = path ? `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` : SITE_URL;
    upsertLink('canonical', canonical);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('name', 'twitter:url', canonical);
    upsertMeta('property', 'og:type', type);
    upsertMeta('name', 'robots', robots);

    const ogImage = image || DEFAULT_IMAGE;
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('name', 'twitter:image', ogImage);
  }, [title, description, path, image, robots, type]);
}
