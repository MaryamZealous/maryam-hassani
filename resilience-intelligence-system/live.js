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
  // chokepoint vessel anchors (depressed crisis levels) + volatility
  const CK = {
    hormuz: { anchor: 6,   vol: 1.1, pull: 0.08 },
    redsea: { anchor: 42,  vol: 2.4, pull: 0.07 },
    suez:   { anchor: 120, vol: 3.5, pull: 0.06 },
  };
  const ckState = {};
  RD.chokepoints.forEach((c) => { ckState[c.id] = c.vessels; });

  // leading-indicator anchors. fmt turns the number into the displayed value.
  const IND = {
    brent:      { anchor: 93.0, vol: 0.32, pull: 0.05, dp: 2, pre: "$", lo: 70,  hi: 130, pct: true, ref: 89.5 },
    natgas:     { anchor: 3.22, vol: 0.03, pull: 0.05, dp: 2, pre: "$", lo: 2,   hi: 6,   pct: true, ref: 3.18 },
    gpsjam:     { anchor: 11,   vol: 0.55, pull: 0.10, dp: 0, pre: "",  lo: 0,   hi: 40,  pct: true, int: true, ref: 8 },
    dolphin:    { anchor: 86,   vol: 0.45, pull: 0.08, dp: 0, pre: "",  lo: 70,  hi: 100, pct: true, int: true, ref: 87 },
    romembrane: { anchor: 47,   vol: 0.10, pull: 0.03, dp: 0, pre: "",  lo: 30,  hi: 75,  pct: false, int: true, fixedDelta: -1 },
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
    const marketDrag = clamp(Math.max(0, (indState.brent - 96)) * 0.12 + Math.max(0, (indState.natgas - 3.6)) * 0.6, 0, 1.5);

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

    // decomposition for the attribution trace (real = driven by a connected feed)
    RD.headline.live.drivers = [
      { k: "Maritime throughput", v: throughputDrag, src: "ais", real: status.ais === "live" },
      { k: "Trade-route news", v: newsDrag, src: "gdelt", real: status.gdelt === "live" },
      { k: "Sea state", v: seaStateDrag, src: "meteo", real: status.meteo === "live" },
      { k: "Energy-market stress", v: marketDrag, src: "yfinance", real: status.yfinance === "live" },
      { k: "Counterpart / sanctions", v: sanctionDrag, src: "ofac", real: status.ofac === "live" },
      { k: "Residual shock (Guinea)", v: nonMaritime, src: "acled", real: false, modelled: true },
    ];

    // 4) slow fundamentals — drift gently every ~20s, mean-reverting to anchor
    if (tick % 14 === 0) {
      RD.sectors.forEach((s) => {
        if (s._anchor === undefined) s._anchor = s.score;
        s.score = +clamp(rw(s.score, s._anchor, 0.12, 0.05), s._anchor - 1.2, s._anchor + 1.2).toFixed(1);
      });
    }
    if (tick % 22 === 0) {
      if (RD.headline.structural._anchor === undefined) RD.headline.structural._anchor = RD.headline.structural.value;
      const a = RD.headline.structural._anchor;
      RD.headline.structural.value = +clamp(rw(RD.headline.structural.value, a, 0.05, 0.05), a - 0.6, a + 0.6).toFixed(1);
    }

    // 5) feed clocks — age + re-poll on cadence
    for (const k in FEEDS) {
      const s = RD.sources[k];
      if (nowt >= s._next) { s._ts = nowt; s._next = nowt + s._cad; }
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

  const interval = setInterval(step, 1500);

  return { subscribe: (f) => (subs.add(f), () => subs.delete(f)), freshText, useLiveTick, step, real: REAL, _interval: interval };
})();
window.useLiveTick = window.LIVE.useLiveTick;
