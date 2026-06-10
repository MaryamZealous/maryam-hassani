/* Netlify Function — REAL Brent crude + natural-gas prices.
   No API key required. Yahoo's chart endpoint is called server-side, so the
   browser CORS / key restrictions that block a direct call don't apply.
   Deployed automatically at:  /.netlify/functions/markets
*/
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=30",
};

async function quote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (resilience-system)" } });
  if (!r.ok) throw new Error(`yahoo ${symbol} ${r.status}`);
  const j = await r.json();
  const m = j.chart.result[0].meta;
  const price = m.regularMarketPrice;
  const prev = m.chartPreviousClose != null ? m.chartPreviousClose
             : (m.previousClose != null ? m.previousClose : price);
  return { price, prev };
}

exports.handler = async function () {
  try {
    const [brent, natgas] = await Promise.all([quote("BZ=F"), quote("NG=F")]);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        ok: true,
        brent: brent.price, brentPrev: brent.prev,
        natgas: natgas.price, natgasPrev: natgas.prev,
        ts: Date.now(),
      }),
    };
  } catch (e) {
    // graceful: client keeps simulating markets if Yahoo is unreachable
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
