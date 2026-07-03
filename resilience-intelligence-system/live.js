/* ============================================================================
   Live engine — turns the illustrative dataset into a continuously-updating
   feed. It mutates RD in place on a clock and notifies React subscribers so
   the whole dashboard ticks: markets stream, vessel counts move, the Live
   Stress score and the gap recompute from them, and feed timestamps age.

   Honest by design: fast feeds (markets, AIS vessels, conflict counts) stream
   every tick; the structural baseline and sector fundamentals drift only on a
   slow cadence, because they are slow-moving by definition. Swap the internal
   step() math for a real proxy response and the same wiring shows live data.
   ========================================================================== */
window.LIVE = (function () {
  const subs = new Set();
  const notify = () => { for (const f of subs) { try { f(); } catch (e) {} } };

  // mean-reverting random walk: pull toward anchor + bounded noise
  const rw = (cur, anchor, vol, pull) =>
    cur + (anchor - cur) * pull + (Math.random() * 2 - 1) * vol;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // real-feed overlay (populated by feeds.js): when a value is present here it
  // overrides the simulation for that signal and the source is marked LIVE.
  const REAL = { vals: {}, prev: {}, status: {}, meteo: null, news: null, choke: null };

  /* ---- live feed clocks (seconds) -------------------------------------- */
  const FEEDS = {
    yfinance: { age: 62,   cad: 5 },
    ais:      { age: 240,  cad: 7 },
    acled:    { age: 125,  cad: 13 },
    ofac:     { age: 7200, cad: 200 },
  };
  const now0 = Date.now();
  for (const k in FEEDS) {
    const s = RD.sources[k];
    s._ts = now0 - FEEDS[k].age * 1000;
    s._cad = FEEDS[k].cad * 1000;
    s._next = now0 + FEEDS[k].cad * 1000;
  }
  function freshText(src) {
    const s = RD.sources[src];
    if (!s || !s._ts) return s ? s.fresh : "";
    const sec = Math.max(0, Math.round((Date.now() - s._ts) / 1000));
    if (sec < 5) return "now";
    if (sec < 60) return sec + "s ago";
    const m = Math.floor(sec / 60);
    if (m < 60) return m + " min ago";
    return Math.floor(m / 60) + " h ago";
  }

  /* ---- streaming numeric state ----------------------------------------- */
  // Sim anchors are the depressed CRISIS levels each strait mean-reverts to,
  // chosen so the simulated drop matches each strait's curated baseline drop:
  //   Hormuz ~6/113 ≈ −95% · Red Sea ~35/42 ≈ −17% · Suez ~40/47 ≈ −15%.
  // (When IMF PortWatch connects, real transits override these entirely.)
  const CK = {
    hormuz: { anchor: 6,   vol: 1.1, pull: 0.08 },
    redsea: { anchor: 35,  vol: 1.4, pull: 0.07 },
    suez:   { anchor: 40,  vol: 1.6, pull: 0.06 },
  };
  const ckState = {};
  RD.chokepoints.forEach((c) => { ckState[c.id] = c.vessels; });

  // leading-indicator anchors. fmt turns the number into the displayed value.
  const IND = {
    brent:      { anchor: 93.0, vol: 0.32, pull: 0.05, dp: 2, pre: "$", lo: 70,  hi: 130, pct: true, ref: 89.5 },
    sanctions:  { anchor: 2.4,  vol: 0.45, pull: 0.10, dp: 0, pre: "",  lo: 0,   hi: 6,   pct: false, int: true, ref: 2.4 },
  };
  const indState = {};
  RD.indicators.forEach((i) => {
    const raw = parseFloat(String(i.value).replace(/[^0-9.\-]/g, ""));
    indState[i.id] = isNaN(raw) ? (IND[i.id] ? IND[i.id].anchor : 0) : raw;
  });

  let sanctionBase = null;        // first-seen SDN count, for delta
  let tick = 0;

  /* ---- one step -------------------------------------------------------- */
  function step() {
    tick++;
    const nowt = Date.now();

    // 1) chokepoints — real PortWatch transits when present, else streamed sim
    RD.chokepoints.forEach((c) => {
      const real = REAL.choke && REAL.choke[c.id];
      if (real) {
        // anchor to measured transits; recompute drop against the real 12-month-norm baseline
        ckState[c.id] += (real.current - ckState[c.id]) * 0.3;
        c.vessels = Math.max(0, Math.round(ckState[c.id]));
        c.drop = c.baseline > 0 ? Math.max(0, Math.round((1 - c.vessels / c.baseline) * 100)) : 0;
      } else {
        const cfg = CK[c.id];
        let v = clamp(rw(ckState[c.id], cfg.anchor, cfg.vol, cfg.pull), 0, c.baseline);
        ckState[c.id] = v;
        c.vessels = Math.max(0, Math.round(v));
        c.drop = Math.round((1 - c.vessels / c.baseline) * 100);
        c.spark = c.spark.slice(-7).concat(c.vessels);
      }
    });

    // 2) leading indicators — real value when present, else streamed sim
    RD.indicators.forEach((i) => {
      const cfg = IND[i.id];
      if (!cfg) return;
      const realV = REAL.vals[i.id];
      let v;
      if (realV != null) {
        indState[i.id] += (realV - indState[i.id]) * 0.4;   // ease toward real reading
        v = indState[i.id];
      } else {
        v = clamp(rw(indState[i.id], cfg.anchor, cfg.vol, cfg.pull), cfg.lo, cfg.hi);
        indState[i.id] = v;
      }
      i.value = cfg.pre + (cfg.int ? String(Math.round(v)) : v.toFixed(cfg.dp));
      const first = i.spark[0];
      i.spark = i.spark.slice(-7).concat(cfg.int ? Math.round(v) : +v.toFixed(cfg.dp));
      const refBase = (realV != null && REAL.prev[i.id] != null) ? REAL.prev[i.id]
        : (cfg.ref !== undefined ? cfg.ref : first);
      if (cfg.fixedDelta !== undefined && realV == null) {
        i.delta = cfg.fixedDelta;
      } else if (cfg.pct) {
        i.delta = Math.round(((v - refBase) / refBase) * 100);
      } else {
        i.delta = Math.round(v - refBase);
      }
      i.dir = i.delta > 0.5 ? "up" : i.delta < -0.5 ? "down" : "flat";
    });

    // 2b) gas replacement basis — DERIVED from live Brent, never Henry Hub.
    // Marginal LNG = slope × Brent + shipping/regas; the basis-flip multiple is
    // that marginal over the fixed Dolphin contract floor.
    (function () {
      const g = RD.gasNode; if (!g) return;
      const brentNow = indState.brent;
      const marg = g.slope * brentNow + g.shipConst;
      g.marginal = +marg.toFixed(2);
      g.multiple = +(marg / g.floor).toFixed(1);
      g.brent = +brentNow.toFixed(2);
      const ind = RD.indicators.find((x) => x.id === "gasbasis");
      if (ind) {
        ind.value = "$" + marg.toFixed(1);
        ind.spark = ind.spark.slice(-7).concat(+marg.toFixed(1));
        const refMarg = g.slope * (IND.brent.ref || 89.5) + g.shipConst;
        ind.delta = Math.round(((marg - refMarg) / refMarg) * 100);
        ind.dir = ind.delta > 0.5 ? "up" : ind.delta < -0.5 ? "down" : "flat";
      }
    })();

    // 3) Live Stress — decomposed into named drivers, real feeds add live drag
    const ck = {};
    RD.chokepoints.forEach((c) => { ck[c.id] = c.drop; });
    const status = REAL.status;

    // (a) maritime throughput — real IMF PortWatch transits when connected, else simulated
    const throughputDrag = 0.047 * (ck.hormuz || 0) + 0.020 * (ck.redsea || 0) + 0.004 * (ck.suez || 0);

    // (b) sea state — REAL (Open-Meteo): waves above ~1.2 m impair transit
    const seaW = { hormuz: 0.8, redsea: 0.6, suez: 0.3 };
    let seaStateDrag = 0;
    if (REAL.meteo && REAL.meteo.sea) {
      for (const id in seaW) {
        const s = REAL.meteo.sea[id];
        if (s && s.wave != null) seaStateDrag += Math.max(0, s.wave - 1.2) * seaW[id];
      }
    }
    seaStateDrag = clamp(seaStateDrag, 0, 3);

    // (c) trade-route news — REAL (GDELT): above-normal closure/conflict coverage
    const newsW = { hormuz: 2.2, redsea: 1.4, suez: 0.6, general: 0.8 };
    let newsDrag = 0;
    if (REAL.news) {
      for (const id in newsW) {
        const n = REAL.news[id];
        if (n && n.score != null) newsDrag += clamp(n.score, 0, 1) * newsW[id];
      }
    }
    newsDrag = clamp(newsDrag, 0, 5);

    // (c2) partner-supply news — REAL (GDELT): above-normal ADVERSE coverage of a
    // SUPPLY PARTNER's disruption, prioritised by supply concentration — the
    // single- and few-source dependencies lead (Qatar gas, Taiwan chips,
    // Kazakhstan fuel), then China processing and India APIs. Negative-sentiment
    // gated upstream, so positive coverage of the same topic adds no drag.
    // Weighted by the consequence of the imports that ride on each partner.
    const PARTNER_LANES = { qatar: ["gas"], taiwan: ["chips"], kazakhstan: ["leu"], china: ["solarpv", "libattery", "devices"], india: ["api"] };
    let partnerDrag = 0; const partnerHot = [];
    if (REAL.news) {
      for (const lane in PARTNER_LANES) {
        const n = REAL.news[lane];
        if (!n || n.score == null) continue;
        const maxCons = Math.max(0, ...PARTNER_LANES[lane].map((id) => { const p = RD.precursors.find((x) => x.id === id); return p ? p.consequence : 0; }));
        partnerDrag += clamp(n.score, 0, 1) * maxCons * 3.2;
        if (n.score > 0.05) partnerHot.push(lane + " " + Math.round(n.score * 100) + "%");
      }
    }
    partnerDrag = clamp(partnerDrag, 0, 5);

    // (d) energy-market stress — REAL (markets): Brent / gas spikes above reference
    const margNow = (RD.gasNode && RD.gasNode.marginal) || 12;
    const marketDrag = clamp(Math.max(0, (indState.brent - 96)) * 0.12 + Math.max(0, (margNow - 14)) * 0.25, 0, 1.5);

    // (e) counterpart / sanctions — REAL (OpenSanctions): rise in SDN entities
    let sanctionDrag = 0;
    if (RD.sources.ofac._total != null) {
      if (sanctionBase == null) sanctionBase = RD.sources.ofac._total;
      sanctionDrag = clamp((RD.sources.ofac._total - sanctionBase) / 200, 0, 0.5);
    }

    const totalDrag = throughputDrag + seaStateDrag + newsDrag + partnerDrag + marketDrag + sanctionDrag;
    // calibration multiplier — 1.0 unless a measured episode has been applied via
    // the validation panel (stored per-browser; the applied basis is shown there)
    const calScale = (RD.calib && RD.calib.dragScale) ? RD.calib.dragScale : 1;
    const scaledDrag = totalDrag * calScale;
    // expose the per-driver breakdown for the shared episode log (feeds.js posts it)
    RD._drags = { throughput: +throughputDrag.toFixed(2), routeNews: +newsDrag.toFixed(2), partnerNews: +partnerDrag.toFixed(2), sea: +seaStateDrag.toFixed(2), market: +marketDrag.toFixed(2), sanctions: +sanctionDrag.toFixed(2), total: +scaledDrag.toFixed(2) };
    const ceiling = RD.headline.structural.value;
    // floored at 25 (a stated assumption — drag alone can't collapse a 0–100
    // index into systemic-failure territory; scenarios can, and floor at 0).
    const live = clamp(ceiling - scaledDrag, 25, ceiling);
    RD.headline.live.value = +live.toFixed(1);
    // measured 24h trend — vs the stored snapshot history (see initTrends).
    if (RD.trends) RD.trends.live = (RD._trendBase24 && RD._trendBase24.live != null) ? +(live - RD._trendBase24.live).toFixed(1) : null;

    // decomposition for the attribution trace. real = driven by a connected
    // feed. read = the actual live reading, so a quiet driver is visibly alive
    // ("watching" backed by evidence) rather than just an empty bar.
    const reads = {};
    reads.ais = "Hormuz \u2212" + (ck.hormuz || 0) + "% \u00b7 Red Sea \u2212" + (ck.redsea || 0) + "% vs 12-mo norm";
    if (REAL.news) {
      const vols = Object.keys(REAL.news).map((k) => REAL.news[k].vol).filter((v) => v != null);
      const tv = vols.reduce((a, b) => a + b, 0);
      reads.gdelt = tv + " articles/2d \u00b7 " + (newsDrag > 0.05 ? "above-normal coverage" : "coverage at/below normal");
    }
    reads.partner = REAL.news ? (partnerHot.length ? "above-normal: " + partnerHot.join(" \u00b7 ") : "partner coverage at/below normal") : "feed connecting\u2026";
    if (REAL.meteo && REAL.meteo.sea) {
      let mx = 0;
      for (const id in REAL.meteo.sea) { const sv = REAL.meteo.sea[id]; if (sv && sv.wave != null) mx = Math.max(mx, sv.wave); }
      reads.meteo = "max wave " + mx.toFixed(1) + " m \u00b7 " + (seaStateDrag > 0.05 ? "impairing transit (>1.2 m)" : "calm (drag starts >1.2 m)");
    }
    if (status.yfinance === "live") {
      reads.yfinance = "Brent $" + indState.brent.toFixed(2) + " \u00b7 LNG replacement $" + margNow.toFixed(1) + " \u00b7 " + (marketDrag > 0.05 ? "above stress marks" : "below stress marks ($96 Brent)");
    }
    if (RD.sources.ofac._total != null && sanctionBase != null) {
      const added = RD.sources.ofac._total - sanctionBase;
      reads.ofac = (added >= 0 ? "+" : "") + added.toLocaleString() + " SDN entities since session baseline";
    }

    RD.headline.live.drivers = [
      { k: "Maritime throughput", v: throughputDrag, src: "ais", real: status.ais === "live", read: reads.ais },
      { k: "Trade-route news", v: newsDrag, src: "gdelt", real: status.gdelt === "live", read: reads.gdelt },
      { k: "Partner-supply news", v: partnerDrag, src: "gdelt", real: status.gdelt === "live", read: reads.partner },
      { k: "Sea state", v: seaStateDrag, src: "meteo", real: status.meteo === "live", read: reads.meteo },
      { k: "Energy-market stress", v: marketDrag, src: "yfinance", real: status.yfinance === "live", read: reads.yfinance },
      { k: "Counterpart / sanctions", v: sanctionDrag, src: "ofac", real: status.ofac === "live", read: reads.ofac },
    ];

    // 4) Structural fundamentals are a deterministic FUNCTION of the dependency
    // data (computed in data.js: sector scores → most-exposed → structural).
    // They are slow-moving by definition and change ONLY when that data changes
    // — never on a random per-tick walk — so every displayed structural number
    // stays exactly equal to the formula shown in its own explainer. Only Live
    // Stress (section 3) moves on the tick, driven by the real feeds.

    // 5) feed clocks — honest freshness. A LIVE feed's timestamp comes ONLY
    // from its real fetches (set in feeds.js); fabricating ticks here would
    // claim updates that never happened. Only simulated feeds re-stamp on
    // their simulated cadence — and they are badged SIM wherever shown.
    for (const k in FEEDS) {
      const s = RD.sources[k];
      if (REAL.status[k] !== "live" && nowt >= s._next) { s._ts = nowt; s._next = nowt + s._cad; }
      s.fresh = freshText(k);
    }
    if (RD.sources.meteo && RD.sources.meteo._ts) RD.sources.meteo.fresh = freshText("meteo");
    if (RD.sources.gdelt && RD.sources.gdelt._ts) RD.sources.gdelt.fresh = freshText("gdelt");

    notify();
  }

  /* ---- React subscription hook ----------------------------------------- */
  function useLiveTick() {
    const [, force] = React.useReducer((n) => n + 1, 0);
    React.useEffect(() => {
      const off = () => force();
      subs.add(off);
      return () => subs.delete(off);
    }, []);
  }

  // prime feed strings once so first paint is consistent
  for (const k in FEEDS) RD.sources[k].fresh = freshText(k);

  /* ---- ACLED-backed trade-partner conflict exposure --------------------
     Maps a partner / source country to its live 30-day conflict intensity from
     ACLED (Battles + Explosions/Remote violence). pressure is a 0..1 log scale
     so wildly different magnitudes (Sudan in the thousands vs a quiet partner
     near zero) stay comparable. Returns live:false when ACLED isn't connected
     so the UI can fall back to the curated counterpart score honestly. */
  const CONFLICT_BAND = (p) => p >= 0.66 ? "critical" : p >= 0.40 ? "high" : p > 0.15 ? "moderate" : "good";
  // free-text source strings ("Canada / Russia") → ACLED country names we track
  const COUNTRY_ALIASES = { "russia": "Russia", "sudan": "Sudan", "yemen": "Yemen", "iran": "Iran" };
  // partner-supply news lanes (GDELT) keyed by a substring of the import's source
  const NEWS_PARTNER_ALIASES = { "qatar": "qatar", "taiwan": "taiwan", "kazakhstan": "kazakhstan", "china": "china", "india": "india" };
  // live news-pressure on a supply partner, for the Dependencies drawer. Returns
  // tracked:false when the import's source isn't a news-watched partner, so the
  // UI falls back to the curated counterpart score honestly.
  function partnerNewsFor(source) {
    const hay = String(source || "").toLowerCase();
    const news = REAL.news;
    const liveOk = REAL.status.gdelt === "live" && !!news;
    for (const key in NEWS_PARTNER_ALIASES) {
      if (hay.includes(key)) {
        const lane = NEWS_PARTNER_ALIASES[key];
        const d = news && news[lane];
        if (d && d.score != null) return { tracked: true, live: liveOk, lane, score: d.score, vol: d.vol, band: CONFLICT_BAND(d.score), partner: key, headlines: d.headlines || [] };
        return { tracked: true, live: false, lane, score: 0, vol: null, band: "good", partner: key, headlines: [] };
      }
    }
    return { tracked: false };
  }
  function conflictFor(source) {
    const acled = REAL.acled;
    const live = REAL.status.acled === "live" && acled && acled.byCountry;
    const hay = String(source || "").toLowerCase();
    const matched = [];
    for (const key in COUNTRY_ALIASES) {
      const name = COUNTRY_ALIASES[key];
      if (hay.includes(key) && live && acled.byCountry[name] != null) {
        matched.push({ country: name, events: acled.byCountry[name] });
      }
    }
    if (!matched.length) return { live: !!live, tracked: false, events: null, pressure: 0, band: "good", country: null };
    // a precursor with several sources takes the most conflict-exposed one
    matched.sort((a, b) => b.events - a.events);
    const top = matched[0];
    const pressure = Math.max(0, Math.min(1, Math.log10(top.events + 1) / Math.log10(3000)));
    return { live: true, tracked: true, events: top.events, pressure, band: CONFLICT_BAND(pressure), country: top.country, since: acled.since };
  }

  /* ---- measured trend history -------------------------------------------
     Headline and sector deltas come from PERSISTED SNAPSHOTS of the computed
     scores, never from seeded literals: the 24h delta compares against the
     newest snapshot ≥20 h old, the 30-day deltas against the newest ≥25 days
     old. With no old-enough history the trend is null and the UI says
     "no history yet" instead of dressing a seed up as a measurement.
     Snapshots are saved at most once per 6 h under their own storage key. */
  (function initTrends() {
    const KEY = "ris_trend_snaps_v1";
    const H = 3600e3, D = 24 * H;
    let snaps = [];
    try { snaps = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { snaps = []; }
    const now = Date.now();
    const newestOlder = (age) => { const c = snaps.filter((s) => now - s.t >= age); return c.length ? c[c.length - 1] : null; };
    const s24 = newestOlder(20 * H);
    const s30 = newestOlder(25 * D);
    const trends = { live: null, structural: null, sectors: {} };
    if (s24 && s24.live != null) trends.live = +(RD.headline.live.value - s24.live).toFixed(1);
    if (s30 && s30.structural != null) trends.structural = +(RD.headline.structural.value - s30.structural).toFixed(1);
    RD.sectors.forEach((sec) => {
      const v = (s30 && s30.sectors) ? s30.sectors[sec.id] : null;
      trends.sectors[sec.id] = v != null ? +(sec.score - v).toFixed(1) : null;
    });
    RD.trends = trends;
    RD._trendBase24 = s24;
    // save a fresh snapshot ~60s after load (lets the live feeds connect first)
    setTimeout(() => {
      try {
        const last = snaps[snaps.length - 1];
        if (last && Date.now() - last.t < 6 * H) return;
        snaps.push({ t: Date.now(), live: RD.headline.live.value, structural: RD.headline.structural.value,
          sectors: Object.fromEntries(RD.sectors.map((s) => [s.id, s.score])) });
        if (snaps.length > 200) snaps = snaps.slice(-200);
        localStorage.setItem(KEY, JSON.stringify(snaps));
      } catch (e) {}
    }, 60 * 1000);
  })();

  /* ---- calibration state --------------------------------------------------
     A measured episode can be APPLIED from the validation panel: it stores a
     global drag-scale multiplier (clamped 0.5–1.5) so live drag matches what
     real events measured. Per-browser, revertable, and surfaced in the panel
     and the assumptions ledger — never silent. */
  try { RD.calib = JSON.parse(localStorage.getItem("ris_calib_v1") || "null"); } catch (e) { RD.calib = null; }
  function setCalibration(c) {
    RD.calib = c;
    try { c ? localStorage.setItem("ris_calib_v1", JSON.stringify(c)) : localStorage.removeItem("ris_calib_v1"); } catch (e) {}
    step();
  }

  const interval = setInterval(step, 1500);

  return { subscribe: (f) => (subs.add(f), () => subs.delete(f)), freshText, useLiveTick, conflictFor, partnerNewsFor, setCalibration, step, real: REAL, _interval: interval };
})();
window.useLiveTick = window.LIVE.useLiveTick;
