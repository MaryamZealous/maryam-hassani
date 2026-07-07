/* ============================================================================
   prefetch-conflict.js — build-time fetch of the Conflict feed.

   GDELT's DOC API is reliable but SLOW (often 20-40s per query) — far past the
   ~10s limit of a request-time serverless function. So instead of fetching it
   when a visitor loads the page, we fetch it once here, during the Netlify
   BUILD (which has a multi-minute budget), and write a static conflict.json
   into the site. The app reads that static file instantly (same-origin, no
   CORS, no timeout), and it refreshes every time the site is rebuilt/deployed
   (enable a Netlify Scheduled Build to refresh it on a timer).

   Never fails the build: on any GDELT error it writes { ok:false } and the app
   falls back to its honest SIM state.

   Run automatically via netlify.toml:  command = "node scripts/prefetch-conflict.js"
   ========================================================================== */

const fs = require("fs");
const path = require("path");

const COUNTRIES = ["Iran", "Yemen", "Sudan", "Russia"];
const CONFLICT_TERMS = "(airstrike OR missile OR drone OR shelling OR clashes OR militants OR fighting)";
const OUT = path.join(__dirname, "..", "resilience-intelligence-system", "conflict.json");

function sumTimeline(json) {
  const tl = json && json.timeline;
  if (!Array.isArray(tl) || !tl.length) return null;
  const series =
    tl.find((s) => /article count/i.test(s.series || "") && !/all/i.test(s.series || "")) || tl[0];
  const data = series && series.data;
  if (!Array.isArray(data)) return null;
  return data.reduce((acc, pt) => acc + (typeof pt.value === "number" ? pt.value : parseFloat(pt.value) || 0), 0);
}

async function fetchCountry(country, attempt = 1) {
  const query = `${country} ${CONFLICT_TERMS}`;
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) +
    "&mode=timelinevolraw&format=json&timespan=1m";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000); // build can afford to wait
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (ris-conflict-prefetch)" } });
    const text = await res.text();
    if (res.status === 429) throw new Error("rate-limited (429)");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const sum = sumTimeline(JSON.parse(text));
    if (sum == null) throw new Error("no timeline");
    console.log(`  ${country}: ${Math.round(sum)} articles`);
    return Math.round(sum);
  } catch (e) {
    if (attempt < 5) {
      const wait = 4000 * attempt; // linear backoff: 4s, 8s, 12s, 16s
      console.log(`  ${country}: ${e.message} — retry ${attempt + 1}/5 in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
      return fetchCountry(country, attempt + 1);
    }
    console.log(`  ${country}: FAILED after 5 tries (${e.message})`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

(async function main() {
  console.log("Prefetching GDELT conflict coverage (30-day, per country)…");
  const start = new Date(Date.now() - 30 * 864e5);
  const byCountry = {};
  let total = 0, anyLive = false;

  // Sequential with generous spacing — GDELT rate-limits rapid back-to-back
  // queries, which is why an unspaced run returned only the first country.
  for (let i = 0; i < COUNTRIES.length; i++) {
    const n = await fetchCountry(COUNTRIES[i]);
    if (n != null) { byCountry[COUNTRIES[i]] = n; total += n; anyLive = true; }
    if (i < COUNTRIES.length - 1) await new Promise((r) => setTimeout(r, 6000));
  }

  let payload;
  if (anyLive) {
    payload = {
      ok: true,
      byCountry,
      gulf: byCountry.Iran || 0,
      events: total,
      since: start.toISOString().slice(0, 10) + " (GDELT, 30-day conflict coverage)",
      generated: new Date().toISOString(),
    };
    console.log(`Done: ${total} total articles across ${Object.keys(byCountry).length} countries.`);
  } else {
    payload = { ok: false, error: "gdelt unavailable at build", generated: new Date().toISOString() };
    console.log("GDELT unavailable — app will stay in SIM for conflict. Build continues.");
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload));
  console.log("Wrote " + OUT);
  // Always exit 0 — a slow/broken GDELT must never fail the deploy.
  process.exit(0);
})();
