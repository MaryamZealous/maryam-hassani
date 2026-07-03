/* ============================================================================
   feeds.js — real-data adapter. Sits on top of live.js and replaces simulated
   values with genuine live data wherever a real, reachable source exists:

     • Open-Meteo  — REAL now, browser-direct, no key, no setup.
                     Live sea-state (wave height) + wind at the three chokepoints
                     and Gulf temperature. CORS-clean, verified.
     • Markets     — REAL once the Netlify function /.netlify/functions/markets
                     is deployed (Yahoo, server-side, no key). Browsers can't call
                     Yahoo directly (no CORS), so it is proxied.
     • ACLED/OFAC  — REAL via their functions when an API key env-var is set.

   Every source degrades gracefully: if a real fetch fails (offline, not yet
   deployed, no key), live.js keeps simulating that one source and the UI marks
   it SIM instead of LIVE. Nothing ever breaks.
   ========================================================================== */
(function () {
  if (!window.LIVE) return;
  const REAL = LIVE.real;                       // { vals, prev, status, meteo }
  const setStatus = (src, mode) => { REAL.status[src] = mode; if (RD.sources[src]) RD.sources[src].mode = mode; };

  // chokepoint coordinates (lat,lng) for the environmental read
  const CK_PT = { hormuz: [26.5, 56.5], redsea: [12.6, 43.3], suez: [30.0, 32.55] };
  const UAE_PT = [24.45, 54.37];                // Abu Dhabi

  const jget = (url) => fetch(url, { mode: "cors" }).then((r) => { if (!r.ok) throw 0; return r.json(); });
  const asArray = (x) => Array.isArray(x) ? x : [x];

  /* ---- 1. Open-Meteo: real sea state + temperature (zero setup) --------- */
  async function pullMeteo() {
    const ids = Object.keys(CK_PT);
    const lats = ids.map((k) => CK_PT[k][0]).concat(UAE_PT[0]).join(",");
    const lngs = ids.map((k) => CK_PT[k][1]).concat(UAE_PT[1]).join(",");
    try {
      const [marine, wx] = await Promise.all([
        jget(`https://marine-api.open-meteo.com/v1/marine?latitude=${ids.map((k) => CK_PT[k][0]).join(",")}&longitude=${ids.map((k) => CK_PT[k][1]).join(",")}&current=wave_height`),
        jget(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,wind_speed_10m`),
      ]);
      const mArr = asArray(marine), wArr = asArray(wx);
      const sea = {};
      ids.forEach((k, i) => {
        const wave = mArr[i] && mArr[i].current ? mArr[i].current.wave_height : null;
        const wind = wArr[i] && wArr[i].current ? wArr[i].current.wind_speed_10m : null;
        sea[k] = { wave: wave, wind: wind != null ? Math.round(wind / 1.852 * 10) / 10 : null }; // km/h → kn
        const c = RD.chokepoints.find((c) => c.id === k);
        if (c && wave != null) c.sea = sea[k];
      });
      const uae = wArr[ids.length] && wArr[ids.length].current;
      REAL.meteo = { sea, uaeTemp: uae ? uae.temperature_2m : null, ts: Date.now() };
      setStatus("meteo", "live");
      RD.sources.meteo && (RD.sources.meteo._ts = Date.now());
    } catch (e) { setStatus("meteo", "sim"); }
  }

  /* ---- 2. Markets: real Brent + NatGas via Netlify function ------------- */
  async function pullMarkets() {
    try {
      const j = await jget("/.netlify/functions/markets");
      if (!j || !j.ok) throw 0;
      if (j.brent != null)  { REAL.vals.brent  = j.brent;  REAL.prev.brent  = j.brentPrev  || j.brent; }
      REAL.vals._marketsTs = j.ts || Date.now();
      RD.sources.yfinance._ts = Date.now();
      setStatus("yfinance", "live");
    } catch (e) {
      delete REAL.vals.brent;
      setStatus("yfinance", "sim");
    }
  }

  /* ---- 3. ACLED conflict via function (real only with a key) ------------ */
  async function pullAcled() {
    try {
      const j = await jget("/.netlify/functions/acled");
      if (!j || !j.ok) throw 0;
      if (j.events != null) RD.convergence._realEvents = j.events;
      // per-partner conflict counts back the trade-partner risk + scenario actors
      REAL.acled = { byCountry: j.byCountry || {}, gulf: j.gulf, events: j.events, since: j.since, ts: Date.now() };
      RD.sources.acled._ts = Date.now();
      setStatus("acled", "live");
    } catch (e) { delete REAL.vals.gpsjam; delete REAL.acled; setStatus("acled", "sim"); }
  }

  /* ---- 4. OFAC sanctions via function (real OpenSanctions mirror) ------- */
  async function pullOfac() {
    const apply = (j) => {
      if (!j || !j.ok || j.total == null) return false;
      RD.sources.ofac._total = j.total;
      RD.sources.ofac.full = `US Treasury SDN — ${Number(j.total).toLocaleString()} entities (OpenSanctions, live)`;
      RD.sources.ofac._ts = Date.now();
      setStatus("ofac", "live");
      return true;
    };
    try {
      if (apply(await jget("/.netlify/functions/ofac"))) return;
      throw 0;
    } catch (e) {
      // fallback: OpenSanctions directly (works wherever its CORS allows it)
      try {
        const d = await jget("https://data.opensanctions.org/datasets/latest/us_ofac_sdn/index.json");
        if (apply({ ok: true, total: d.entity_count != null ? d.entity_count : (d.thing_count != null ? d.thing_count : d.target_count) })) return;
      } catch (e2) {}
      setStatus("ofac", "sim");
    }
  }

  /* ---- 6. IMF PortWatch — REAL daily chokepoint transits (satellite AIS) -- */
  // ArcGIS Online feature service, keyless and CORS-clean. Maps our three
  // chokepoints to PortWatch's portids; current = 7-day trailing average,
  // baseline = the chokepoint's busy-period norm (90th percentile over the last
  // 12 months), so a sustained collapse still reads as a real drop rather than
  // quietly becoming "the new normal".
  const PW_BASE = "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query";
  const PW_MAP = { hormuz: "chokepoint6", redsea: "chokepoint4", suez: "chokepoint1" };
  const pctile = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))] : 0; };
  async function pwQuery(portid) {
    const url = PW_BASE + "?where=" + encodeURIComponent("portid='" + portid + "'")
      + "&outFields=date,n_total&orderByFields=date%20DESC&resultRecordCount=365&f=json";
    const j = await jget(url);
    return (j && j.features) ? j.features.map((f) => f.attributes) : []; // newest first
  }
  async function pullPorts() {
    try {
      const ids = Object.keys(PW_MAP);
      const sets = await Promise.all(ids.map((id) => pwQuery(PW_MAP[id]).catch(() => [])));
      const choke = {};
      ids.forEach((id, i) => {
        const rows = sets[i]; if (!rows || rows.length < 8) return;
        const totals = rows.map((r) => (r.n_total != null ? r.n_total : 0)); // newest first
        const recent7 = totals.slice(1, 8);                 // skip latest (preliminary) day
        const current = recent7.reduce((a, b) => a + b, 0) / recent7.length;
        const baseline = Math.max(pctile(totals, 90), current, 1);  // 12-month busy-period norm
        const drop = Math.max(0, Math.round((1 - current / baseline) * 100));
        const spark = totals.slice(0, 8).reverse().map((x) => Math.round(x));
        choke[id] = { current: Math.round(current), baseline: Math.round(baseline), drop, spark, date: rows[0].date };
      });
      if (!Object.keys(choke).length) throw 0;
      REAL.choke = choke;
      RD.chokepoints.forEach((c) => {
        const d = choke[c.id]; if (!d) return;
        c.vessels = d.current; c.baseline = d.baseline; c.drop = d.drop; c.spark = d.spark;
        c.real = true; c.asof = d.date;
        c.band = d.drop >= 55 ? "critical" : d.drop >= 30 ? "high" : d.drop >= 12 ? "moderate" : "good";
      });
      const s = RD.sources.ais;
      s.kind = "live"; s.label = "PortWatch"; s._ts = Date.now();
      s.full = "Daily chokepoint transit calls (IMF PortWatch · satellite AIS)";
      s.endpoint = "services9.arcgis.com · Daily_Chokepoints_Data · n_total vs 12-month norm";
      s.url = "https://portwatch.imf.org/";
      s.cadence = "weekly (Tue)";
      setStatus("ais", "live");
    } catch (e) { setStatus("ais", "sim"); }
  }

  /* ---- 5. Live news — trade-route / closure / partner-supply detector.
     Fetched exclusively via the serverless function (Google News RSS primary,
     GDELT fallback, both server-side — neither sends CORS headers). There is
     deliberately NO browser-side public-proxy fallback: an unaudited proxy in
     the data path could inject fabricated headlines. If the function is
     unreachable the feed is reported honestly as SIM, never as fake data. */
  function applyNews(areas) {
    const laneList = Object.values(areas || {});
    const okLanes = laneList.filter((a) => a && a.vol != null).length;
    RD.sources.gdelt.full = "Supply & trade-route news monitor (Google News RSS, live · GDELT fallback) · " + okLanes + "/" + laneList.length + " lanes reporting";
    REAL.news = areas;
    RD.convergence._news = areas;
    RD.sources.gdelt._ts = Date.now();
    setStatus("gdelt", "live");
  }
  async function pullNews() {
    // an aggregator response only counts if at least one area carries real data
    // (vol != null) — an all-null/failed payload falls through to SIM.
    try {
      const j = await jget("/.netlify/functions/news");
      if (j && j.ok && j.areas && Object.values(j.areas).some((a) => a && a.vol != null)) { applyNews(j.areas); return; }
      throw 0;
    } catch (e) { setStatus("gdelt", "sim"); }
  }

  /* ---- schedule -------------------------------------------------------- */
  // AIS chokepoint throughput now has a real free source (IMF PortWatch); it is
  // marked SIM only until the first successful pull, then flips to LIVE.
  setStatus("ais", "sim");
  ["yfinance", "acled", "ofac", "meteo", "gdelt"].forEach((s) => setStatus(s, "sim"));

  function cycle() { pullMeteo(); pullMarkets(); pullAcled(); pullOfac(); pullNews(); pullPorts(); }
  cycle();                          // immediate
  setInterval(pullMeteo, 10 * 60 * 1000);   // weather: every 10 min
  setInterval(pullMarkets, 60 * 1000);      // markets: every 60 s
  setInterval(pullAcled, 5 * 60 * 1000);    // conflict: every 5 min
  setInterval(pullOfac, 30 * 60 * 1000);    // sanctions: every 30 min
  setInterval(pullNews, 6 * 60 * 1000);     // news: every 6 min
  setInterval(pullPorts, 30 * 60 * 1000);   // chokepoint transits: every 30 min (weekly source)

  LIVE.refreshFeeds = cycle;
})();
