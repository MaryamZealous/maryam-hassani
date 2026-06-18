/* ============================================================================
   Shared UI primitives. Exported to window for cross-file use.
   ========================================================================== */
const { useState, useEffect, useRef, useContext, createContext } = React;

/* ---- explain drawer context -------------------------------------------- */
const ExplainCtx = createContext(() => {});
const useExplain = () => useContext(ExplainCtx);

/* ---- icon set (line style) --------------------------------------------- */
const PATHS = {
  gauge: "M12 13a3 3 0 0 0-3 3M12 4a9 9 0 1 0 8.5 12M12 13l4-4M19 8h2M3 14H1",
  threat: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z M12 9v4 M12 16h.01",
  cascade: "M4 6h5M4 6a2 2 0 1 0 0 .01M9 6c4 0 2 6 6 6m0 0a2 2 0 1 0 0 .01M15 12c-4 0 .5 6-5 6m0 0H4m1 0a2 2 0 1 1 0 .01",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14",
  chain: "M9 12h6 M8 8H6a4 4 0 0 0 0 8h2 M16 8h2a4 4 0 0 1 0 8h-2",
  shield: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z",
  ops: "M4 5h16 M4 12h16 M4 19h10 M18 17l2 2 3-4",
  book: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z M9 7h6 M9 11h6",
  close: "M6 6l12 12M18 6L6 18",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDown: "M12 5v14M5 12l7 7 7-7",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  flat: "M5 12h14",
  fx: "M7 20V6a2 2 0 0 1 2-2h3M5 12h7M14 12l5 5M19 12l-5 5",
  play: "M7 5v14l11-7z",
  reset: "M3 12a9 9 0 1 0 3-6.7M3 4v4h4",
  info: "M12 16v-5M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  layers: "M12 3l9 5-9 5-9-5 9-5z M3 12l9 5 9-5 M3 16l9 5 9-5",
  pin: "M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z M12 10a1.5 1.5 0 1 0 0-.01",
  spark: "M3 17l5-6 4 4 5-8 4 5",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z",
  alert: "M12 9v4M12 17h.01M10.3 4.3l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-2.7l-7-12a2 2 0 0 0-3.4 0z",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  check: "M5 12l5 5 9-11",
  dot: "",
};
function Icon({ name, size = 16, className = "", style }) {
  const d = PATHS[name];
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}></path>
    </svg>
  );
}

/* ---- source tag --------------------------------------------------------- */
function SourceTag({ src }) {
  const s = RD.sources[src] || RD.sources.curated;
  return (
    <span className={`src ${s.kind}`} title={`${s.full} · refresh ${s.cadence} · ${s.fresh}`}>
      <span className="d"></span>{s.label}
    </span>
  );
}

/* ---- the ƒ explain button ---------------------------------------------- */
function Fx({ payload }) {
  const explain = useExplain();
  return (
    <button className="fx" title="Explain this number" onClick={(e) => { e.stopPropagation(); explain(payload); }}>ƒ</button>
  );
}

