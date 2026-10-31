# Production Readiness Report — Speedersmania Marketplace

Date: 31 October 2026
Branch: `feature/production-readiness` (off `fix/checkout-utr-scope`)
Scope: audit of the existing codebase, fixes for critical business/security defects, removal of fabricated content, SEO foundations, regression tests and CI.

This report records what was **verified**, not what is planned. Anything untested is labelled as such.

---

## A. Feature audit matrix

Legend: **Works** = implemented and exercised by automated tests or by reading the full code path; **Fixed** = was broken/insecure, now corrected in this branch; **Partial** = works but has a known limitation; **Missing** = not implemented.

| Area | Feature | Before | Now | Notes |
|---|---|---|---|---|
| Auth | Email/password signup + login | Works | Works | Firebase Auth |
| Auth | Role assignment (customer/vendor/admin) | Works | Works | Rules block self-assigned `admin` |
| Auth | Vendor self-registration | **Broken** | Fixed | Client wrote rules-forbidden fields → permission error |
| Auth | Password reset / change | Missing | Missing | Not implemented |
| Catalogue | Product listing, search, filters | Works | Works | No pagination (loads all products) |
| Catalogue | Product detail, related items | Works | Works | |
| Catalogue | Variants (size/colour) | Missing | Missing | Data model has addons only |
| Catalogue | Product images | Partial | Partial | Base64 in Firestore doc, 1 MiB cap |
| Cart | Add/remove/update, persistence | Works | Works | |
| Cart | Stock enforcement | **Broken** | Fixed | Quantities now clamped; sold-out blocked |
| Checkout | Server-side pricing/stock revalidation | Works | Works | `api/create-order.js` |
| Checkout | UPI reference (UTR) matching | **Broken** | Fixed | `utrRef` scope bug returned HTTP 500 for UPI/COD |
| Checkout | Cash on Delivery with advance | Works | Works | |
| Checkout | Manual bank/UPI transfer with proof | Works | **Removed** | Feature deleted: checkout is UPI + COD only |
| Checkout | Card payments | Missing (by design) | Missing (by design) | Rejected with a clear message |
| Orders | Order creation | Works | Works | API-only |
| Orders | Status transitions | **Broken** | Fixed | Direct client writes; no transition table |
| Orders | Stock restoration on cancel | **Missing** | Fixed | `api/order-status.js` |
| Orders | Tracking number/URL | Partial | Fixed | Vendor form + http(s) validation |
| Orders | Customer cancellation | Missing | Fixed | Pending → packed only |
| Orders | Status history/audit | Missing | Fixed | `statusHistory` array entries |
| Orders | Returns/refund workflow (customer UI) | Missing | Missing | Refund is only flagged on cancel |
| Reviews | Submit review | **Insecure** | Fixed | Client-written; now API-only |
| Reviews | Verified-purchase badge | **Forgeable** | Fixed | Server checks order history |
| Reviews | Rating aggregates | **Forgeable** | Fixed | Recomputed transactionally |
| Reviews | Delete/report/vote | Partial | Partial | Owner delete via API; no report/vote |
| Vendors | Store page, product listing | Works | Works | |
| Vendors | Fulfilment dashboard | Partial | Fixed | Now uses the lifecycle API |
| Vendors | Sales analytics | Works | Works | Derived from orders |
| Admin | Vendor verification, categories, coupons | Works | Works | |
| Admin | Payment verification | Works | Works | Admin-only Firestore update |
| Admin | Audit log | Missing | Missing | Only per-order `statusHistory` |
| Content | Testimonials/statistics | **Fabricated** | Removed | Sections deleted, not replaced with invented data |
| Content | Flash-deal countdown | **Fabricated** | Removed | Replaced with an honest checkout explainer |
| Content | Trust badges / shipping promises | **Unverifiable** | Fixed | Copy now describes enforced behaviour |
| Content | Demo catalogue | **On by default in dev** | Fixed | Requires `VITE_ENABLE_DEMO_DATA=true` |
| SEO | Per-page title/description/canonical | **Missing** | Fixed | All 19 routes |
| SEO | robots.txt | **Over-blocked** | Fixed | `/vendor$` anchored; transactional routes excluded |
| SEO | Sitemap | **Crashed without credentials** | Fixed | Static fallback + products/vendors/categories |
| SEO | Structured data | **Static/misleading** | Fixed | JSON-LD from live product data |
| SEO | Server-side rendering / prerender | Missing | Missing | SPA; social crawlers get generic HTML |
| Perf | Code splitting | Works | Works | Route-level lazy loading |
| Perf | Image optimisation | Partial | Partial | No responsive variants/CDN |
| Notifications | Transactional email | Missing | Missing | No provider configured |
| Legal | Terms/Privacy | Templates | Templates | Need legal review |
| Ops | Automated tests | Missing | Added | 40 `node:test` cases |
| Ops | CI | Build only (Pages) | Added | Tests + build on PRs |

