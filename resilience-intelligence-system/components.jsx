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
function Sparkline({ data, w = 84, h = 26, band = "moderate", fluid = false }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, h - ((v - min) / rng) * (h - 4) - 2 ]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const last = pts[pts.length - 1];
  return (
    <svg className={`spark band-${band}`} width={fluid ? "100%" : w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={fluid ? "none" : "xMidYMid meet"} style={{ display: "block" }}>
      <polygon points={area} fill="var(--bc)" opacity="0.10"></polygon>
      <polyline points={line} fill="none" stroke="var(--bc)" strokeWidth="1.5" strokeLinejoin="round"></polyline>
      <circle cx={last[0]} cy={last[1]} r="2.4" fill="var(--bc)"></circle>
    </svg>
  );
}

/* ---- trend chip ----------------------------------------------------------
   delta comes from RD.trends (measured against stored score snapshots in this
   browser — see initTrends in live.js). null = no old-enough history yet, and
   the chip says so instead of showing a seeded number. */
function Trend({ delta, suffix = "", horizon = "24h" }) {
  if (delta == null) return (
    <span className="trend flat" title={`The measured ${horizon} change appears once enough score history has accumulated in this browser. Trends are computed from stored snapshots, never seeded.`}>
      <Icon name="flat" size={13} />—
      <span className="faint" style={{ fontSize: 10 }}>{horizon} · resilience</span>
    </span>
  );
  const d = +(+delta).toFixed(1);
  const dir = d > 0.05 ? "up" : d < -0.05 ? "down" : "flat";
  const ic = dir === "up" ? "arrowUp" : dir === "down" ? "arrowDown" : "flat";
  const tip = dir === "up"
    ? `Resilience rose ${d} pts over the last ${horizon} (vs stored history). Higher is stronger, so this is an improvement.`
    : dir === "down"
    ? `Resilience fell ${Math.abs(d)} pts over the last ${horizon} (vs stored history). Higher is stronger, so a drop is an erosion.`
    : `Effectively flat over the last ${horizon} (vs stored history).`;
  return (
    <span className={`trend ${dir}`} title={tip}>
      <Icon name={ic} size={13} />{d > 0 ? "+" : ""}{d}{suffix}
      <span className="faint" style={{ fontSize: 10 }}>{horizon} · resilience</span>
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
    const names = sh.map((s) => s.short || s.name).join(" & ");
    const gap = +(RD.headline.structural.value - d.value).toFixed(1);
    return {
      kicker: "Live factors",
      caption: names ? `${names} pressure is today's main load` : `Load is light today`,
      text: `${names} pressure on the sea routes is the active load today. It reaches the score through measured ship transits, which already reflect how carriers reroute, and leaves live ${gap} pts below the ceiling.`,
    };
  }
  const weakest = RD.sectors.reduce((a, b) => (b.score < a.score ? b : a));
  return {
    kicker: "Drivers · refreshed monthly",
    caption: `Most-exposed sector: ${weakest.name} ${weakest.score.toFixed(1)}`,
    text: `Capacity, Absorb · Recover · Adapt, set against the most-exposed sector (${weakest.name} ${weakest.score.toFixed(1)}). Recomputed monthly from public data.`,
  };
}

