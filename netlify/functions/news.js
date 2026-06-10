/* Netlify Function — REAL trade-route news via GDELT DOC 2.0.
   No API key required. GDELT ingests world news every 15 minutes; we query
   the rolling 2-day window for each chokepoint plus a general trade-disruption
   net, score how far above normal the coverage is, and return top headlines.
   Server-side fetch sidesteps any CSP/CORS quirks. Deployed at:
     /.netlify/functions/news
*/
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=180",
};

const QUERIES = {
  hormuz:  '"Strait of Hormuz"',
  redsea:  '"Bab-el-Mandeb" OR "Red Sea shipping"',
  suez:    '"Suez Canal"',
  general: '"shipping disruption" OR "port closure" OR "trade route"',
};
// typical 2-day article volume per query — the "normal" baseline to beat
const BASELINE = { hormuz: 25, redsea: 30, suez: 40, general: 70 };

async function gdelt(q) {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}`
    + `&mode=artlist&maxrecords=120&format=json&sort=datedesc&timespan=2d`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (resilience-system)" } });
  if (!r.ok) throw new Error(`gdelt ${r.status}`);
  const j = await r.json();
  return Array.isArray(j.articles) ? j.articles : [];
}

function summarize(id, arts) {
  const vol = arts.length;
  const base = BASELINE[id] || 40;
  const score = Math.max(0, Math.min(1, (vol / base - 1) / 2)); // 2× normal = full pressure
  const headlines = arts.slice(0, 6).map((a) => ({
    title: a.title, url: a.url, domain: a.domain, seendate: a.seendate,
  }));
  return { vol, score, headlines };
}

exports.handler = async function () {
  try {
    const ids = Object.keys(QUERIES);
    const results = await Promise.all(ids.map((id) => gdelt(QUERIES[id]).then(
      (arts) => summarize(id, arts),
      () => ({ vol: 0, score: 0, headlines: [] })   // per-query graceful
    )));
    const areas = {};
    ids.forEach((id, i) => { areas[id] = results[i]; });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, areas, ts: Date.now() }) };
  } catch (e) {
    // graceful: client keeps simulating news pressure if GDELT is unreachable
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
