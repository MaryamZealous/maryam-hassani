/* ============================================================================
   Signature animated cascade — watch a shock propagate across layers.
   Trigger → Precursor → Asset → Sector → National score, on a 0–90 day timeline.
   ========================================================================== */
const { useState, useEffect } = React;
const W = 1180, H = 440, NW = 152, NH = 46;
const LAYER_X = [100, 345, 590, 835, 1080];
const LAYER_NAME = ["Trigger", "Precursors", "Assets", "Sectors", "National"];

function buildLayout() {
  const byLayer = {};
  RD.cascade.nodes.forEach((n) => { (byLayer[n.layer] = byLayer[n.layer] || []).push(n); });
  const pos = {};
  Object.keys(byLayer).forEach((L) => {
    const arr = byLayer[L]; const n = arr.length;
    const top = 64, bot = 376, span = bot - top;
    arr.forEach((node, i) => {
      const y = n === 1 ? (top + bot) / 2 : top + (span * i) / (n - 1);
      pos[node.id] = { x: LAYER_X[+L], y };
    });
  });
  return pos;
}
const POS = buildLayout();

function edgePath(a, b) {
  const x1 = a.x + NW / 2, y1 = a.y, x2 = b.x - NW / 2, y2 = b.y;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function CascadeDiagram() {
  const days = RD.cascade.timeline;
  const [dayIdx, setDayIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState(null);
  const explain = useExplain();
  const day = days[dayIdx];

  useEffect(() => {
    if (!playing) return;
    if (dayIdx >= days.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setDayIdx((i) => i + 1), 900);
    return () => clearTimeout(t);
  }, [playing, dayIdx]);

  const nodeActive = (n) => day >= n.day;
  const edgeHot = (e) => {
    const a = RD.cascade.nodes.find((n) => n.id === e[0]);
    const b = RD.cascade.nodes.find((n) => n.id === e[1]);
    return nodeActive(a) && nodeActive(b);
  };

  // Projected national score eases from today's live baseline toward the floor
  // the Hormuz-closure scenario projects (see Scenarios) — so the cascade ends
  // where the scenario engine says it should, not at an invented number.
  const liveBase = RD.headline.live.value;
  const hzScn = RD.scenarios.find((s) => s.id === "hormuz");
  const floor = Math.max(0, +(liveBase + (hzScn ? hzScn.overall : -22)).toFixed(1));
  const proj = (liveBase - (liveBase - floor) * (dayIdx / (days.length - 1))).toFixed(1);

  // caption: nodes that activated at this day
  const justNow = RD.cascade.nodes.filter((n) => n.day === day);
  const caption = day === 0
    ? "Shock fires. Buffers begin drawing down across every sea-routed dependency."
    : justNow.length
      ? justNow.map((n) => n.detail).join("  ")
      : "Buffers continue depleting; no new node crosses its threshold this step.";

  const openNode = (n) => {
    setSel(n.id);
    const layerName = ["Trigger", "Precursor", "Asset", "Sector", "National score"][n.layer];
    explain({
      kicker: layerName + (n.day ? " · activates day " + n.day : " · day 0"),
      title: n.label,
      text: n.detail,
      formula: n.kind === "precursor"
        ? "Time-to-impact  =  buffer days  −  days since shock"
        : n.kind === "sector"
          ? "Sector falls when its binding precursor's buffer is exhausted"
          : n.kind === "overall"
            ? "Overall anchors to the most-exposed sector  =  0.60 × most-exposed  +  0.40 × capacity"
            : "Trigger removes the shipping route that feeds downstream buffers",
      inputs: [
        { k: "Propagation layer", v: layerName },
        { k: "Activates at", v: n.day === 0 ? "Day 0 (immediate)" : "Day " + n.day },
        { k: "Severity at peak", v: RD.band(n.band === "critical" ? 30 : n.band === "high" ? 50 : 67).label },
      ],
      assumption: "Propagation timing is driven by published buffer days. Real-world lags vary; treat day markers as illustrative order-of-magnitude, not precise forecasts.",
    });
  };

  return (
    <div className="cascade-wrap">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button className="btn primary" onClick={() => { if (dayIdx >= days.length - 1) setDayIdx(0); setPlaying((p) => !p); }}>
          <Icon name={playing ? "flat" : "play"} size={15} />{playing ? "Pause" : dayIdx >= days.length - 1 ? "Replay cascade" : "Play cascade"}
        </button>
        <button className="btn ghost" onClick={() => { setPlaying(false); setDayIdx(0); setSel(null); }}>
          <Icon name="reset" size={14} />Reset
        </button>
        <div className="flow-legend" style={{ marginLeft: "auto" }}>
          <span className="legend-i"><span className="sw" style={{ background: "var(--crit)" }}></span>Critical</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--high)" }}></span>High</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--mod)" }}></span>Moderate</span>
          <span className="helper">Click any node to see why it fails and when.</span>
        </div>
      </div>

      <svg className="cascade-svg" viewBox={`0 0 ${W} ${H}`} role="img">
        {/* column labels */}
        {LAYER_X.map((x, i) => (
          <text key={i} className="casc-col-label" x={x} y={26} textAnchor="middle">{LAYER_NAME[i]}</text>
        ))}
        {/* base edges */}
        {RD.cascade.edges.map((e, i) => {
          const a = POS[e[0]], b = POS[e[1]];
          return <path key={"b" + i} className="casc-edge" d={edgePath(a, b)} opacity={edgeHot(e) ? 0.25 : 0.6} />;
        })}
        {/* hot pulse edges */}
        {RD.cascade.edges.filter(edgeHot).map((e, i) => {
          const a = POS[e[0]], b = POS[e[1]];
          const tgt = RD.cascade.nodes.find((n) => n.id === e[1]);
          return <path key={"p" + i} className={`casc-pulse band-${tgt.band}`} d={edgePath(a, b)} stroke="var(--bc)" />;
        })}
        {/* nodes */}
        {RD.cascade.nodes.map((n) => {
          const p = POS[n.id]; const act = nodeActive(n);
          return (
            <g key={n.id}
              className={`casc-node band-${n.band} ${act ? "active" : "dim"} ${sel === n.id ? "sel" : ""}`}
              transform={`translate(${p.x - NW / 2},${p.y - NH / 2})`} onClick={() => openNode(n)}>
              <rect className="body" width={NW} height={NH} rx="8"
                fill={act ? "var(--panel-2)" : "var(--panel)"}
                stroke={sel === n.id ? "var(--accent)" : act ? "var(--bc)" : "var(--line-2)"}
                strokeWidth={sel === n.id ? 2 : act ? 1.4 : 1} />
              <rect className="accent" width="4" height={NH} rx="2" fill="var(--bc)" opacity={act ? 1 : 0.4} />
              <text className="nlabel" x="16" y={NH / 2 - 2} dominantBaseline="middle">{n.label}</text>
              <text className="nday" x="16" y={NH - 11}>{n.day === 0 ? "immediate" : "day " + n.day}</text>
              {act && <circle cx={NW - 14} cy={NH / 2} r="3.4" fill="var(--bc)" />}
            </g>
          );
        })}
      </svg>

      {/* timeline */}
      <div className="timeline">
        {days.map((d, i) => (
          <button key={d} className={`tl-step ${i === dayIdx ? "on" : ""} ${i < dayIdx ? "passed" : ""}`}
            onClick={() => { setPlaying(false); setDayIdx(i); }}>
            <span className="tl-line"></span>
            <span className="tl-dot"></span>
            <span className="tl-day">{d === 0 ? "D0" : "D" + d}</span>
          </button>
        ))}
      </div>

      {/* readout */}
      <div className="casc-readout">
        <div>
          <div className="casc-day">Day {day}</div>
        </div>
        <div className="casc-cap">{caption}</div>
        <div className="casc-proj">
          <div className="v mono">{proj}</div>
          <div className="l">Projected national score</div>
        </div>
      </div>
    </div>
  );
}

window.CascadeDiagram = CascadeDiagram;