---

## B. Critical defects fixed

1. **UPI/COD checkout returned HTTP 500** — `utrRef` was declared inside a conditional block in `api/create-order.js` but used in the transaction afterwards. Every UPI and COD order failed after validation. Now declared once at function scope; covered by tests.
2. **Vendor registration always failed** — the client wrote `verified`, `status: 'active'` and aggregate fields that `firestore.rules` rejects. Registration now creates a minimal `status: 'pending'` profile through `ensureVendorProfile`.
3. **Order state was client-writable** — vendors could set any status, skip states, and stock was never returned on cancellation. All transitions now go through `api/order-status.js`.
4. **Reviews were client-writable** — "Verified Purchase" and star ratings could be forged. Reviews now go through `api/reviews.js`, which checks a real order and recomputes aggregates.
5. **Payment proofs were world-readable** — screenshots sat under `product-images/`, which is public. The feature has since been removed entirely, so checkout no longer uploads any files.
6. **Cart allowed unbounded quantities** and product cards showed a default 4.5 rating. Both corrected.
7. **Checkout confirmation banner rendered literal `<span>` text** — broken JSX in the success state.

---

## C. Implementation summary

| Commit | Change |
|---|---|
| `1a95d6a` | `firestore.rules`, `storage.rules` hardened |
| `76cb774` | `api/order-status.js`, `api/reviews.js`, `src/config/api.js`, `vercel.json` |
| `e84a8aa` | Orders/vendor/admin/review UI wired to the APIs; product JSON-LD from live data |
| `5545009` | Cart stock clamping; sold-out product cards |
| `027b483` | Fabricated testimonials, counters and countdown removed; demo data off by default |
| `42a6775` | `usePageMeta` on all routes, robots.txt, sitemap generator, local placeholder asset |
| `badc07e` | 40 regression tests + CI workflow |
| `c0db183` | README: env vars, test/sitemap commands, pre-launch checklist |

Design decisions worth recording:

- **Backend is the only source of truth.** Prices, discounts, shipping, tax, stock and payment state are recomputed in `/api/create-order`; the client preview in `src/config/pricing.js` is explicitly a mirror.
- **One writer per collection.** Orders are created by `create-order`, mutated by `order-status`; reviews only by `reviews`. Firestore rules deny the alternatives.
- **No invented trust signals.** Where real data did not exist, the section was removed rather than filled with plausible-looking numbers.
- **Cancellation restores inventory exactly once** (`stockRestored` guard) and appends an audit entry.

---

## D. Testing report (actual results)

Environment: Windows, Node v24.19.0, Vite 5.4.21.

```
npm test    → tests 40, pass 40, fail 0, duration ~0.3–0.7s
npm run build → 1723 modules transformed, built in ~11–12s, no errors
node --check  → api/*.js and lib/*.cjs parse cleanly
```

