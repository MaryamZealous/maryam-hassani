/* Netlify Function — REAL trade-route news via GDELT DOC 2.0.
   No API key required. GDELT ingests world news every 15 minutes.

   Why ONE combined query (not four):
   GDELT throttles to ~1 request / 5s per IP, and a Netlify function must finish
   inside its ~10s timeout. Four spaced requests can't satisfy both. So we make a
   single combined trade-route query (finishes in 1-2s, never throttled) and
   bucket the returned articles into chokepoints here, server-side. Server-side
   fetch also sidesteps GDELT's lack of CORS headers (a browser cannot call it
   directly). Deployed at: /.netlify/functions/news
*/
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=180",
};

// one net cast over all trade-route coverage; we sort by date and bucket below
const COMBINED =
  '("Strait of Hormuz" OR "Bab-el-Mandeb" OR "Red Sea shipping" OR "Suez Canal" '
  + 'OR "shipping disruption" OR "port closure" OR "trade route" OR "Houthi attack")';

// which returned articles belong to which chokepoint (general = the whole net)
const ROUTE_RE = {
  hormuz: /hormuz/i,
  redsea: /bab.?el.?mandeb|bab.?al.?mandab|red sea|houthi/i,
  suez:   /suez/i,
};
// typical 2-day article volume per bucket — the "normal" baseline to beat
const BASELINE = { hormuz: 22, redsea: 28, suez: 35, general: 90 };

async function gdelt(q, max) {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}`
    + `&mode=artlist&maxrecords=${max}&format=json&sort=datedesc&timespan=2d`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; resilience-system/1.0)" } });
  if (!r.ok) throw new Error(`gdelt ${r.status}`);
  const txt = await r.text();
  let j;
  // GDELT returns plain-text errors / throttle notices with HTTP 200, so a
  // JSON parse failure is the real signal that the call did not return data.
  try { j = JSON.parse(txt); }
  catch (e) { throw new Error("gdelt non-JSON: " + txt.slice(0, 80)); }
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

function bucket(arts) {
  const hit = { hormuz: [], redsea: [], suez: [] };
  for (const a of arts) {
    const hay = `${a.title || ""} ${a.url || ""} ${a.domain || ""}`;
    for (const id in ROUTE_RE) if (ROUTE_RE[id].test(hay)) hit[id].push(a);
  }
  return {
    hormuz:  summarize("hormuz", hit.hormuz),
    redsea:  summarize("redsea", hit.redsea),
    suez:    summarize("suez", hit.suez),
    general: summarize("general", arts),   // the whole trade-route net
  };
}

exports.handler = async function () {
  try {
    const arts = await gdelt(COMBINED, 250);
    const areas = bucket(arts);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, areas, ts: Date.now() }) };
  } catch (e) {
    // graceful: client falls back to its own attempt, then to simulation.
    // We NEVER fabricate zero articles — a failure is reported as ok:false.
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