function ScoreCard({ d }) {
  const b = RD.band(d.value);
  const dr = headlineDrivers(d);
  const half = d.rangeHalf || 0;
  const lo = Math.max(0, +(d.value - half).toFixed(1));
  const hi = Math.min(100, +(d.value + half).toFixed(1));
  const conf = d.confidence;
  return (
    <div className={`score-card band-${b.key}`}>
      <div className="score-top">
        <span className="score-name">{d.name}</span>
        <span className="score-tag">{d.tag}</span>
        <span style={{ marginLeft: "auto" }}>
          {d === RD.headline.live ? (
            <span className="src live" role="button" tabIndex={0} style={{ cursor: "pointer" }}
              title="Live Resilience blends five public feeds, PortWatch, Open-Meteo, Google News, Markets, OFAC; GDELT conflict coverage powers counterpart context on other views"
              onClick={(e) => { e.stopPropagation(); window.__explain && window.__explain({
                kicker: "Live feeds · updating continuously", title: "What feeds the Live Resilience score",
                text: "Live Resilience is not a single-source number. It is the structural ceiling minus today's active load, and that load is measured from five public feeds. Maritime throughput (PortWatch) is typically the largest mover, which is why it often leads, but it is never the only input. The news monitor adds two early-warning lanes: trade-route closure coverage and adverse partner-supply coverage (a Qatar, Taiwan, Kazakhstan, China or India supply shock), so a partner disruption registers here before throughput data would confirm it. A sixth feed, ACLED conflict data, deliberately does not enter this score, it powers the live counterpart-risk context on the Dependencies and Control views.",
                formula: "Active load  =  maritime throughput + sea state + trade-route news + partner-supply news + market stress + sanctions drift",
                inputs: [
                  { k: "Maritime throughput, typically the largest driver", v: "chokepoint transit calls vs 12-month norm", src: "ais" },
                  { k: "Sea state", v: "wave height & wind on the approaches", src: "meteo" },
                  { k: "Trade-route news", v: "closure & conflict coverage", src: "gdelt" },
                  { k: "Partner-supply news", v: "adverse supply-shock coverage on Qatar / Taiwan / Kazakhstan / China / India", src: "gdelt" },
                  { k: "Market stress", v: "Brent & the Brent-linked LNG replacement cost", src: "yfinance" },
                  { k: "Sanctions drift", v: "OFAC SDN updates", src: "ofac" },
                ],
              }); }}>
              <span className="d"></span>5 live feeds
            </span>
          ) : <SourceTag src="curated" />}
        </span>
      </div>
      <div className="score-row">
        <span className="score-num mono">{d.value.toFixed(1)}</span>
        <span className="score-of mono">/ 100</span>
        <div className="score-meta">
          <span className="score-band"><span className="sq"></span>{b.label}</span>
          <Trend delta={RD.trends ? (d === RD.headline.live ? RD.trends.live : RD.trends.structural) : null} horizon={d.horizon || "24h"} />
        </div>
      </div>
      <div className="score-track" style={{ position: "relative" }}>
        {half > 0 ? (
          <div className="score-range-band" title={`±${half.toFixed(1)} pts · sensitivity range`} style={{ left: lo + "%", width: (hi - lo) + "%" }}></div>
        ) : null}
        <div className="score-fill" style={{ width: d.value + "%" }}></div>
        {d.cap ? (
          <div className="score-frontier" style={{ left: d.cap.at + "%" }} title={d.cap.label}>
            <span className="score-frontier-flag">{d.cap.label}</span>
          </div>
        ) : null}
      </div>
      <div className="score-caption">
        <span className="score-caption-t">{dr.caption}</span>
        <button className="exp" onClick={(e) => { e.stopPropagation(); window.__explain && window.__explain({
          kicker: "Score methodology", title: d.name, text: d.explain, formula: d.formula,
          inputs: d.inputs, assumption: d.assumption,
          range: d.rangeHalf != null ? { lo, hi, half, confidence: conf } : undefined,
          sensitivity: d.sensitivity,
          links: d.name === "Live Resilience"
            ? [{ label: "Today's live drivers · Live signals", view: "threats" }, { label: "Stress-test the score · Scenarios", view: "scenarios" }, { label: "Model chain & ledger · How it works", view: "methodology" }]
            : [{ label: "The imports behind the weak link · Dependencies", view: "dependencies" }, { label: "Raise the ceiling · Sector responses", view: "act" }, { label: "Model chain & ledger · How it works", view: "methodology" }],
          context: [
            { h: dr.kicker, t: dr.text },
            d.cap ? { h: "Reading the scale", t: d.cap.lead + " " + d.cap.body } : null,
          ].filter(Boolean),
        }); }}>How is this calculated?</button>
      </div>
    </div>
  );
}

