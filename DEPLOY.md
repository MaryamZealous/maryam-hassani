# Deploying — making the Conflict feed live

The site is fully static **except** for the Conflict feed. A browser can't call
GDELT directly (it sends no CORS headers), so the app requests a small
serverless proxy at `/.netlify/functions/gdelt-conflict`. Until that proxy is
running, the Conflict source honestly shows **SIM**; once it responds, the app
flips it to **LIVE** on its own — no front-end change.

## Netlify (zero-config)

1. Push this `site/` folder to a repo (or drag-drop it into Netlify).
2. Netlify reads `netlify.toml`:
   - `publish = "."` — serves the site (app lives at
     `/resilience-intelligence-system/`).
   - `functions = "netlify/functions"` — deploys `gdelt-conflict.js`.
3. Done. The function needs **no API key** (GDELT DOC 2.0 is free and keyless)
   and no environment variables.

Verify after deploy by opening
`https://<your-site>/.netlify/functions/gdelt-conflict` — you should get JSON
like `{"ok":true,"byCountry":{"Iran":…,"Yemen":…},"events":…}`. The Conflict
chip in the app will then read **live** instead of **sim**.

## Other platforms

The same code is a standard Node handler. On Vercel/Cloudflare, place an
equivalent function so it answers at the path `/.netlify/functions/gdelt-conflict`
(or add a rewrite to your own path and update the endpoint list in
`resilience-intelligence-system/feeds.js`).

## Optional: the other proxied feeds

`feeds.js` also looks for `markets`, `ofac`, `news`, and `episodes` functions.
`ofac` already runs live browser-direct (OpenSanctions is CORS-open), and the
others degrade gracefully to SIM. Add functions at those paths later if you want
Markets and News live too — the pattern is identical to `gdelt-conflict.js`.
