/* Netlify Function — REAL OFAC sanctions data via OpenSanctions' free, public
   mirror of the US Treasury SDN list. No key required. Returns the live SDN
   entity count and the list's last-change date, fetched server-side.
   Deployed at /.netlify/functions/ofac

   Note: the dashboard's "new this week" figure is a proxy; OpenSanctions'
   public index exposes the total and last-change, which is what we surface as
   the genuine live connection. Swapping in OFAC's paid Sanctions List Service
   (SLS) would give exact weekly deltas.
*/
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=1800",
};

exports.handler = async function () {
  try {
    const r = await fetch("https://data.opensanctions.org/datasets/latest/us_ofac_sdn/index.json");
    if (!r.ok) throw new Error("opensanctions " + r.status);
    const j = await r.json();
    const total = j.entity_count != null ? j.entity_count
                : (j.thing_count != null ? j.thing_count
                : (j.target_count != null ? j.target_count : null));
    const updated = j.last_change || j.updated_at || j.last_export || null;
    const days = updated ? Math.max(0, Math.round((Date.now() - new Date(updated).getTime()) / 864e5)) : null;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, total, updated, daysSinceUpdate: days, ts: Date.now() }) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