/* ---- sector card -------------------------------------------------------- */
function SectorCard({ s, onOpen }) {
  const b = RD.band(s.score);
  const explain = useExplain();
  const shalf = s.rangeHalf || 0;
  const slo = Math.max(0, +(s.score - shalf).toFixed(1));
  const shi = Math.min(100, +(s.score + shalf).toFixed(1));
  const ps = RD.precursors.filter((p) => p.sector === s.id);
  const cw = ps.reduce((a, p) => a + p.consequence, 0) || 1;
  const sumSel = ps.reduce((a, p) => a + p.dri * p.consequence, 0);
  const driInputs = ps.map((p) => ({
    k: (p.name === s.topRisk ? "★ " : "") + p.name,
    v: "DRI " + p.dri + " × consequence " + p.consequence.toFixed(2) + " = " + (p.dri * p.consequence).toFixed(1),
    go: { view: "dependencies", opts: { sector: s.id, import: p.id }, hint: "Open " + p.name + " in Dependencies, sources, buffer, DRI breakdown" },
  }));
  driInputs.push(
    { k: "Step 1 · Pick the anchor ★", v: s.topRisk + ", highest DRI × consequence (" + (s.topSel != null ? s.topSel : "—") + " above). Its raw DRI (" + s.topDRI + ") enters the formula." },
    { k: "Step 2 · Weighted mean DRI", v: "Σ(DRI × consequence) ÷ Σ consequence = " + sumSel.toFixed(1) + " ÷ " + cw.toFixed(2) + " = " + (s.wmean != null ? s.wmean : s.wdri) },
    { k: "Step 3 · Anchored fragility", v: (() => { const a = +(0.6 * s.topDRI).toFixed(1); const b = +(s.wdri - a).toFixed(1); return "0.6 × " + s.topDRI + " + 0.4 × " + (s.wmean != null ? s.wmean : s.wdri) + " = " + a.toFixed(1) + " + " + b.toFixed(1) + " = " + s.wdri; })() },
    { k: "Step 4 · Resilience", v: "100 − " + s.wdri + " = " + s.score.toFixed(1) + " / 100" },
    { k: "30d change", v: (RD.trends && RD.trends.sectors && RD.trends.sectors[s.id] != null) ? RD.trends.sectors[s.id].toFixed(1) + " pts, measured from stored score history" : "no stored history yet, accumulates in this browser" },
  );
  return (
    <div className={`sector band-${b.key} fade-in`} onClick={() => onOpen(s)}>
      <div className="sector-top">
        <span className="sector-name">{s.name}</span>
        <span className="sector-band">{b.label}</span>
      </div>
      <div className="sector-score">
        <span className="sector-num mono">{s.score.toFixed(1)}</span>
        {(() => { const t = RD.trends && RD.trends.sectors ? RD.trends.sectors[s.id] : null;
          return t == null
            ? <span className="mini-trend" style={{ color: "var(--faint)" }} title="The 30-day change appears once a month of score history has accumulated in this browser.">30d —</span>
            : <span className={`mini-trend ${t >= 0 ? "up" : "down"}`} title="Measured 30-day change from stored score history">{t >= 0 ? "▲" : "▼"} {Math.abs(t).toFixed(1)} · 30d</span>; })()}
        {shalf > 0 && (
          <span className="sector-conf mono" title={`Sensitivity range ${slo.toFixed(1)}–${shi.toFixed(1)}${s.confidence ? " · " + s.confidence.label : ""}`}>±{shalf.toFixed(1)}</span>
        )}
        <span style={{ marginLeft: "auto" }}>
          <Fx payload={{
            kicker: "Sector score · computed", title: s.name + " resilience",
            text: s.note,
            inputs: driInputs,
            range: s.rangeHalf != null ? { lo: slo, hi: shi, half: shalf, confidence: s.confidence } : undefined,
            sensitivity: s.sensitivity,
            links: [
              { label: "The " + ps.length + " tracked " + s.name + " imports · Dependencies", view: "dependencies", opts: { sector: s.id } },
              { label: "Responses for " + s.name + " · Sector responses", view: "act", opts: { sector: s.id } },
            ],
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
            {payload.links && payload.links.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
                {payload.links.map((l, i) => (
                  <button key={i} className="exp" style={{ textAlign: "left", lineHeight: 1.5 }}
                    onClick={() => { onClose(); window.__go && window.__go(l.view, l.opts || {}); }}>
                    {l.label}&nbsp;→
                  </button>
                ))}
              </div>
            )}
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
          {payload.context && payload.context.map((c, i) => (
            <div className="exp-sec" key={"ctx" + i}>
              <h4>{c.h}</h4>
              <p className="exp-text">{c.t}</p>
            </div>
          ))}
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
                <div className="input-row" key={i} onClick={r.go ? () => { onClose(); window.__go && window.__go(r.go.view, r.go.opts || {}); } : undefined}
                  style={r.go ? { cursor: "pointer" } : undefined}
                  title={r.go ? (r.go.hint || "Open in " + r.go.view) : undefined}>
                  <div className="input-k">{r.k}{r.go ? <span style={{ color: "var(--accent, var(--bc))", marginLeft: 5, fontSize: 11 }}>→</span> : null}</div>
                  <div className="input-v">{r.v}{r.src && <> <SourceTag src={r.src} /></>}</div>
                </div>
              ))}
            </div>
          )}
          {payload.range && (
            <div className="exp-sec">
              <h4>Confidence &amp; range</h4>
              <div className="conf-row">
                <span className={`conf-chip conf-${payload.range.confidence ? payload.range.confidence.k : "moderate"}`}>
                  <span className="conf-dot"></span>{payload.range.confidence ? payload.range.confidence.label : "Range"}
                </span>
                <span className="conf-range mono">{payload.range.lo.toFixed(1)} – {payload.range.hi.toFixed(1)}</span>
                <span className="faint" style={{ fontSize: 11 }}>±{payload.range.half.toFixed(1)} pts</span>
              </div>
              <p className="exp-text" style={{ marginTop: 9 }}>The headline is a central estimate, not a precise reading. This range is how far it moves when each editable assumption is nudged to the high and low ends of what's reasonable. A tighter range means higher confidence.</p>
            </div>
          )}
          {(() => {
            const list = (payload.sensitivity || []).filter((s) => s.d >= 0.05);
            if (!list.length) return null;
            const mx = Math.max.apply(null, list.map((x) => x.d)) || 1;
            return (
              <div className="exp-sec">
                <h4>What moves it most</h4>
                <div className="tornado">
                  {list.map((s, i) => (
                    <div className="torn-row" key={i}>
                      <span className="torn-k">{s.k}</span>
                      <div className="torn-track"><div className="torn-fill" style={{ width: (s.d / mx) * 100 + "%" }}></div></div>
                      <span className="torn-v mono">±{s.d.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <p className="exp-text" style={{ marginTop: 9 }}>Each bar is one assumption's own contribution to the range, the longest bar is the lever worth pinning down first.</p>
              </div>
            );
          })()}
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
        { k: "Live feeds (6)", v: "Five move the Live score, IMF PortWatch transits, Google News trade-route & partner coverage, Open-Meteo sea state, Brent, OFAC sanctions total, plus GDELT conflict coverage for counterpart context", src: "live" },
        { k: "Curated data", v: RD.precursors.length + " critical imports, " + RD.assets.length + " strategic assets, " + RD.scenarios.length + " scenarios, human-readable CSV", src: "curated" },
        { k: "Assumptions", v: "Goalposts, weights & buffers, all stated and editable", src: "assumption" },
      ],
      assumption: "Every number can be traced to its source and method. Nothing here is a classified or official Government of UAE position: it is a transparent worked example of how national resilience could be quantified.",
    })}>
      <span className="pulse"></span><b>ILLUSTRATIVE MODEL</b>
      <Icon name="info" size={13} style={{ color: "var(--faint)" }} />
    </button>
  );
}

Object.assign(window, { Icon, SourceTag, Fx, Sparkline, Trend, BandTag, Panel, ScoreCard, SectorCard, Drawer, IllusBadge, ExplainCtx, useExplain });
