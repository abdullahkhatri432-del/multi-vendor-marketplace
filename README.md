# Speedersmania — Multi-Vendor Marketplace

A production-ready multi-vendor e-commerce marketplace built with React 18, Vite, Firebase (Auth + Firestore) and Tailwind CSS. UPI payments are verified against their transaction reference (UTR); cash on delivery is paid to the courier.

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

Orders are **server-authoritative**. The browser only sends product IDs, quantities, add-ons, the shipping address, the payment method and the UPI reference; all prices, stock checks, discounts, tax, shipping and totals are recomputed in `api/create-order.js` using the Admin SDK. Firestore rules therefore deny all client writes to `orders` and `utrs`.

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
- `VITE_SITE_URL` — canonical public origin used for canonical tags, Open Graph and the sitemap (defaults to `https://speedersmania.vercel.app`). Set this when the site moves to a custom domain.
- `VITE_ENABLE_DEMO_DATA` — leave unset (or `false`). Setting it to `true` shows the built-in demo catalogue when Firestore has no products; never enable it in production.
- **Server (`FIREBASE_SERVICE_ACCOUNT`)** — required for checkout, import and bulk import. It is a single-line JSON service account from Firebase Console → Project settings → Service accounts. Never commit it.
- `UPI_ID` — canonical UPI id used to build orders and verification notes.
- `ALLOWED_ORIGINS` — comma-separated browser origins allowed to call the API (defaults to localhost in development).
- **Operations** — `CRON_SECRET`, `BACKUP_ENCRYPTION_KEY`, the Blob credentials, `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` and `SITE_URL`. All are documented in [docs/OPERATIONS.md](docs/OPERATIONS.md#1-what-runs-automatically); without them the store runs, but you get no backups and no alerts.

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

The rules make orders, UTRs and reviews server-only and stop vendors from editing trust or financial fields. Deploy them **after** the matching app version is live — the rules deny the client writes that older builds still made.

### 5. Build and test

```bash
npm run build      # outputs dist/
npm run preview    # serve the production build
npm test           # node:test suites (order creation, lifecycle, pricing, coupons, payment matching)
npm run sitemap    # regenerate public/sitemap.xml (static routes without credentials)
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
- Order status, stock restoration and reviews are written only by `/api/order-status` and `/api/reviews`; Firestore rules deny client writes.
- Checkout accepts UPI and Cash on Delivery only. There is no file upload anywhere in the app, so no Firebase Storage (and no Blaze plan) is required.

## Operations

A live store needs more than a deploy. `docs/OPERATIONS.md` covers the daily
encrypted Firestore backup, the health check, alert delivery and the incident
runbook.

| Concern | How it works |
|---|---|
| Backup | `GET /api/backup` daily at 18:30 UTC → AES-256-GCM encrypted JSON per collection in Vercel Blob, 14 days retained |
| Restore | `npm run restore -- --from <backup>` (dry run unless `--write`) |
| Alerting | Any 5xx from the API, a failed backup or a CSP violation is pushed to Telegram (and to `ALERT_WEBHOOK_URL` if set) |
| Health | `GET /api/health` (Firestore reachability) plus a daily cron that also checks backup age |
| Security headers | HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, and a CSP that ships in report-only mode until it has a report-free day |

## Before going live

These items need credentials or business decisions and are **not** automated:

1. Rotate the Firebase service account key (any key that ever sat in a local `.env` should be treated as exposed) and set it only in the host's environment variables.
2. Set the operations variables (`CRON_SECRET`, `BACKUP_ENCRYPTION_KEY`, the Blob credentials, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) and confirm one manual backup succeeds — see [docs/OPERATIONS.md](docs/OPERATIONS.md).
3. Set `VITE_SITE_URL` to the final domain and regenerate the sitemap.
4. Review `Terms` and `Privacy` with a lawyer for your jurisdiction; they are templates, not legal advice.
5. Email notifications, returns/refund UI and a real payment gateway are not implemented. Checkout supports UPI reference matching and Cash on Delivery only.
6. If you ever ran an older build that used manual transfers, delete any leftover screenshots under `product-images/payment-proofs/` and `payment-proofs/` in the Firebase Console — rules cannot retroactively revoke objects that were already public.
7. After a report-free day, switch the CSP header from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `vercel.json` so it enforces.

## License

MIT
