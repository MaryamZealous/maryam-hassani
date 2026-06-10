/* Netlify Function — REAL daily chokepoint transits from IMF PortWatch.
   ArcGIS Online feature service, keyless. Browsers can call it directly (CORS
   is open), so this function is only a CSP/robustness fallback. Returns the
   raw recent daily series per chokepoint; the client computes the 7-day avg
   and 12-month norm. Deployed at: /.netlify/functions/portwatch
*/
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600",
};
const BASE = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query";
const MAP = { hormuz: "chokepoint6", redsea: "chokepoint4", suez: "chokepoint1" };

async function series(portid) {
  const url = BASE + "?where=" + encodeURIComponent("portid='" + portid + "'")
    + "&outFields=date,n_total&orderByFields=date%20DESC&resultRecordCount=120&f=json";
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (resilience-system)" } });
  if (!r.ok) throw new Error("portwatch " + r.status);
  const j = await r.json();
  return (j.features || []).map((f) => ({ date: f.attributes.date, n_total: f.attributes.n_total }));
}

exports.handler = async function () {
  try {
    const ids = Object.keys(MAP);
    const sets = await Promise.all(ids.map((id) => series(MAP[id]).catch(() => [])));
    const choke = {};
    ids.forEach((id, i) => { choke[id] = sets[i]; });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, choke, ts: Date.now() }) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