Coverage by suite:

| Suite | Cases | What it proves |
|---|---|---|
| `tests/create-order.test.cjs` | 11 | Server pricing, client price tampering ignored, UPI/COD paths, UTR reuse rejected, stock limits, address validation, removed-method and card rejection |
| `tests/order-status.test.cjs` | 11 | Role matrix, allowed transitions, stock restoration, multi-vendor cancel refusal, idempotency, tracking URL validation, 404 |
| `tests/pricing.test.js` | 5 | Shipping threshold, tax, discount caps, COD split |
| `tests/coupons.test.js` | 6 | Code normalisation, expiry/usage/min-order, percent cap, fixed cap |
| `tests/payment-match.test.js` | 6 | UTR normalisation, amount parsing, paste parsing, matching, COD advance |
| `tests/ops.test.cjs` | 17 | Alert payload per channel, dedupe, webhook failure safety, backup encrypt/decrypt round-trip, tamper rejection, wrong-key rejection, Firestore type round-trip, retention pruning, cron auth (fails closed) |

**Not tested (honest gaps):**

- No browser E2E (Playwright/Cypress) — UI flows were verified by build + code review only.
- No test runs against a live Firestore project; the API tests use a mocked Firestore.
- No load/performance testing.
- No accessibility audit beyond semantic markup and focus styles.
- Payment verification against real bank SMS/email is out of scope (no gateway or observer is connected).

---

## E. Remaining requirements (blocking or decision-dependent)

| # | Requirement | Owner | Why it blocks |
|---|---|---|---|
| 1 | Rotate the Firebase service account key | You | A key exists in local `.env`; treat as exposed |
| 2 | ~~Deploy `firestore.rules`~~ | Done | Ruleset deployed 2026-10-31 and verified identical to `firestore.rules` |
| 3 | Set `VITE_SITE_URL` + regenerate sitemap | You | Canonicals point at the Vercel default |
| 4 | Legal review of Terms/Privacy | You | Templates, not legal advice |
| 5 | Delete/migrate legacy public payment proofs | You | Rules cannot retroactively revoke public objects; only matters if an old build ran |
| 6 | Configure backups + alerting | You | Code is in place (`/api/backup`, `/api/cron-health`, `lib/ops.cjs`); needs `CRON_SECRET`, `BACKUP_ENCRYPTION_KEY`, the Blob credentials and `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — see `docs/OPERATIONS.md` |
| 7 | Switch CSP from report-only to enforcing | You | After one report-free day (`vercel.json`) |
| 8 | Email notifications | Decision + provider | No provider configured; no order emails are sent |
| 9 | Payment gateway | Decision | Only UPI reference matching and COD exist |
| 10 | Returns/refund customer workflow | Decision | Policy undefined; only cancel + refund flag |
| 11 | Product pagination beyond the 50-item page | Engineering | `/products` loads one page of 50; no "load more" |
| 12 | Product variants | Engineering + data migration | Addons exist; size/colour does not |
| 13 | Server-side rendering/prerender | Engineering | Social crawlers see generic HTML |
| 14 | Address book, password change | Engineering | Addresses live in `localStorage` |

---

## F. Launch verdict

**READY AFTER MANUAL CONFIGURATION.**

The transactional core is now server-authoritative and covered by regression tests: a tampered cart cannot change the price, stock cannot be oversold at checkout, a UTR can only be claimed once, cancellations restore inventory, and neither order state nor reviews can be forged from the browser.

It is **not** ready to take real money until items 1, 3, 4, 5 and 6 in section E are completed (key rotation, canonical URL, legal review, legacy proof cleanup, backup/alert configuration). Items 8–14 are product gaps, not defects: the platform will not send order emails, will not accept cards, and has no customer-facing returns flow.

No claim is made about search rankings; SEO work here only removes technical blockers (unique metadata, canonicals, crawl rules, sitemap, structured data).
