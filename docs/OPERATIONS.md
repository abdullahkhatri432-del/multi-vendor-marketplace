# Operations Runbook

Everything here is about keeping a live store alive: backups, alerting, the daily
health check, and what to do when something breaks. Product/deployment details
live in the [README](../README.md).

---

## 1. What runs automatically

| Job | Schedule (UTC) | Endpoint | Purpose |
|---|---|---|---|
| Backup | `18:30` daily (00:00 IST) | `GET /api/backup` | Encrypts every collection to Vercel Blob |
| Daily check | `06:00` daily (11:30 IST) | `GET /api/cron-health` | Probes `/api/health`, checks backup age, alerts on failure |

Both are declared in `vercel.json` → `crons` and are authenticated with
`CRON_SECRET`: Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
Without that variable both endpoints return **401** (they fail closed).

Both crons are once-daily because the Vercel Hobby plan caps cron jobs at two
per project, one run per day each.

### Required environment variables

| Variable | Needed by | Notes |
|---|---|---|
| `CRON_SECRET` | both crons | `openssl rand -hex 32` |
| `BACKUP_ENCRYPTION_KEY` | backup, restore | `openssl rand -hex 32` — store it in a password manager; without it backups are unreadable |
| `BLOB_READ_WRITE_TOKEN` | backup, daily check | Created automatically when a static-token Blob store is connected to the Vercel project |
| `BLOB_STORE_ID` | backup, daily check | Alternative to the token: injected when a store is connected via OIDC, which @vercel/blob authenticates with `VERCEL_OIDC_TOKEN` automatically |
| `BLOB_ACCESS` | backup | `public` or `private` — must match how the store was created. **This project's store is `private`.** A wrong value is retried once with the other mode, so it costs a log line, not a backup |
| `ALERT_WEBHOOK_URL` | all error paths | Optional extra channel: Slack, Discord, or any endpoint that accepts JSON |
| `TELEGRAM_BOT_TOKEN` | all error paths | Bot token from @BotFather (recommended channel) |
| `TELEGRAM_CHAT_ID` | all error paths | Your chat id — see below |
| `SITE_URL` | daily check | Defaults to `VITE_SITE_URL`, then `https://speedersmania.vercel.app` |

Nothing alerts until at least one channel is configured (`TELEGRAM_BOT_TOKEN` +
`TELEGRAM_CHAT_ID`, or `ALERT_WEBHOOK_URL`) — errors are still logged to the
Vercel function logs, but nobody is notified. **Set Telegram before launch.**

---

## 2. Backups

### What is stored

One encrypted file per collection plus a manifest, per daily run:

```
backups/2026-11-01/183005-orders.json.enc
backups/2026-11-01/183005-products.json.enc
...
backups/2026-11-01/183005-manifest.json.enc   # counts + sha256 of each file
```

Collections: `products`, `orders`, `users`, `vendors`, `reviews`, `coupons`,
`utrs`.

Properties:

- **Encrypted with AES-256-GCM** before upload. Blob URLs are public, so the
  file is intentionally useless without `BACKUP_ENCRYPTION_KEY`; a tampered file
  fails authentication instead of restoring corrupt data.
- **Firestore types survive**: timestamps, document references, GeoPoints and
  bytes are tagged and rebuilt on restore.
- **14 days retained.** Older daily folders are pruned automatically each run.
- **5,000 documents per collection per run.** If a collection exceeds that, the
  manifest marks it `truncated` and an alert fires — the backup is still useful,
  but it is not complete. Raise `MAX_DOCS_PER_COLLECTION` in `api/backup.js` (or
  split the export) before that happens; at current volume it is far away.

### Run one manually

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://speedersmania.vercel.app/api/backup
```

The response lists each collection with its document count, byte size and
`sha256`, plus the manifest path.

If it returns **500**, the body now includes a `detail` field with the error
message (safe to show: the caller already presented `CRON_SECRET`, and the
summary carries no stack and no secrets). The two failures seen in practice:

| `detail` | Fix |
|---|---|
| `Cannot use public access on a private store` | The store is private — set `BLOB_ACCESS=private` (the code retries automatically, but the variable removes the wasted attempt) |
| `No Blob store is connected` / 503 | `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` is missing from the project |

The very first run on the current project hit exactly the first case; it is now
configured with `BLOB_ACCESS=private`.

### Restore

The script is **dry-run by default** and merges fields rather than replacing
documents, so a partial restore cannot erase data the backup does not contain.

```bash
# 1. Inspect what a backup contains — writes nothing
npm run restore -- --from ./backups/2026-11-01/183005-manifest.json.enc --list

# 2. Restore a single collection from a signed Blob URL
npm run restore -- --from https://<blob-url>/183005-orders.json.enc --only orders

# 3. Apply it
npm run restore -- --from ./183005-orders.json.enc --only orders --write
```

Flags: `--only <collection>`, `--write`, `--replace` (overwrite instead of
merge), `--list`.

Restore needs `FIREBASE_SERVICE_ACCOUNT` and `BACKUP_ENCRYPTION_KEY` in `.env`,
and will refuse to start without them.

> Restoring `users` restores profile documents only — **Firebase Auth accounts
> are not part of the backup** and are not recreated. A deleted Auth user must be
> recreated in the Firebase console; their password can never be recovered
> (passwords are not stored).

---

## 3. Alerting

Alerts go to **Telegram** by default and to any extra `ALERT_WEBHOOK_URL` if one
is set. Channels are independent: if one is misconfigured, the other still fires.

### Telegram setup (recommended)

1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → pick a name → copy the token.
2. Open your new bot and send it any message (a bot cannot message you first).
3. Read your chat id:

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
   # -> "chat":{"id":123456789,...}
   ```

4. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Vercel, then redeploy.

Messages are plain text (no MarkdownV2) on purpose: escaping rules would turn an
unescaped `_` in an error message into a 400, i.e. the alert about the outage
would be the thing that fails.

### Other channels

| `ALERT_WEBHOOK_URL` | Payload |
|---|---|
| `discord.com/api/webhooks/...` | `{ "content": "🚨 **title**\ndetail" }` |
| `hooks.slack.com/...` | `{ "text": "🚨 *title*\ndetail" }` |
| anything else | `{ level, title, detail, source, at, text }` |

A generic endpoint lets you reach email through a relay (Zapier/Make/n8n). No
mail provider is bundled, so there is no dependency on one.

What alerts, and what to do:

| Alert title | Meaning | First response |
|---|---|---|
| `Checkout failed (HTTP 500)` | A customer could not place an order | Check Vercel logs for `[create-order] failed:`; the message names the cause. Re-run the affected order manually if the customer paid |
| `Order update failed (HTTP 500)` | Status change / cancel failed — stock may not be restored | Re-run the transition from the admin dashboard; verify `products.stock` |
| `Review write failed (HTTP 500)` | Review not saved / aggregates not recomputed | Retry from the product page |
| `Firestore backup failed` | No backup was written today | Check `BLOB_READ_WRITE_TOKEN` and `BACKUP_ENCRYPTION_KEY`, then run the endpoint manually |
| `Backup is not configured` | Missing key or Blob token — backups are not running | Add the variable, redeploy, run manually |
| `Backup is truncated` | A collection passed 5,000 documents | Raise the cap in `api/backup.js` |
| `Daily check: site is unhealthy` | `/api/health` failed or backup is >36h old | Check Vercel status + function logs; see §1 |
| `CSP violation: <directive>` | A browser blocked a resource under the new policy | See §5 — this is expected during the report-only window |

Identical alerts are deduped for 5 minutes per warm instance to avoid a webhook
storm when a dependency is down.

### Health endpoint

`GET /api/health` returns `200 {"status":"ok",...}` or `503`. Point a free
external monitor (Better Stack, UptimeRobot, Healthchecks.io) at it as well: the
Vercel cron cannot report a full Vercel outage, because it runs on Vercel.

---

## 4. Incident runbook

**Checkout is failing.** Work through these in order:

1. `curl https://speedersmania.vercel.app/api/health` — is the API up and is Firestore reachable?
2. Vercel → Deployments: was there a deploy in the last hour? Roll back to the previous one if so.
3. Vercel → Logs, filter `[create-order] failed:` — the message names the cause (missing env var, rules denial, quota).
4. Firestore → Usage: Spark caps at 50k reads / 20k writes per day. Exceeding them fails writes until midnight Pacific.
5. If the failure started right after a rules deploy, re-deploy the previous ruleset from the Firebase console (Rules → history).

**Deploying Firestore rules.** Always deploy the app that matches the rules
first: rules deny client writes, so an old client that writes orders/reviews
directly breaks the moment the rules land.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Storage rules are not needed (the app has no uploads).

**Rotating the service account key.** Firebase console → Project settings →
Service accounts → generate a new key, update `FIREBASE_SERVICE_ACCOUNT` in
Vercel, redeploy, then delete the old key. Do this at least once now: the
current key has sat in a local `.env`.

---

## 5. Content-Security-Policy rollout

`vercel.json` ships the policy as **`Content-Security-Policy-Report-Only`**, which
reports violations to `/api/csp-report` without blocking anything. That is
deliberate: the policy has to cover every origin the checkout, auth and analytics
flows touch, and a wrong entry would break login or payment for real customers.

Rollout:

1. Deploy, then use the site normally for a day: sign in, add to cart, check out with UPI and COD, open admin.
2. Watch for `CSP violation:` alerts (or `[csp] violation:` in the Vercel logs).
3. Each report names the blocked origin and directive. Add legitimate origins to the matching directive in `vercel.json`.
4. When a full day passes with **zero** reports, rename the header key to
   `Content-Security-Policy` and redeploy — protection is now enforcing.

Current policy in plain terms:

- Scripts only from this origin, Google Tag Manager and the (optional) Meta pixel.
- No `unsafe-inline` for scripts — this is what actually stops injected code.
- Network calls limited to Firebase/Google APIs, Google Analytics and GTM.
- Images may come from anywhere over HTTPS because vendors scrape product photos from arbitrary stores.
- Frames may only be Firebase Auth or Google accounts; the site itself cannot be framed.

---

## 6. Known limits

| Limit | Value | Consequence |
|---|---|---|
| Backup history | 14 days | Anything older is pruned; copy important snapshots elsewhere |
| Docs per collection per backup | 5,000 | Alert fires and the manifest is marked `truncated` |
| Backup cadence | once per day (Hobby cron) | Up to 24h of data loss in a disaster; fine for a store at this volume |
| Cron count | 2 (Hobby) | Adding a third job needs the Pro plan or an external scheduler |
| Auth users in backup | not included | Recreate accounts manually if Auth is lost |
| Alert channels | Telegram + one optional webhook | No SMS/pager escalation; both are fire-and-forget |
