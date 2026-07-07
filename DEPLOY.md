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

## Keeping it fresh — automatic (GitHub Action)

`.github/workflows/refresh-conflict.yml` runs `scripts/prefetch-conflict.js`
on GitHub's runners (which have the network + time GDELT needs), then commits
the refreshed `conflict.json` back to the repo:

- **Daily** at 06:00 UTC (schedule), and on-demand from the **Actions** tab
  ("Run workflow"). It also runs once the first time the workflow file lands, to
  generate the first real file.
- Each commit it makes triggers Netlify to redeploy with fresh data — **as long
  as your Netlify site builds from this GitHub repo** (see below).

### One requirement: Netlify must deploy FROM GitHub

For the automation to reach the live site, the Netlify site has to be connected
to this repo (not a manual drag-drop site):

1. Netlify → **Add new site → Import an existing project → GitHub** →
   pick `MaryamZealous/maryam-hassani`.
2. Leave build settings blank — `netlify.toml` already sets the publish dir,
   functions dir, and the prefetch build command.
3. Deploy. From now on every push (including the Action's daily commit)
   auto-deploys, and the build also regenerates `conflict.json`.

If you keep deploying by drag-drop instead, the Action still refreshes the file
in GitHub, but you'd need to pull it into your upload — so the Git connection is
what makes it truly hands-off.

### Adding the workflow file

`.github` is a hidden folder, so a Finder drag-upload may skip it. Surest way:
on GitHub, **Add file → Create new file**, name it
`.github/workflows/refresh-conflict.yml`, paste the contents from this repo, and
commit.

## Manual one-off refresh (no GitHub Action)

Run it on your own machine, then upload the folder:

```
node scripts/prefetch-conflict.js
```

It prints per-country counts and writes real data into
`resilience-intelligence-system/conflict.json`.

## The request-time function (optional)

`netlify/functions/gdelt-conflict.js` is still included as a secondary source —
the app tries `conflict.json` first, then that function. It will usually time
out because of GDELT's slowness, which is exactly why the build-time prefetch is
the primary path. You can delete it if you prefer; the app works either way.

## Other feeds

`ofac` already runs live browser-direct (OpenSanctions is CORS-open). `markets`
and `news` degrade gracefully to SIM; add functions at those paths later if you
want them live too.
