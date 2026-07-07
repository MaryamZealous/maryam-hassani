# Deploying — making the Conflict feed live

Every feed is live browser-direct **except Conflict**. Two facts drive its setup:

1. Browsers can't call GDELT (no CORS headers).
2. GDELT's API is reliable but **slow** — often 20–40s per query, well past the
   ~10s limit of a request-time serverless function.

So Conflict is fetched **at build time**, not at request time:

- `scripts/prefetch-conflict.js` runs during the Netlify build (which has a
  multi-minute budget), queries GDELT for 30-day conflict coverage per tracked
  country, and writes `resilience-intelligence-system/conflict.json`.
- The app loads that static file instantly (same-origin, no CORS, no timeout)
  and the Conflict chip reads **live**.
- If GDELT is unreachable during a build, the script writes `{ok:false}` and the
  app stays honestly **SIM** — the build never fails.

## Netlify (zero-config)

1. Push this `site/` folder to a repo (or connect it to Netlify).
2. Netlify reads `netlify.toml`:
   - `command = "node scripts/prefetch-conflict.js"` — prefetches GDELT.
   - `publish = "."` — serves the site (app at `/resilience-intelligence-system/`).
3. Deploy. Watch the build log — you'll see per-country article counts, e.g.
   `Iran: 812 articles`. After deploy, open
   `https://<your-site>/resilience-intelligence-system/conflict.json` — it should
   show `{"ok":true,"byCountry":{…},"events":…}`, and the app's Conflict chip
   will read **live**.

No API key is required — GDELT DOC 2.0 is free and keyless.

## Keeping it fresh

The prefetch runs on every deploy. To refresh conflict data automatically
without a code change, enable a **Netlify Scheduled Build** (Site settings →
Build & deploy → Build hooks / scheduled builds), e.g. once daily. 30-day
conflict volume barely moves hour to hour, so daily is plenty.

## The request-time function (optional)

`netlify/functions/gdelt-conflict.js` is still included as a secondary source —
the app tries `conflict.json` first, then that function. It will usually time
out because of GDELT's slowness, which is exactly why the build-time prefetch is
the primary path. You can delete it if you prefer; the app works either way.

## Other feeds

`ofac` already runs live browser-direct (OpenSanctions is CORS-open). `markets`
and `news` degrade gracefully to SIM; add functions at those paths later if you
want them live too.
