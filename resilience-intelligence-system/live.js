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
    gpsjam:     { anchor: 11,   vol: 0.55, pull: 0.10, dp: 0, pre: "",  lo: 0,   hi: 40,  pct: true, int: true, ref: 8 },
    sanctions:  { anchor: 2.4,  vol: 0.45, pull: 0.10, dp: 0, pre: "",  lo: 0,   hi: 6,   pct: false, int: true, ref: 2.4 },
  };
  const indState = {};
  RD.indicators.forEach((i) => {
    const raw = parseFloat(String(i.value).replace(/[^0-9.\-]/g, ""));
    indState[i.id] = isNaN(raw) ? (IND[i.id] ? IND[i.id].anchor : 0) : raw;
  });

  let nonMaritime = 1.9;          // residual Guinea/EGA drag, easing
  let sanctionBase = null;        // first-seen SDN count, for delta
  const NM_ANCHOR = 1.85;
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

    // 2c) Dolphin gas flow — PINNED at contractual nominal (100%), NOT a random
    // walk. Dolphin is piped and does not transit Hormuz, so there is no basis
    // for a standing shortfall and no public live flow meter. It deflects below
    // 100 ONLY when the live regional news / conflict proxy indicates an actual
    // disturbance in the Gulf–Qatar theatre — so every dip is traceable to an
    // event, never a hardcoded guess. With no live news feed, it holds at 100.
    (function () {
      const ind = RD.indicators.find((x) => x.id === "dolphin");
      if (!ind) return;
      let defl = 0;
      if (REAL.news) {
        const sc = (id) => (REAL.news[id] && REAL.news[id].score != null) ? clamp(REAL.news[id].score, 0, 1) : 0;
        defl = clamp(sc("hormuz") * 18 + sc("general") * 10, 0, 30);   // regional disturbance → flow risk
      }
      const flow = Math.round(clamp(100 - defl, 70, 100));
      ind.value = String(flow);
      ind.spark = ind.spark.slice(-7).concat(flow);
      ind.delta = flow - 100;
      ind.dir = ind.delta < -0.5 ? "down" : "flat";
      ind.status = flow >= 97 ? "good" : flow >= 90 ? "moderate" : "high";
      ind.statusText = defl > 0.5 ? "disrupted" : "";
    })();

    // 2d) RO membrane stock — the ~75-day reserve is a STATED buffer, never a
    // fabricated countdown. The only live element is resupply STATUS: membranes
    // are sea-borne, so the route-disruption proxy (Hormuz / Red Sea) flips it
    // between clear / strained / impaired. Day-by-day drawdown is modelled in
    // the cascade & scenario simulator, not animated against the wall clock.
    (function () {
      const ro = RD.indicators.find((x) => x.id === "romembrane");
      if (ro == null) return;
      const dropOf = (id) => { const c = RD.chokepoints.find((x) => x.id === id); return c ? c.drop : 0; };
      const routeStress = clamp(dropOf("hormuz") * 0.012 + dropOf("redsea") * 0.006, 0, 1);
      ro.value = "75";
      ro.delta = 0;
      ro.dir = "flat";
      if (routeStress > 0.5) { ro.status = "high"; ro.statusText = "impaired"; }
      else if (routeStress > 0.2) { ro.status = "moderate"; ro.statusText = "strained"; }
      else { ro.status = "good"; ro.statusText = "clear"; }
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

    // (d) energy-market stress — REAL (markets): Brent / gas spikes above reference
    const margNow = (RD.gasNode && RD.gasNode.marginal) || 12;
    const marketDrag = clamp(Math.max(0, (indState.brent - 96)) * 0.12 + Math.max(0, (margNow - 14)) * 0.25, 0, 1.5);

    // (e) counterpart / sanctions — REAL (OpenSanctions): rise in SDN entities
    let sanctionDrag = 0;
    if (RD.sources.ofac._total != null) {
      if (sanctionBase == null) sanctionBase = RD.sources.ofac._total;
      sanctionDrag = clamp((RD.sources.ofac._total - sanctionBase) / 200, 0, 0.5);
    }

    // (f) residual non-maritime shock — MODELLED (Guinea/EGA, easing). Held steady
    // at its curated value: there is no live feed for it, so it must not jitter.
    nonMaritime = NM_ANCHOR;

    const totalDrag = throughputDrag + seaStateDrag + newsDrag + marketDrag + sanctionDrag + nonMaritime;
    const ceiling = RD.headline.structural.value;
    const live = clamp(ceiling - totalDrag, 25, ceiling - 0.1);
    RD.headline.live.value = +live.toFixed(1);

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
    reads.model = "curated severity \u00b7 easing as exports recover";

    RD.headline.live.drivers = [
      { k: "Maritime throughput", v: throughputDrag, src: "ais", real: status.ais === "live", read: reads.ais },
      { k: "Trade-route news", v: newsDrag, src: "gdelt", real: status.gdelt === "live", read: reads.gdelt },
      { k: "Sea state", v: seaStateDrag, src: "meteo", real: status.meteo === "live", read: reads.meteo },
      { k: "Energy-market stress", v: marketDrag, src: "yfinance", real: status.yfinance === "live", read: reads.yfinance },
      { k: "Counterpart / sanctions", v: sanctionDrag, src: "ofac", real: status.ofac === "live", read: reads.ofac },
      { k: "Residual shock (Guinea)", v: nonMaritime, src: "curated", real: false, modelled: true, read: reads.model },
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

  const interval = setInterval(step, 1500);

  return { subscribe: (f) => (subs.add(f), () => subs.delete(f)), freshText, useLiveTick, conflictFor, step, real: REAL, _interval: interval };
})();
window.useLiveTick = window.LIVE.useLiveTick;
