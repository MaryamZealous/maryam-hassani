# maryam-hassani — personal site

A four-part site: a homepage, a **Learn** influence map, a **Build** showcase, and the
**Resilience Intelligence System** platform. Plain HTML + React (via CDN) — no build step,
no server. It runs by just opening the files.

## Structure

```
index.html                          Homepage          → your-domain.com
learn.html                          Influence map     → your-domain.com/learn.html
build.html                          Project showcase  → your-domain.com/build.html
home.css pages.css learn.css build.css      stylesheets
fractal.jsx homepages.jsx                   homepage scripts
learn-data.js learn-graph.jsx               Learn map (edit learn-data.js to change nodes)
assets/platform-preview.png                 Build page preview image
netlify.toml                                Netlify config (static site + functions)
netlify/functions/                          serverless proxies for the real data feeds
resilience-intelligence-system/
    index.html  + styles.css, data.js, *.jsx    the platform
    live.js  feeds.js                            live-data engine + real-feed adapter
                                    → your-domain.com/resilience-intelligence-system
```

## Deploy (free, ~5 minutes)

### 1. Put the files on GitHub
- Repo: https://github.com/MaryamZealous/maryam-hassani
- On the repo page → **Add file → Upload files**
- Drag in **everything inside this folder** (the files plus the `assets` and
  `resilience-intelligence-system` folders — structure is preserved)
- **Commit changes**

### 2. Connect Netlify (free hosting + auto-deploy)
- https://netlify.com → **Add new site → Import an existing project → GitHub**
- Pick **maryam-hassani**, leave build settings empty (it's a static site), **Deploy**
- You immediately get a live URL like `random-name.netlify.app`
- Every future upload to GitHub redeploys automatically

### 3. Connect your domain
- Buy only the domain (no hosting / SSL / DNS add-ons needed)
- Netlify → **Domain settings → Add a custom domain** → enter `maryam-hassani.com`
- Netlify shows the DNS records to paste at your registrar
- HTTPS (the padlock) is added automatically and free

Final URLs:
- `maryam-hassani.com` — homepage
- `maryam-hassani.com/resilience-intelligence-system` — the platform

## Editing later
Update the source, re-upload the changed files to GitHub (Add file → Upload files,
or edit in place on github.com), and Netlify redeploys in ~30 seconds.

To change the Learn map, edit **learn-data.js** — it's a plain list of nodes, links, and notes.

## Live data feeds

The platform updates continuously. Feeds fall into three tiers — each one shows a
**● Live** or **○ Sim** badge in the platform's *How this works → Data sources* panel,
and a coloured dot in the top status bar.

**Real immediately, no setup** (work the moment the site is live — they're called
straight from the browser because they allow it):
- **IMF PortWatch** — real daily chokepoint transit calls from satellite AIS on ~90,000
  ships, for Hormuz / Bab-el-Mandeb / Suez. Drives the **Maritime throughput** driver —
  the biggest input to Live Stress. Shown on the chokepoint cards as transit calls/day vs
  each strait's 12-month norm. Updates weekly (Tuesdays).
- **Google News (+ GDELT fallback)** — live world-news monitor for trade-route closure /
  conflict coverage. Powers the **Trade-route news monitor** panel and the news-pressure
  driver. Shown in the platform as "Google News". Updates every 6 min.
- **Open-Meteo** — live sea-state (wave height) + wind at Hormuz / Bab-el-Mandeb /
  Suez and Gulf temperature. Shown on the chokepoint cards as "Sea state".
- **OFAC / OpenSanctions** — live US Treasury SDN entity count.

**Real after deploy, no key** — the `netlify/functions/` proxies do this automatically
once the site is on Netlify (browsers can't call these directly, so they're fetched
server-side; they also act as a robustness fallback for PortWatch & GDELT):
- **Markets** — real Brent crude + natural-gas prices (Yahoo). Function: `markets.js`.
- **PortWatch / GDELT fallbacks** — `portwatch.js`, `news.js` (only used if the
  browser-direct call is ever blocked by a strict CSP).

**Real once you add free credentials** (otherwise they stay simulated, clearly marked):
- **ACLED** (conflict) — register free at https://acleddata.com/register/, then in
  Netlify → *Site settings → Environment variables* add `ACLED_EMAIL` (the email you
  registered with) and `ACLED_PASSWORD` (your myACLED password). ACLED now uses OAuth2
  (the old API key was retired 15 Sep 2025); the `acled.js` function authenticates with
  these and refreshes its token automatically. Redeploy after adding the variables.

The only signal with no free real source is sub-daily live vessel positions (paid AIS);
PortWatch covers the throughput at weekly cadence instead. Nothing breaks if a feed is
unreachable — that signal simply keeps simulating and is labelled **Sim**. The functions
deploy automatically; you don't run anything.
