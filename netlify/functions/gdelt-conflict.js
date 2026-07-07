/* ============================================================================
   gdelt-conflict — serverless proxy for the Conflict feed.

   Browsers cannot call GDELT directly (no CORS headers), so the app requests
   this function at /.netlify/functions/gdelt-conflict. It runs server-to-server
   (no CORS), queries GDELT DOC 2.0 for the last ~30 days of conflict-coded
   coverage per tracked country, and returns the shape feeds.js expects:

       { ok, byCountry: { Iran, Yemen, Sudan, Russia }, gulf, events, since }

   No API key required — GDELT DOC 2.0 is free and keyless.

   Debugging: append ?debug=1 to see per-country diagnostics (HTTP status,
   round-trip ms, response sample) even on success:
       /.netlify/functions/gdelt-conflict?debug=1
   ========================================================================== */

const VERSION = "4";

// Country names MUST match COUNTRY_ALIASES values in live.js.
const COUNTRIES = ["Iran", "Yemen", "Sudan", "Russia"];

// Kept short — long OR chains can trip GDELT's query limits and slow it down.
const CONFLICT_TERMS = "(airstrike OR missile OR drone OR shelling OR clashes OR militants OR fighting)";

// Sum the raw article-count timeline GDELT returns for a timelinevolraw query.
function sumTimeline(json) {
  const tl = json && json.timeline;
  if (!Array.isArray(tl) || !tl.length) return null;
  const series =
    tl.find((s) => /article count/i.test(s.series || "") && !/all/i.test(s.series || "")) || tl[0];
  const data = series && series.data;
  if (!Array.isArray(data)) return null;
  return data.reduce((acc, pt) => acc + (typeof pt.value === "number" ? pt.value : parseFloat(pt.value) || 0), 0);
}

// One country. Returns { count|null, dbg }.
async function fetchCountry(country) {
  const query = `${country} ${CONFLICT_TERMS}`;
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) +
    "&mode=timelinevolraw&format=json&timespan=1m";

  const dbg = { country };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (ris-conflict-proxy)" } });
    dbg.status = res.status;
    const text = await res.text();
    dbg.ms = Date.now() - t0;
    dbg.len = text.length;
    if (!res.ok) { dbg.sample = text.slice(0, 160); return { count: null, dbg }; }
    let json;
    try { json = JSON.parse(text); }
    catch (e) { dbg.parse = "non-json"; dbg.sample = text.slice(0, 160); return { count: null, dbg }; }
    const sum = sumTimeline(json);
    dbg.sum = sum;
    if (sum == null) dbg.sample = text.slice(0, 160);
    return { count: sum == null ? null : Math.round(sum), dbg };
  } catch (e) {
    dbg.ms = Date.now() - t0;
    dbg.err = String(e && e.name === "AbortError" ? "timeout" : (e && e.message) || e);
    return { count: null, dbg };
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async function (event) {
  const baseHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  // Cache only SUCCESS at the edge; never cache a failure (so a redeploy is not
  // masked by a stale 502 for 15 minutes).
  const okHeaders = Object.assign({}, baseHeaders, { "Cache-Control": "public, max-age=900, s-maxage=900" });
  const failHeaders = Object.assign({}, baseHeaders, { "Cache-Control": "no-store" });
  const debug = !!(event && event.queryStringParameters && event.queryStringParameters.debug);

  const start = new Date(Date.now() - 30 * 864e5);

  const byCountry = {};
  const diag = [];
  let total = 0, anyLive = false;

  // Fire all four in PARALLEL, so the function's wall-time is ~one request, not
  // the sum — this is what keeps it inside Netlify's 10s function limit.
  const results = await Promise.all(COUNTRIES.map((c) => fetchCountry(c)));
  results.forEach((r, i) => {
    diag.push(r.dbg);
    if (r.count != null) { byCountry[COUNTRIES[i]] = r.count; total += r.count; anyLive = true; }
  });

  if (!anyLive) {
    return {
      statusCode: 502,
      headers: failHeaders,
      body: JSON.stringify({ ok: false, error: "gdelt unavailable", _v: VERSION, diag }),
    };
  }

  const payload = {
    ok: true,
    byCountry,
    gulf: byCountry.Iran || 0,
    events: total,
    since: start.toISOString().slice(0, 10) + " (GDELT, 30-day conflict coverage)",
    _v: VERSION,
  };
  if (debug) payload.diag = diag;

  return { statusCode: 200, headers: okHeaders, body: JSON.stringify(payload) };
};
