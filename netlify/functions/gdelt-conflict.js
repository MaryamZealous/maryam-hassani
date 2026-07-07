/* ============================================================================
   gdelt-conflict — serverless proxy for the Conflict feed.

   Browsers cannot call GDELT directly (it sends no CORS headers), so the app
   requests this function at /.netlify/functions/gdelt-conflict instead. It runs
   server-to-server — where CORS does not apply — queries GDELT DOC 2.0 for the
   last 30 days of conflict-coded English coverage per tracked country, and
   returns the shape feeds.js expects:

       { ok, byCountry: { Iran, Yemen, Sudan, Russia }, gulf, events, since }

   No API key required. GDELT DOC 2.0 is free and keyless.
   Deploy on Netlify (or any platform that runs this at that path) and the app's
   Conflict source flips from SIM to LIVE automatically — no front-end change.
   ========================================================================== */

// Country names MUST match COUNTRY_ALIASES values in live.js.
const COUNTRIES = ["Iran", "Yemen", "Sudan", "Russia"];

const CONFLICT_TERMS =
  "(airstrike OR airstrikes OR missile OR drone OR shelling OR clashes OR " +
  "militants OR insurgents OR gunmen OR offensive OR bombing OR fighting OR ceasefire)";

function stamp(d) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) +
    p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds())
  );
}

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

async function fetchCountry(country, sd, ed) {
  const query = `${country} ${CONFLICT_TERMS} sourcelang:english`;
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) +
    "&mode=timelinevolraw&format=json&startdatetime=" + sd + "&enddatetime=" + ed;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "ris-conflict-proxy" } });
    if (!res.ok) return null;
    const json = await res.json();
    const total = sumTimeline(json);
    return total == null ? null : Math.round(total);
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async function () {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    // GDELT updates ~every 15 min; cache at the edge to stay well within limits.
    "Cache-Control": "public, max-age=900, s-maxage=900",
  };

  const end = new Date();
  const start = new Date(end.getTime() - 30 * 864e5);
  const sd = stamp(start), ed = stamp(end);

  try {
    const counts = await Promise.all(COUNTRIES.map((c) => fetchCountry(c, sd, ed)));

    const byCountry = {};
    let total = 0, anyLive = false;
    COUNTRIES.forEach((name, i) => {
      if (counts[i] != null) { byCountry[name] = counts[i]; total += counts[i]; anyLive = true; }
    });

    if (!anyLive) {
      // Every country query failed — report not-ok so the app stays honestly SIM.
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: "gdelt unavailable" }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        byCountry,
        gulf: byCountry.Iran || 0,
        events: total,
        since: start.toISOString().slice(0, 10) + " (GDELT, 30-day conflict coverage)",
      }),
    };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: String(e && e.message || e) }) };
  }
};
