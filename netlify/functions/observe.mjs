/* Netlify Scheduled Function — server-side watcher for the shared episode log.
   Runs every 6 hours WITHOUT needing any visitor: fetches the same public
   feeds the dashboard uses, computes the live score with the same published
   drag formulas, and posts the observation to /episodes — so real disruptions
   are recorded even during weeks when nobody has the site open.

   Kept deliberately in lock-step with live.js §3 (same coefficients). If you
   change a drag weight there, change it here. Sanctions drift is session-based
   on the client and is reported as 0 here (it is capped at 0.5 pts anyway).

   CEILING mirrors the computed Structural Resilience in data.js — update it
   if the structural model changes materially.
*/
const CEILING = 54.7;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const p90 = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(0.9 * s.length))]; };

const PW_BASE = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query";
const PW_MAP = { hormuz: "chokepoint6", redsea: "chokepoint4", suez: "chokepoint1" };

async function chokeDrop(portid) {
  const url = PW_BASE + "?where=" + encodeURIComponent("portid='" + portid + "'")
    + "&outFields=date,n_total&orderByFields=date%20DESC&resultRecordCount=400&f=json";
  const r = await fetch(url);
  if (!r.ok) throw new Error("pw " + r.status);
  const rows = ((await r.json()).features || []).map((f) => f.attributes.n_total).filter((n) => n != null);
  if (rows.length < 30) throw new Error("pw thin");
  // same read as the client: 7-day average skipping the preliminary latest day,
  // vs the 90th-percentile 12-month busy-period norm
  const avg7 = rows.slice(1, 8).reduce((a, b) => a + b, 0) / 7;
  const norm = p90(rows.slice(0, 365));
  return Math.max(0, Math.round((1 - avg7 / norm) * 100));
}

async function waves() {
  const pts = { hormuz: [26.6, 56.5], redsea: [12.6, 43.4] };
  const out = {};
  for (const id in pts) {
    try {
      const [lat, lng] = pts[id];
      const r = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height`);
      out[id] = r.ok ? ((await r.json()).current || {}).wave_height : null;
    } catch (e) { out[id] = null; }
  }
  return out;
}

export default async () => {
  const base = process.env.URL || "";
  let liveFeeds = 0;

  // 1) chokepoint throughput (PortWatch)
  const ck = { hormuz: 0, redsea: 0, suez: 0 };
  try {
    const ids = Object.keys(PW_MAP);
    const drops = await Promise.all(ids.map((id) => chokeDrop(PW_MAP[id])));
    ids.forEach((id, i) => { ck[id] = drops[i]; });
    liveFeeds++;
  } catch (e) { /* stays 0 — counted as not live */ }
  const throughput = 0.047 * ck.hormuz + 0.020 * ck.redsea + 0.004 * ck.suez;

  // 2) sea state (Open-Meteo marine)
  let sea = 0;
  try {
    const w = await waves();
    const seaW = { hormuz: 0.8, redsea: 0.6 };
    let any = false;
    for (const id in seaW) if (w[id] != null) { any = true; sea += Math.max(0, w[id] - 1.2) * seaW[id]; }
    sea = clamp(sea, 0, 3);
    if (any) liveFeeds++;
  } catch (e) { sea = 0; }

  // 3) news pressure (own aggregator) — route + partner lanes, client weights
  let routeNews = 0, partnerNews = 0;
  try {
    const j = await (await fetch(base + "/.netlify/functions/news")).json();
    if (j && j.ok && j.areas) {
      const sc = (id) => { const a = j.areas[id]; return a && a.score != null ? clamp(a.score, 0, 1) : 0; };
      routeNews = clamp(sc("hormuz") * 2.2 + sc("redsea") * 1.4 + sc("suez") * 0.6 + sc("general") * 0.8, 0, 5);
      // partner consequence weights mirror data.js (gas 1.00, chips .70, leu .66, china max .55, india .77)
      partnerNews = clamp((sc("qatar") * 1.00 + sc("taiwan") * 0.70 + sc("kazakhstan") * 0.66 + sc("china") * 0.55 + sc("india") * 0.77) * 3.2, 0, 5);
      liveFeeds++;
    }
  } catch (e) { /* stays 0 */ }

  // 4) market stress (own markets function) — brent above its stress mark
  let market = 0;
  try {
    const j = await (await fetch(base + "/.netlify/functions/markets")).json();
    if (j && j.ok && j.brent != null) {
      const marginal = 0.125 * j.brent + 0.40;
      market = clamp(Math.max(0, j.brent - 96) * 0.12 + Math.max(0, marginal - 14) * 0.25, 0, 1.5);
      liveFeeds++;
    }
  } catch (e) { /* stays 0 */ }

  const drags = {
    throughput: +throughput.toFixed(2), routeNews: +routeNews.toFixed(2), partnerNews: +partnerNews.toFixed(2),
    sea: +sea.toFixed(2), market: +market.toFixed(2), sanctions: 0,
  };
  drags.total = +(throughput + routeNews + partnerNews + sea + market).toFixed(2);
  const live = +clamp(CEILING - drags.total, 25, CEILING).toFixed(1);

  // 5) hand the observation to the episodes function — the single writer
  try {
    await fetch(base + "/.netlify/functions/episodes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obs: { t: Date.now(), live, drags, chokes: { hormuz: ck.hormuz, redsea: ck.redsea }, liveFeeds, watcher: true } }),
    });
  } catch (e) { /* next run retries */ }

  return new Response(JSON.stringify({ ok: true, live, drags, liveFeeds }), { headers: { "Content-Type": "application/json" } });
};

export const config = { schedule: "0 */6 * * *" };
