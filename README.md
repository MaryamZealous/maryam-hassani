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
resilience-intelligence-system/
    index.html  + styles.css, data.js, *.jsx    the platform
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