/* ---- sparkline ---------------------------------------------------------- */
function Sparkline({ data, w = 84, h = 26, band = "moderate" }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 4) - 2 ]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const last = pts[pts.length - 1];
  return (
    <svg className={`spark band-${band}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={area} fill="var(--bc)" opacity="0.10"></polygon>
      <polyline points={line} fill="none" stroke="var(--bc)" strokeWidth="1.5" strokeLinejoin="round"></polyline>
      <circle cx={last[0]} cy={last[1]} r="2.4" fill="var(--bc)"></circle>
    </svg>
  );
}

/* ---- trend chip --------------------------------------------------------- */
function Trend({ now, prev, suffix = "", horizon = "24h" }) {
  const d = +(now - prev).toFixed(1);
  const dir = d > 0.05 ? "up" : d < -0.05 ? "down" : "flat";
  const ic = dir === "up" ? "arrowUp" : dir === "down" ? "arrowDown" : "flat";
  return (
    <span className={`trend ${dir}`}>
      <Icon name={ic} size={13} />{d > 0 ? "+" : ""}{d}{suffix}
      <span className="faint" style={{ fontSize: 10 }}>{horizon}</span>
    </span>
  );
}

function BandTag({ score }) {
  const b = RD.band(score);
  return <span className={`tag-band band-${b.key}`}><span></span>{b.label}</span>;
}

/* ---- panel -------------------------------------------------------------- */
function Panel({ title, label, right, children, icon, style }) {
  return (
    <section className="panel" style={style}>
      {(title || right) && (
        <header className="panel-h">
          {icon && <Icon name={icon} size={15} style={{ color: "var(--muted)" }} />}
          {title && <span className="ttl">{title}</span>}
          {label && <span className="label">{label}</span>}
          {right}
        </header>
      )}
      <div className="panel-b">{children}</div>
    </section>
  );
}

/* ---- score hero card ---------------------------------------------------- */
/* ---- headline drivers (computed live) ----------------------------------- */
function headlineDrivers(d) {
  if (d === RD.headline.live) {
    const sh = RD.shocks;
    const names = sh.map((s) => s.short || s.name).join(", ");
    const hits = [...new Set(sh.map((s) => s.sector))].join(" & ");
    const gap = +(RD.headline.structural.value - d.value).toFixed(1);
    return {
      kicker: "Live factors · updating hourly",
      text: `Hormuz & Red Sea pressure active, Guinea/EGA bauxite easing. Maritime disruption is counted once — through measured ship transits, which already reflect the escalation — and live sits ${gap} pts below the ceiling.`,
    };
  }
  const weakest = RD.sectors.reduce((a, b) => (b.score < a.score ? b : a));
  return {
    kicker: "Drivers · refreshed monthly",
    text: `Capacity — Absorb · Recover · Adapt — set against the most-exposed sector (${weakest.name} ${weakest.score.toFixed(1)}). Recomputed monthly from public data.`,
  };
}

function ScoreCard({ d }) {
  const b = RD.band(d.value);
  const dr = headlineDrivers(d);
  return (
    <div className={`score-card band-${b.key}`}>
      <div className="score-top">
        <span className="score-name">{d.name}</span>
        <span className="score-tag">{d.tag}</span>
        <span style={{ marginLeft: "auto" }}>
          {d === RD.headline.live ? (
            <span className="src live" role="button" tabIndex={0} style={{ cursor: "pointer" }}
              title="Live Stress blends six public feeds — PortWatch, Open-Meteo, Google News, Markets, OFAC, ACLED"
              onClick={(e) => { e.stopPropagation(); window.__explain && window.__explain({
                kicker: "Live feeds · updating continuously", title: "What feeds the Live Stress score",
                text: "Live Stress is not a single-source number. It is the structural ceiling minus today's active load, and that load is measured from six public feeds. Maritime throughput (PortWatch) is the largest mover, which is why it often leads — but it is never the only input.",
                formula: "Active load  =  maritime throughput + sea state + trade-route news + market stress + sanctions drift + Guinea residual",
                inputs: [
                  { k: "Maritime throughput — largest driver", v: "chokepoint transit calls vs 12-month norm", src: "ais" },
                  { k: "Sea state", v: "wave height & wind on the approaches", src: "meteo" },
                  { k: "Trade-route news", v: "closure & conflict coverage", src: "gdelt" },
                  { k: "Market stress", v: "Brent & natural-gas prices", src: "yfinance" },
                  { k: "Sanctions drift", v: "OFAC SDN updates", src: "ofac" },
                  { k: "Guinea residual (non-maritime)", v: "easing bauxite shock", src: "acled" },
                ],
                assumption: "PortWatch is the dominant mover, but the score is a blend of all six live feeds against the structural ceiling — never PortWatch alone.",
              }); }}>
              <span className="d"></span>6 live feeds
            </span>
          ) : <SourceTag src="curated" />}
        </span>
      </div>
      <div className="score-row">
        <span className="score-num mono">{d.value.toFixed(1)}</span>
        <span className="score-of mono">/ 100</span>
        <div className="score-meta">
          <span className="score-band"><span className="sq"></span>{b.label}</span>
          <Trend now={d.value} prev={d.prev} horizon={d.horizon || "24h"} />
        </div>
      </div>
      <div className="score-track" style={{ position: "relative" }}>
        <div className="score-fill" style={{ width: d.value + "%" }}></div>
        {d.cap ? (
          <div className="score-frontier" style={{ left: d.cap.at + "%" }} title={d.cap.label}>
            <span className="score-frontier-flag">{d.cap.label}</span>
          </div>
        ) : null}
      </div>
      {d.cap ? (
        <div className="score-ceiling"><b>{d.cap.lead}</b> {d.cap.body}</div>
      ) : null}
      <div className="score-drivers">
        <span className="score-drivers-k">{dr.kicker}</span>
        <span className="score-drivers-t">{dr.text}</span>
      </div>
      <div className="score-foot">
        <Icon name="info" size={14} style={{ flex: "0 0 auto", color: "var(--faint)", marginTop: 1 }} />
        <span>{b.desc}.&nbsp;
          <button className="exp" onClick={(e) => { e.stopPropagation(); window.__explain && window.__explain({
            kicker: "Score methodology", title: d.name, text: d.explain, formula: d.formula,
            inputs: d.inputs, assumption: d.assumption,
          }); }}>How is this calculated?</button>
        </span>
      </div>
    </div>
  );
}

/* ---- sector card -------------------------------------------------------- */
function SectorCard({ s, onOpen }) {
  const b = RD.band(s.score);
  const explain = useExplain();
  const ps = RD.precursors.filter((p) => p.sector === s.id);
  const cw = ps.reduce((a, p) => a + p.consequence, 0) || 1;
  const driInputs = ps.map((p) => ({
    k: (p.name === s.topRisk ? "★ " : "") + p.name,
    v: "DRI " + p.dri + " × consequence " + p.consequence.toFixed(2),
  }));
  driInputs.push(
    { k: "Consequence-weighted mean DRI", v: s.wdri + " / 100  (fragility)" },
    { k: "Resilience = 100 − " + s.wdri, v: s.score.toFixed(1) + " / 100" },
    { k: "30d change", v: (s.score - s.prev).toFixed(1) + " pts" },
  );
  return (
    <div className={`sector band-${b.key} fade-in`} onClick={() => onOpen(s)}>
      <div className="sector-top">
        <span className="sector-name">{s.name}</span>
        <span className="sector-band">{b.label}</span>
      </div>
      <div className="sector-score">
        <span className="sector-num mono">{s.score.toFixed(1)}</span>
        <span className={`mini-trend ${s.score >= s.prev ? "up" : "down"}`}>
          {s.score >= s.prev ? "▲" : "▼"} {Math.abs(+(s.score - s.prev).toFixed(1))}
        </span>
        <span style={{ marginLeft: "auto" }}>
          <Fx payload={{
            kicker: "Sector score · computed", title: s.name + " resilience",
            text: s.note + " The score is computed, not hand-set: it takes the Dependency Risk Index of each tracked import, weights it by national consequence (so the imports that matter most count most), averages them, and subtracts from 100. The ★ import — the most fragile — is the one to watch.",
            formula: "Sector  =  100  −  ( Σ(DRI × consequence) / Σ consequence )",
            inputs: driInputs,
            assumption: "A deterministic function of the sector's tracked imports — every input is independently sourced on the Dependencies view, so the score moves only when the underlying dependency data moves. DRI's own four dimensions are equally weighted (0–25 each). Edit any import's DRI or consequence and this score, the most-exposed sector and the national headline all recompute.",
          }} />
        </span>
      </div>
      <div className="sector-track"><div className="sector-fill" style={{ width: s.score + "%" }}></div></div>
      <div className="sector-risk">
        Top risk <b>{s.topRisk}</b> <span className="sector-dri">DRI {s.topDRI}</span>
      </div>
    </div>
  );
}

/* ---- explain drawer ----------------------------------------------------- */
function Drawer({ payload, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!payload) return null;
  const fmt = (f) => f.replace(/(×|\+|−|Σ|\/)/g, (m) => `‹op›${m}‹/op›`)
    .split(/‹op›|‹\/op›/).map((t, i) => i % 2 ? <span key={i} className="op">{t}</span> : t);
  return (
    <>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer">
        <header className="drawer-h">
          <div>
            <div className="drawer-kicker">{payload.kicker || "Explain"}</div>
            <div className="drawer-title">{payload.title}</div>
          </div>
          <button className="icon-btn drawer-x" onClick={onClose}><Icon name="close" size={15} /></button>
        </header>
        <div className="drawer-b">
          {payload.text && (
            <div className="exp-sec">
              <h4>What this means</h4>
              <p className="exp-text">{payload.text}</p>
            </div>
          )}
          {payload.formula && (
            <div className="exp-sec">
              <h4>How it is computed</h4>
              <div className="formula">{payload.formula.split("\n").map((ln, i) => (<div key={i}>{fmt(ln)}</div>))}</div>
            </div>
          )}
          {payload.inputs && (
            <div className="exp-sec">
              <h4>Inputs &amp; live values</h4>
              {payload.inputs.map((r, i) => (
                <div className="input-row" key={i}>
                  <div className="input-k">{r.k}</div>
                  <div className="input-v">{r.v}{r.src && <> <SourceTag src={r.src} /></>}</div>
                </div>
              ))}
            </div>
          )}
          {payload.assumption && (
            <div className="exp-sec">
              <h4>Key assumption</h4>
              <div className="note-card assume">{payload.assumption}</div>
            </div>
          )}
          <div className="exp-sec">
            <div className="note-card">
              <b>Illustrative model.</b> This figure is built from public and live data plus the
              transparent assumptions shown above. It is a decision-support estimate, not an
              operational or classified assessment.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---- illustrative badge (top bar) -------------------------------------- */
function IllusBadge() {
  return (
    <button className="illus-badge" onClick={() => window.__explain && window.__explain({
      kicker: "About this system",
      title: "An illustrative model",
      text: "The UAE National Resilience Intelligence System is an ILLUSTRATIVE decision-support model. It combines live, publicly-available data feeds with hand-curated open-source datasets and a set of transparent, documented assumptions.",
      formula: "Live public data  +  Curated open sources  +  Stated assumptions  →  Explainable estimate",
      inputs: [
        { k: "Live feeds (6)", v: "IMF PortWatch chokepoint transits, Google News trade-route coverage, Open-Meteo sea state, oil & gas prices, OFAC sanctions, ACLED conflict", src: "live" },
        { k: "Curated data", v: RD.precursors.length + " critical imports, " + RD.assets.length + " strategic assets, " + RD.scenarios.length + " scenarios — human-readable CSV", src: "curated" },
        { k: "Assumptions", v: "Goalposts, weights & buffers — all stated and editable", src: "assumption" },
      ],
      assumption: "Every number can be traced to its source and method. Nothing here is a classified or official Government of UAE position — it is a transparent worked example of how national resilience could be quantified.",
    })}>
      <span className="pulse"></span><b>ILLUSTRATIVE MODEL</b>
      <Icon name="info" size={13} style={{ color: "var(--faint)" }} />
    </button>
  );
}

Object.assign(window, { Icon, SourceTag, Fx, Sparkline, Trend, BandTag, Panel, ScoreCard, SectorCard, Drawer, IllusBadge, ExplainCtx, useExplain });
