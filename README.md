# Speedersmania — Multi-Vendor Marketplace

A production-ready multi-vendor e-commerce marketplace built with React 18, Vite, Firebase (Auth + Firestore) and Tailwind CSS. Payments are collected over UPI (with optional COD advance) and verified against the transaction reference (UTR).

## Tech stack

- **Frontend**: React 18 + Vite + Tailwind CSS 3
- **Routing**: React Router v6
- **Auth / data**: Firebase Authentication + Cloud Firestore
- **Serverless API**: Vercel functions in `api/` (Node, CommonJS)
- **Deployment**: Vercel (primary) or GitHub Pages (static)

## Architecture

```
Browser (React SPA)
  ├── Firebase Auth        — email/password sessions, ID tokens
  ├── Firestore (rules)    — catalogue, users, vendors, orders (read-only for clients)
  └── /api/* (serverless)
        ├── create-order   — verifies token, re-prices cart, reserves UTR, writes order
        ├── import-product — authenticated, SSRF-safe product scraper
        └── bulk-import    — authenticated bulk scraper (max 20 URLs)
```

Orders are **server-authoritative**. The browser only sends product IDs, quantities, add-ons, the shipping address and the payment proof; all prices, stock checks, discounts, tax, shipping and totals are recomputed in `api/create-order.js` using the Admin SDK. Firestore rules therefore deny all client writes to `orders` and `utrs`.

### Firestore collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | Profile + `role` (`customer` / `vendor` / `admin`) |
| `vendors/{uid}` | Store profile and server-maintained aggregates |
| `products/{id}` | Listings (`active`, `stock`, `soldCount`, …) |
| `orders/{id}` | Orders (created only by the API) |
| `coupons/{id}` | Discounts (admin-managed, usage counted server-side) |
| `reviews/{id}` | Product reviews |
| `newsletter_subscribers/{sha256(email)}` | Idempotent newsletter signups |
| `pending_products/{id}` | Optional bulk-import drafts |

## Getting started

### 1. Install

```bash
git clone https://github.com/abdullahkhatri432-del/multi-vendor-marketplace.git
cd multi-vendor-marketplace
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in what you need:

- **Client (`VITE_*`)** — optional; `src/config/firebase.js` ships with working defaults.
- **Server (`FIREBASE_SERVICE_ACCOUNT`)** — required for checkout, import and bulk import. It is a single-line JSON service account from Firebase Console → Project settings → Service accounts. Never commit it.
- `UPI_ID` — canonical UPI id used to build orders and verification notes.
- `ALLOWED_ORIGINS` — comma-separated browser origins allowed to call the API (defaults to localhost in development).

### 3. Run

```bash
npm run dev        # Vite (default :5173) + local API (:3001)
npm run dev:web    # Vite only
npm run dev:api    # local API only
```

Vite proxies `/api` to `http://localhost:3001`, so the checkout flow works exactly like production.

### 4. Firestore rules & indexes

Deploy the repository's security rules and indexes before going live:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The rules make orders/UTRs server-only and stop vendors from editing trust or financial fields.

### 5. Build

```bash
npm run build      # outputs dist/
npm run preview    # serve the production build
```

## Deployment

### Vercel (recommended)

1. Import the repo in Vercel (framework preset: **Vite**).
2. Add the server environment variables (`FIREBASE_SERVICE_ACCOUNT`, `UPI_ID`, `ALLOWED_ORIGINS`).
3. Deploy. `vercel.json` handles SPA rewrites, security headers and function limits.

### GitHub Pages

Push to `main`; `.github/workflows/deploy.yml` builds with `VITE_BASE_PATH=/multi-vendor-marketplace/` and copies `dist/index.html` to `dist/404.html` so client-side routes resolve. Note that Pages cannot run the `/api` functions — checkout/import need Vercel (or another Node host).

## Roles

| Role | Capabilities |
|---|---|
| **Customer** | Browse, cart, checkout, order history, reviews, wishlist |
| **Vendor** | Product management, URL import, fulfilment updates, sales analytics |
| **Admin** | Platform stats, vendor verification, order/payment verification, categories & coupons |

## Security notes

- Card payments are intentionally disabled — there is no payment gateway, so accepting card numbers would be unsafe.
- UPI references are normalised and hashed; a reference can only ever be attached to one order (enforced in a Firestore transaction).
- Product scraping only allows public HTTP(S) URLs on ports 80/443; private IP ranges and redirects to them are blocked (SSRF guard).
- Product images are compressed client-side to base64 and stored on the document (no Storage/Blaze plan required). Keep total document size under 1 MiB.

## License

MIT
