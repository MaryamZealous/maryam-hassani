/* ============================================================================
   Views, part 2 — Map, Dependencies, Control Layer, Operations, Methodology
   ========================================================================== */
const { useState } = React;

/* ---------- Asset Map (real world geography + directional flows) -------- */
const MAP_W = 1200, MAP_H = 468, LAT_T = 78, LAT_B = -56, LON0 = 58;
const GULF = { lonMin: 46, lonMax: 60.5, latMin: 20.5, latMax: 31, w: 270, h: 198 };
const GULF_NAMES = new Set(["Saudi Arabia", "Iran", "Oman", "United Arab Emirates", "Qatar", "Kuwait", "Iraq"]);
function proj(lng, lat) {
  const lon = ((lng - LON0 + 180) % 360 + 360) % 360 - 180;
  return [(lon + 180) / 360 * MAP_W, (LAT_T - lat) / (LAT_T - LAT_B) * MAP_H];
}
function insetProj(lng, lat) {
  return [(lng - GULF.lonMin) / (GULF.lonMax - GULF.lonMin) * GULF.w, (GULF.latMax - lat) / (GULF.latMax - GULF.latMin) * GULF.h];
}
function geoPath(geom, P, wrap) {
  P = P || proj; wrap = wrap || MAP_W * 0.5;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  for (const poly of polys) for (const ring of poly) {
    let px = null;
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = P(ring[i][0], ring[i][1]);
      d += (px === null || Math.abs(x - px) > wrap ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      px = x;
    }
    d += "Z";
  }
  return d;
}
const UAE_LL = [54.4, 24.5];
const CHOKE = { hormuz: [56.4, 26.6], redsea: [43.3, 12.6], suez: [32.5, 30.2] };
const GEO_SRC = {
  "United States of America": { label: "United States", who: "RO membranes · GNSS", cons: 0.90, lng: -98, lat: 39, tip: "Leading source of reverse-osmosis membranes within a concentrated US/Japan/Korea supplier set — the spine of UAE desalination — plus precision-timing modules." },
  "Taiwan": { label: "Taiwan", who: "Leading-edge chips", cons: 0.85, lng: 121, lat: 23.6, tip: "Fabrication of advanced silicon for EDGE guided-systems concentrates here, but the binding risk is US export-control licensing, not a Taiwan supply halt — a channel that eased in late 2025." },
  "India": { label: "India", who: "APIs · devices · labour", cons: 0.85, lng: 79, lat: 22.5, dy: 17, tip: "65% of active pharma ingredients and the largest share of critical-infrastructure workers." },
  "Kazakhstan": { label: "Kazakhstan", who: "LEU nuclear fuel", cons: 0.80, lng: 67, lat: 48, tip: "Long-lead enriched-uranium fuel for Barakah — a 540-day buffer with no near alternative." },
  "Qatar": { label: "Qatar", who: "Piped gas (Dolphin)", cons: 1.00, lng: 51.2, lat: 25.3, dx: -10, dy: -10, anchor: "end", tip: "25% of gas for power and water via the Dolphin pipeline. Contract runs to 2032." },
  "Canada": { label: "Canada", who: "Potash · wheat", cons: 0.55, lng: -109, lat: 57, tip: "Fertiliser and grain feedstock — diversified, lower-risk food inputs." },
  "Russia": { label: "Russia", who: "Potash · wheat", cons: 0.60, lng: 62, lat: 61, tip: "Alternate potash and wheat supply; counterpart risk elevated by sanctions exposure." },
  "China": { label: "China", who: "Medical devices", cons: 0.65, lng: 103, lat: 35, tip: "40% of medical devices on a thin 45-day buffer, with rising counterpart risk." },
  "Australia": { label: "Australia", who: "Wheat", cons: 0.60, lng: 134, lat: -25, tip: "Diversified grain supply that deepens national food reserves." },
  "United Arab Emirates": { label: "UAE", hub: true, lng: 54.4, lat: 24.5, who: "Jebel Ali · Barakah · Taweelah", tip: "The hub. 60% of imports land at Jebel Ali, then re-export across the region — dependency runs both ways." },
};
const FLOWS = [
  { from: "United States of America", via: "suez" }, { from: "Taiwan", via: null },
  { from: "India", via: "hormuz" }, { from: "Kazakhstan", via: null }, { from: "Qatar", via: null },
  { from: "Canada", via: "suez" }, { from: "Russia", via: null }, { from: "China", via: "hormuz" },
  { from: "Australia", via: null },
];
const OUTFLOWS = [
  { label: "Crude → East Asia (via Hormuz)", to: [114, 27], via: "hormuz", type: "export", tip: "The bulk of energy exports still transit the Strait of Hormuz to East-Asian buyers — the UAE's largest, and most exposed, outbound flow." },
  { label: "Fujairah bypass → Asia", from: [56.33, 25.17], to: [90, 8], via: null, type: "export", tip: "Fujairah's east-coast terminal ships crude straight to Asia WITHOUT entering the Strait of Hormuz — the UAE's strategic Hormuz bypass." },
  { label: "Energy → Europe", to: [11, 45], via: "suez", type: "transit", tip: "Crude and product routed through the Red Sea and Suez to European markets." },
  { label: "Re-export → East Africa", to: [40, 5], via: "redsea", type: "transit", tip: "Jebel Ali re-export hub supplies East-African markets — the UAE as regional entrepôt." },
];
function arcD(a, b, lift) {
  const cx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * lift, cy = (a[1] + b[1]) / 2 + (b[0] - a[0]) * lift;
  return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
}
function routeD(from, to, via, lift) {
  if (!via) return arcD(from, to, lift);
  const v = proj(CHOKE[via][0], CHOKE[via][1]);
  return arcD(from, v, lift * 0.8) + arcD(v, to, lift * 0.8).replace("M", "L");
}

const Z_MIN = 1, Z_MAX = 64, ASSET_ZOOM = 3;
const ASSET_FILL = { port: "var(--accent)", energy: "var(--high)", water: "var(--good)" };
const ASSET_IO = {
  jebelali: "Imports ≈60% of national goods · regional re-export hub",
  fujairah: "Crude-export terminal · bypasses the Strait of Hormuz",
  taweelah: "World's largest RO plant · membrane-dependent",
  barakah: "5.6 GW nuclear baseload · LEU-fuelled",
  ruwais: "Downstream refining & petrochemicals hub",
  dubaiwater: "Municipal network · thin operational storage · 90-day federal strategic reserve",
  portrashid: "Cruise & heritage today · freight role absorbed by Jebel Ali",
};
// hand-placed label offsets so the tight Abu Dhabi–Dubai cluster doesn't collide
const ASSET_LABEL = {
  jebelali: { short: "Jebel Ali Port", dx: 9, dy: 3, anchor: "start" },
  dubaiwater: { short: "Dubai network", dx: 9, dy: 15, anchor: "start" },
  taweelah: { short: "Taweelah", dx: 2, dy: -9, anchor: "middle" },
  barakah: { short: "Barakah", dx: -9, dy: 3, anchor: "end" },
  ruwais: { short: "Ruwais", dx: -9, dy: 15, anchor: "end" },
  fujairah: { short: "Fujairah", dx: 9, dy: 3, anchor: "start" },
  portrashid: { short: "Port Rashid", dx: 9, dy: -7, anchor: "start" },
};
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function clampView(k, x, y) {
  return { k, x: clamp(x, MAP_W - MAP_W * k, 0), y: clamp(y, MAP_H - MAP_H * k, 0) };
}

const LandLayer = React.memo(function LandLayer({ paths, onTip, onPick }) {
  return paths.map((p) => {
    const s = GEO_SRC[p.name];
    return <path key={p.name} className={"geo-land" + (s ? " src" : "")} d={p.d} style={{ vectorEffect: "non-scaling-stroke" }}
      onMouseEnter={s ? () => onTip({ b: s.hub ? "National hub" : "Source country", text: s.label + " — " + s.tip, who: s.who }) : undefined}
      onMouseLeave={s ? () => onTip(null) : undefined}
      onClick={s && !s.hub ? () => onPick(p.name) : undefined} />;
  });
});

const WorldMap = React.memo(function WorldMap({ layers, onTip, onPick }) {
  const [geo, setGeo] = useState(null);
  const [err, setErr] = useState(false);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const svgRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => { if (alive && window.topojson) setGeo(window.topojson.feature(topo, topo.objects.countries).features); })
      .catch(() => setErr(true));
    return () => { alive = false; };
  }, []);
  const paths = React.useMemo(() => geo ? geo.map((f) => ({ name: f.properties.name, d: geoPath(f.geometry) })) : [], [geo]);

  const svgXY = (clientX, clientY) => {
    const r = svgRef.current.getBoundingClientRect();
    return [(clientX - r.left) / r.width * MAP_W, (clientY - r.top) / r.height * MAP_H];
  };
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const h = (e) => {
      e.preventDefault();
      const [sx, sy] = svgXY(e.clientX, e.clientY);
      const f = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      setView((v) => {
        const k = clamp(v.k * f, Z_MIN, Z_MAX);
        return clampView(k, sx - (sx - v.x) / v.k * k, sy - (sy - v.y) / v.k * k);
      });
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [geo]);

  if (err) return <div className="map-loading">World geography unavailable offline — dependency flows are listed below.</div>;
  if (!geo) return <div className="map-loading">Loading world geography…</div>;

  const zoomAt = (sx, sy, f) => setView((v) => {
    const k = clamp(v.k * f, Z_MIN, Z_MAX);
    return clampView(k, sx - (sx - v.x) / v.k * k, sy - (sy - v.y) / v.k * k);
  });
  const onDown = (e) => { const [sx, sy] = svgXY(e.clientX, e.clientY); drag.current = { sx, sy, x: view.x, y: view.y }; e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => { if (!drag.current) return; const [sx, sy] = svgXY(e.clientX, e.clientY); setView((v) => clampView(v.k, drag.current.x + (sx - drag.current.sx), drag.current.y + (sy - drag.current.sy))); };
  const onUp = () => { drag.current = null; };

  const k = view.k;
  const S = (pt) => [pt[0] * k + view.x, pt[1] * k + view.y];
  const P = (lng, lat) => S(proj(lng, lat));
  const hubS = P(UAE_LL[0], UAE_LL[1]);
  const routeS = (a, b, via, lift) => {
    if (!via) return arcD(a, b, lift);
    const v = P(CHOKE[via][0], CHOKE[via][1]);
    return arcD(a, v, lift * 0.8) + arcD(v, b, lift * 0.8).replace("M", "L");
  };
  const showAssets = k >= ASSET_ZOOM;

  return (
    <React.Fragment>
    <svg ref={svgRef} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: "100%", display: "block", touchAction: "none" }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { onUp(); onTip(null); }}>
      <defs>
        <marker id="mk-import" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" /></marker>
        <marker id="mk-export" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L6,3 L0,6 Z" fill="var(--gold,#BE7322)" /></marker>
        <marker id="mk-transit" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L6,3 L0,6 Z" fill="var(--good)" /></marker>
      </defs>
      <rect width={MAP_W} height={MAP_H} fill="var(--panel-2)" />
      <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>
        <LandLayer paths={paths} onTip={onTip} onPick={onPick} />
      </g>
      {/* flows */}
      {layers.imports && FLOWS.map((fl) => {
        const s = GEO_SRC[fl.from]; const d = routeS(P(s.lng, s.lat), hubS, fl.via, 0.16); const w = 0.8 + s.cons * 3;
        return (
          <g key={fl.from} className="flow-grp" onMouseEnter={() => onTip({ b: "Import → UAE", text: s.label + " — " + s.tip, who: s.who + " · consequence " + s.cons.toFixed(2) })} onMouseLeave={() => onTip(null)}>
            <path className="flow-arc import" d={d} markerEnd="url(#mk-import)" strokeWidth={w} />
            <path className="flow-pulse import casc-pulse" d={d} strokeWidth={w} />
          </g>
        );
      })}
      {layers.exports && OUTFLOWS.map((fl, i) => {
        const d = routeS(hubS, P(fl.to[0], fl.to[1]), fl.via, 0.16);
        return (
          <g key={i} className="flow-grp" onMouseEnter={() => onTip({ b: fl.type === "export" ? "Export ← UAE" : "Transit · hub", text: fl.label + " — " + fl.tip })} onMouseLeave={() => onTip(null)}>
            <path className={"flow-arc " + fl.type} d={d} markerEnd={`url(#mk-${fl.type})`} />
            <path className={"flow-pulse casc-pulse " + fl.type} d={d} />
          </g>
        );
      })}
      {layers.chokes && RD.chokepoints.map((c) => {
        const p = P(CHOKE[c.id][0], CHOKE[c.id][1]);
        return (
          <g key={c.id} className={`map-node band-${c.band}`} onClick={() => onPick("choke:" + c.id)}
            onMouseEnter={() => onTip({ b: "Chokepoint · " + RD.band(c.band === "critical" ? 30 : c.band === "high" ? 50 : 80).label, text: c.name + " — " + c.note, who: c.vessels + " / " + c.baseline + " vessels · −" + c.drop + "%" })}
            onMouseLeave={() => onTip(null)}>
            <circle cx={p[0]} cy={p[1]} r="13" fill="none" stroke="var(--bc)" opacity="0.35">
              <animate attributeName="r" values="11;22;11" dur="2.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.45;0;0.45" dur="2.6s" repeatCount="indefinite" />
            </circle>
            <rect x={p[0] - 6} y={p[1] - 6} width="12" height="12" rx="2" fill="var(--bc)" transform={`rotate(45 ${p[0]} ${p[1]})`} />
            <text x={p[0]} y={p[1] - 15} textAnchor="middle">{({ hormuz: "Hormuz", redsea: "B-Mandeb", suez: "Suez" })[c.id]}</text>
          </g>
        );
      })}
      {layers.countries && Object.entries(GEO_SRC).filter(([, s]) => !s.hub).map(([name, s]) => {
        const p = P(s.lng, s.lat);
        return (
          <g key={name} className="map-node" onClick={() => onPick(name)}
            onMouseEnter={() => onTip({ b: "Source country", text: s.label + " — " + s.tip, who: s.who })} onMouseLeave={() => onTip(null)}>
            <circle cx={p[0]} cy={p[1]} r="3.5" fill="var(--accent)" />
            <text x={p[0] + (s.dx || 0)} y={p[1] + (s.dy || -7)} textAnchor={s.anchor || "middle"}>{s.label}</text>
          </g>
        );
      })}
      {/* in-country assets — revealed on zoom */}
      {showAssets && RD.assets.map((a) => {
        const p = P(a.lng, a.lat); const io = ASSET_IO[a.id]; const L = ASSET_LABEL[a.id] || {};
        return (
          <g key={a.id} className="asset-node map-node" onClick={() => onPick("asset:" + a.id)}
            onMouseEnter={() => onTip({ b: "UAE asset · " + a.kind, text: a.name + " — " + a.note, who: io })} onMouseLeave={() => onTip(null)}>
            <circle cx={p[0]} cy={p[1]} r="4.5" fill={ASSET_FILL[a.kind] || "var(--accent)"} stroke="var(--panel-2)" strokeWidth="1.2" />
            <text x={p[0] + (L.dx || 0)} y={p[1] + (L.dy != null ? L.dy : -8)} textAnchor={L.anchor || "middle"}>{L.short || a.name}</text>
          </g>
        );
      })}
      {/* hub */}
      <g className="map-node" onMouseEnter={() => onTip({ b: "National hub", text: GEO_SRC["United Arab Emirates"].tip, who: GEO_SRC["United Arab Emirates"].who })} onMouseLeave={() => onTip(null)}>
        <circle cx={hubS[0]} cy={hubS[1]} r="16" className="ring" stroke="var(--accent)" opacity="0.4">
          <animate attributeName="r" values="13;26;13" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={hubS[0]} cy={hubS[1]} r="6" fill="var(--accent)" stroke="var(--panel-2)" strokeWidth="1.5" />
        {!showAssets && <text x={hubS[0] - 2} y={hubS[1] + 27} textAnchor="middle" className="hub-label">U·A·E</text>}
      </g>
    </svg>
    <div className="map-zoom">
      <button onClick={() => setView((v) => { const k = clamp(v.k * 2, Z_MIN, Z_MAX); const U = proj(UAE_LL[0], UAE_LL[1]); return clampView(k, MAP_W / 2 - U[0] * k, MAP_H / 2 - U[1] * k); })} title="Zoom into the UAE">+</button>
      <button onClick={() => setView((v) => { const k = clamp(v.k / 2, Z_MIN, Z_MAX); const U = proj(UAE_LL[0], UAE_LL[1]); return clampView(k, MAP_W / 2 - U[0] * k, MAP_H / 2 - U[1] * k); })} title="Zoom out">−</button>
      <button onClick={() => setView({ k: 1, x: 0, y: 0 })} title="Reset view" style={{ fontSize: 13 }}>⤢</button>
    </div>
    <div className="map-hint">Scroll to zoom · drag to pan{showAssets ? <> · <b>in-country assets shown</b></> : <> · <b>zoom into the UAE for assets</b></>}</div>
    </React.Fragment>
  );
});

const UAE_BB = { lonMin: 51.2, lonMax: 57.0, latMin: 23.1, latMax: 26.95, w: 1140, h: 430 };
function uaeProj(lng, lat) {
  return [(lng - UAE_BB.lonMin) / (UAE_BB.lonMax - UAE_BB.lonMin) * UAE_BB.w, (UAE_BB.latMax - lat) / (UAE_BB.latMax - UAE_BB.latMin) * UAE_BB.h];
}
const UAE_DLABEL = {
  jebelali: { short: "Jebel Ali Port", dx: 0, dy: -11, anchor: "middle" },
  dubaiwater: { short: "Dubai network", dx: 12, dy: 4, anchor: "start" },
  taweelah: { short: "Taweelah desal.", dx: -12, dy: -2, anchor: "end" },
  barakah: { short: "Barakah nuclear", dx: 0, dy: 20, anchor: "middle" },
  ruwais: { short: "Ruwais refinery", dx: -12, dy: 2, anchor: "end" },
  fujairah: { short: "Fujairah terminal", dx: 0, dy: -12, anchor: "middle" },
  portrashid: { short: "Port Rashid", dx: 12, dy: -6, anchor: "start" },
};
const UAEDetail = React.memo(function UAEDetail({ onTip, onPick }) {
  const [geo, setGeo] = useState(null);
  useEffect(() => {
    let a = true;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((r) => r.json())
      .then((t) => { if (a && window.topojson) setGeo(window.topojson.feature(t, t.objects.countries).features); }).catch(() => {});
    return () => { a = false; };
  }, []);
  const paths = React.useMemo(() => geo ? geo.filter((f) => GULF_NAMES.has(f.properties.name)).map((f) => ({ name: f.properties.name, d: geoPath(f.geometry, uaeProj, 99999) })) : [], [geo]);
  if (!geo) return <div className="map-loading" style={{ height: 320 }}>Loading UAE detail…</div>;
  const hz = uaeProj(CHOKE.hormuz[0], CHOKE.hormuz[1]);
  const qa = uaeProj(51.4, 25.3);
  const jebel = uaeProj(55.06, 25.0);
  const gas = arcD(qa, jebel, 0.12), sea = arcD(hz, jebel, 0.12);
  const fuj = uaeProj(56.33, 25.17);
  const oman = uaeProj(56.97, 24.15);
  const bypass = arcD(fuj, oman, -0.16);
  return (
    <svg className="uae-detail" viewBox={`0 0 ${UAE_BB.w} ${UAE_BB.h}`} style={{ width: "100%", display: "block" }} onMouseLeave={() => onTip(null)}>
      <defs><marker id="mk-uae" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L5.5,3 L0,6 Z" fill="var(--accent)" /></marker>
      <marker id="mk-uae-out" markerWidth="8" markerHeight="8" refX="5.5" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L5.5,3 L0,6 Z" fill="var(--gold)" /></marker></defs>
      <rect width={UAE_BB.w} height={UAE_BB.h} fill="var(--panel-2)" />
      {paths.map((p) => <path key={p.name} className={"geo-land" + (p.name === "United Arab Emirates" ? " src" : "")} d={p.d}
        onMouseEnter={p.name !== "United Arab Emirates" ? () => onTip({ b: "Neighbour", text: p.name }) : undefined} onMouseLeave={() => onTip(null)} />)}
      {/* inbound flows for context */}
      <path className="flow-arc import" d={gas} markerEnd="url(#mk-uae)" strokeWidth="3.8" />
      <path className="flow-pulse import casc-pulse" d={gas} strokeWidth="3.8" />
      <path className="flow-arc import" d={sea} markerEnd="url(#mk-uae)" strokeWidth="2.4" />
      <path className="flow-pulse import casc-pulse" d={sea} strokeWidth="2.4" />
      {/* outbound — Fujairah crude export, the Hormuz bypass */}
      <path className="flow-arc export" d={bypass} markerEnd="url(#mk-uae-out)" strokeWidth="3.4" style={{ opacity: 0.85 }} />
      <path className="flow-pulse export casc-pulse" d={bypass} strokeWidth="3.4" />
      <text x={oman[0] - 22} y={oman[1] - 12} textAnchor="end" style={{ fill: "var(--gold)", fontWeight: 600 }}>Crude export → Asia</text>
      <text x={oman[0] - 22} y={oman[1] + 2} textAnchor="end" style={{ fill: "var(--gold)", opacity: 0.8 }}>bypasses the Strait of Hormuz</text>
      {/* Hormuz */}
      <g className="map-node band-critical" onClick={() => onPick("choke:hormuz")}
        onMouseEnter={() => { const hzc = RD.chokepoints.find((c) => c.id === "hormuz"); onTip({ b: "Chokepoint · " + hzc.band.toUpperCase(), text: "Strait of Hormuz — " + hzc.vessels + " of " + hzc.baseline + " transit calls/day", who: "−" + hzc.drop + "% vs. 12-month norm" }); }} onMouseLeave={() => onTip(null)}>
        <rect x={hz[0] - 7} y={hz[1] - 7} width="14" height="14" rx="2" fill="var(--bc)" transform={`rotate(45 ${hz[0]} ${hz[1]})`} />
        <text x={hz[0]} y={hz[1] - 14} textAnchor="middle">Hormuz</text>
      </g>
      <g className="map-node"><circle cx={qa[0]} cy={qa[1]} r="4" fill="var(--accent)" /><text x={qa[0]} y={qa[1] - 11} textAnchor="middle">Qatar · gas</text></g>
      {/* assets */}
      {RD.assets.map((a) => {
        const p = uaeProj(a.lng, a.lat); const L = UAE_DLABEL[a.id] || {}; const io = ASSET_IO[a.id];
        return (
          <g key={a.id} className="asset-node map-node" onClick={() => onPick("asset:" + a.id)}
            onMouseEnter={() => onTip({ b: "UAE asset · " + a.kind, text: a.name + " — " + a.note, who: io })} onMouseLeave={() => onTip(null)}>
            <circle cx={p[0]} cy={p[1]} r="7" fill={ASSET_FILL[a.kind] || "var(--accent)"} stroke="var(--panel-2)" strokeWidth="1.6" />
            <text x={p[0] + (L.dx || 0)} y={p[1] + (L.dy != null ? L.dy : -11)} textAnchor={L.anchor || "middle"}>{L.short || a.name}</text>
          </g>
        );
      })}
    </svg>
  );
});

function MapView() {
  const [layers, setLayers] = useState({ imports: true, exports: true, countries: true, chokes: true });
  const [tip, setTip] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [tip2, setTip2] = useState(null);
  const [pos2, setPos2] = useState({ x: 0, y: 0 });
  const explain = useExplain();
  const t = (k) => setLayers((s) => ({ ...s, [k]: !s[k] }));
  const onPick = React.useCallback((id) => {
    if (id.startsWith("choke:")) {
      const c = RD.chokepoints.find((x) => x.id === id.slice(6));
      return explain({ kicker: "Chokepoint", title: c.name, text: c.note, formula: c.real ? "Pressure  =  1 − (7-day avg transits / 12-month norm)" : "Pressure  =  1 − (today / baseline)",
        inputs: [{ k: "Transits", v: c.vessels + " / " + c.baseline + " per day", src: "ais" }, { k: "Drop", v: "−" + c.drop + "%" }],
        assumption: c.real
          ? "Real IMF PortWatch transit calls (satellite AIS), smoothed to a 7-day average and judged against this strait's own 12-month busy-period norm — never an absolute count."
          : "Judged against this strait's own baseline, never an absolute count." });
    }
    if (id.startsWith("asset:")) {
      const a = RD.assets.find((x) => x.id === id.slice(6));
      return explain({ kicker: "UAE strategic asset", title: a.name, text: a.note + (ASSET_IO[a.id] ? ".  " + ASSET_IO[a.id] : ""),
        inputs: [{ k: "Type", v: a.kind }, { k: "Criticality", v: Math.round(a.weight * 100) + " / 100" }, { k: "Location", v: a.lat.toFixed(2) + "°N, " + a.lng.toFixed(2) + "°E" }],
        assumption: "Asset criticality weights are curated from public capacity data, not operational throughput." });
    }
    const s = GEO_SRC[id]; if (!s) return;
    explain({ kicker: "Source dependency", title: s.label, text: s.tip,
      inputs: [{ k: "Supplies", v: s.who }, { k: "Direction", v: "Import → UAE" }],
      assumption: "Country relevance reflects only the precursors tracked in this illustrative model, not total bilateral trade." });
  }, [explain]);
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Global dependency map</div>
        <div className="view-sub">Where the UAE sits in the world's supply web. Each line is a dependency — <b>blue flows in</b> (imports, weighted by national consequence), <b>gold &amp; green flow out</b> (export &amp; transit) — because the UAE is a hub, not an endpoint. Hover anything for why it matters, click for the full logic, and <b>zoom into the UAE to reveal its strategic assets and ports</b>.</div>
      </div>
      <Panel title="Global dependency map" icon="map" label="LIVE FLOWS · ZOOM · HOVER TO EXPLAIN"
        right={<div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[["imports", "Imports"], ["exports", "Export · transit"], ["countries", "Countries"], ["chokes", "Chokepoints"]].map(([k, l]) => (
            <button key={k} className={`dir-btn ${layers[k] ? "active" : ""}`} onClick={() => t(k)}>{l}</button>
          ))}
        </div>}>
        <div className="map-stage" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}>
          <WorldMap layers={layers} onTip={setTip} onPick={onPick} />
          {tip && <div className="map-tip" style={{ left: pos.x, top: pos.y }}>
            {tip.b && <b>{tip.b}</b>}{tip.text}{tip.who && <span className="who2">{tip.who}</span>}
          </div>}
        </div>
        <div className="flow-legend" style={{ marginTop: 10, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <span className="legend-i"><span className="sw" style={{ background: "var(--accent)" }}></span>Import → UAE</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--gold,#BE7322)" }}></span>Export out</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--good)" }}></span>Transit through hub</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--crit)", transform: "rotate(45deg)" }}></span>Chokepoint (live pressure)</span>
          <span className="helper" style={{ marginLeft: "auto" }}>Geography: Natural Earth 1:110m · illustrative flows</span>
        </div>
      </Panel>

      <Panel title="UAE detail — strategic assets &amp; ports" icon="map" label="ZOOMED TO THE EMIRATES" style={{ marginTop: 16 }}>
        <div className="map-stage" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos2({ x: e.clientX - r.left, y: e.clientY - r.top }); }}>
          <UAEDetail onTip={setTip2} onPick={onPick} />
          {tip2 && <div className="map-tip" style={{ left: pos2.x, top: pos2.y }}>{tip2.b && <b>{tip2.b}</b>}{tip2.text}{tip2.who && <span className="who2">{tip2.who}</span>}</div>}
        </div>
        <div className="flow-legend" style={{ marginTop: 10, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <span className="legend-i"><span className="sw" style={{ background: "var(--accent)" }}></span>Port</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--high)" }}></span>Energy</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--good)" }}></span>Water</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--gold)" }}></span>Crude export</span>
          <span className="legend-i"><span className="sw" style={{ background: "var(--crit)", transform: "rotate(45deg)" }}></span>Chokepoint</span>
          <span className="helper" style={{ marginLeft: "auto" }}>Hover an asset for its role &amp; port flows · click for the full logic</span>
        </div>
      </Panel>

      <div className="grid cols-2" style={{ marginTop: 16, gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <Panel title="UAE strategic assets" icon="layers" label="DOMESTIC">
          {RD.assets.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: ASSET_FILL[a.kind] || "var(--accent)", flex: "0 0 auto", opacity: 0.45 + a.weight * 0.55 }}></span>
              <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 168 }}>{a.name}</span>
              <span className="helper" style={{ flex: 1 }}>{a.note}</span>
            </div>
          ))}
          <div className="helper" style={{ paddingTop: 10, marginTop: 2 }}>Colour = asset type (matches the map) · fainter = lower criticality weight.</div>
        </Panel>
        <Panel title="Reading the map" icon="info">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Why a hub, not a list", "60% of imports land at Jebel Ali and re-export across the region — so dependency runs both ways, inbound and outbound."],
              ["Flows inherit chokepoint risk", "Any line routed through Hormuz, Bab-el-Mandeb or Suez carries that chokepoint's live pressure into the sectors it feeds."],
              ["Distance ≠ safety", "Taiwan is far but single-sourced; Qatar is next door but pipeline-locked. Proximity tells you nothing about fragility."]].map(([h, d], i) => (
              <div key={i}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{h}</div>
                <div className="helper">{d}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Dependencies ------------------------------------------------- */
function DependenciesView({ initial }) {
  LIVE.useLiveTick();
  const [filter, setFilter] = useState((initial && initial.sector) || "all");
  const [q, setQ] = useState("");
  const list = RD.precursors.filter((p) => (filter === "all" || p.sector === filter) && p.name.toLowerCase().includes(q.toLowerCase()));
  const [selId, setSelId] = useState(list[0] ? list[0].id : "ro");
  const sel = RD.precursors.find((p) => p.id === selId) || RD.precursors[0];
  const dims = [
    ["concentration", "Source concentration", "How few suppliers or countries provide it today. One dominant source scores high — all your eggs in one basket right now."],
    ["substitutability", "Substitution difficulty", "If that source is cut, how hard it is to switch — technical fit plus time to qualify or retool an alternative. No viable alternative scores high."],
    ["route", "Route exposure", "How much the physical shipment depends on a contested chokepoint (Hormuz, Bab-el-Mandeb, Suez). Chokepoint-locked routes score high."],
    ["counterpart", "Counterpart risk", "Political and sanctions reliability of the supplier — the chance it becomes unwilling or unable to sell (conflict, sanctions, export controls)."],
  ];
  const sectorBand = RD.band(100 - sel.dri).key;
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Dependencies</div>
        <div className="view-sub">The {RD.precursors.length} critical imports the whole model rests on. Each carries a four-dimension Dependency Risk Index (DRI), a buffer in days, and a national-consequence weight. The four dimensions are defined in the breakdown below — all scored so that <b>higher always means more fragile</b>.</div>
      </div>
      <div className="grid cols-2" style={{ gridTemplateColumns: "0.85fr 1.4fr", alignItems: "start" }}>
        <Panel title="Critical imports" icon="chain" label={list.length + " SHOWN"}>
          <input className="search" placeholder="Search imports…" value={q} onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", marginBottom: 10, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", color: "var(--ink)", fontSize: 13, fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {["all", ...RD.sectors.map((s) => s.id)].map((f) => (
              <button key={f} className={`dir-btn ${filter === f ? "active" : ""}`} style={{ fontSize: 10.5, padding: "3px 8px" }} onClick={() => { setFilter(f); }}>
                {f === "all" ? "All" : RD.sectors.find((s) => s.id === f).name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 460, overflowY: "auto" }}>
            {list.map((p) => {
              const b = RD.band(100 - p.dri);
              return (
                <button key={p.id} className={`band-${b.key}`} onClick={() => setSelId(p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: "var(--radius)", textAlign: "left", border: "1px solid " + (selId === p.id ? "var(--accent)" : "var(--line)"), background: selId === p.id ? "var(--accent-soft)" : "var(--panel-2)" }}>
                  <span style={{ width: 6, height: 28, borderRadius: 2, background: "var(--bc)", flex: "0 0 auto" }}></span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                    <span className="helper">{p.source} · {p.buffer}-day buffer</span>
                  </span>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--bc)" }}>{p.dri}</span>
                </button>
              );
            })}
            {!list.length && <div className="empty">No imports match.</div>}
          </div>
        </Panel>

        <div className="stack">
          <Panel title={sel.name} icon="chain"
            right={<span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <BandTag score={100 - sel.dri} /><SourceTag src="curated" /></span>}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
              <div className="kpi"><span className="kpi-v mono">{sel.dri}</span><span className="kpi-l">DRI / 100 <Fx payload={{
                kicker: "Dependency Risk Index", title: "How DRI is built",
                text: "DRI scores how risky a single import is, on four independent 0–25 dimensions that sum to 100. All four are scored the same direction — higher means more fragile.",
                formula: "DRI  =  concentration  +  substitution difficulty  +  route  +  counterpart",
                inputs: dims.map(([k, l, def]) => ({ k: l, v: sel.dims[k] + " / 25 — " + def })),
                assumption: "Concentration vs substitution difficulty are distinct: concentration is how many baskets your eggs are in TODAY; substitution difficulty is whether you could get new baskets if one breaks. You can be concentrated yet easily substituted (one supplier by choice, many available), or diversified yet hard to substitute (several suppliers, all reliant on the same irreplaceable input). Each dimension is scored against documented goalposts; the four are deliberately unweighted — all count equally.",
              }} /></span></div>
              <div className="kpi"><span className="kpi-v mono">{sel.buffer}</span><span className="kpi-l">Buffer days</span></div>
              <div className="kpi"><span className="kpi-v mono">{sel.consequence.toFixed(2)}</span><span className="kpi-l" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>Consequence weight <Fx payload={{
                kicker: "Consequence · computed", title: sel.name + " — national consequence",
                text: "How much losing this import would hurt the nation — computed, not assigned. A blend of four publicly-grounded factors (each 0–1), so the weight moves only when the underlying reality does. It scales this import's pull on its sector score and on Absorb capacity.",
                formula: "Consequence  =  0.40·Essentiality + 0.25·Service reliance + 0.20·Immediacy + 0.15·Breadth",
                inputs: [
                  { k: "Essentiality", v: sel.cfac.ess.toFixed(2) + " — how vital the end-service is (does life/economy stop?)" },
                  { k: "Service reliance", v: sel.cfac.svc.toFixed(2) + " — share of that service riding on this input" },
                  { k: "Immediacy", v: sel.cfac.imm.toFixed(2) + " — continuous-flow (fails fast) vs slow-burn consumable" },
                  { k: "Breadth", v: sel.cfac.brd.toFixed(2) + " — sectors & population the loss would touch" },
                  { k: "Weighted result", v: sel.consequence.toFixed(2) + " / 1.00" },
                ],
                assumption: "The four factors are scored from public, documented facts — demand shares, which end-service the input feeds, and whether the need is continuous. The 0.40/0.25/0.20/0.15 weights are editable; essentiality dominates because an input feeding a non-essential service can't be a top national consequence however concentrated its supply. Distinct from DRI: DRI scores SUPPLIER fragility (can we get it?); consequence scores national importance (how bad if we can't?).",
              }} /></span></div>
              <div className="kpi"><span className="kpi-v" style={{ fontSize: 15, fontFamily: "var(--font-display)" }}>{RD.sectors.find((s) => s.id === sel.sector).name}</span><span className="kpi-l">Sector</span></div>
            </div>
            <h4 style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 12 }}>DRI breakdown — four dimensions <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--faint)", fontWeight: 400 }}>(higher = more fragile)</span></h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {dims.map(([k, l, def]) => {
                const v = sel.dims[k]; const b = RD.band(100 - v * 4).key;
                return (
                  <div key={k} className={`band-${b}`} style={{ display: "grid", gridTemplateColumns: "1fr 46px", alignItems: "baseline", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{l}</div>
                      <div className="bar-track" style={{ height: 7 }}><div className="bar-fill" style={{ width: (v / 25) * 100 + "%" }}></div></div>
                      <div className="helper" style={{ marginTop: 5, lineHeight: 1.45 }}>{def}</div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>{v}/25</span>
                  </div>
                );
              })}
            </div>
            {(() => {
              const c = LIVE.conflictFor(sel.source);
              if (!c.tracked) return null;
              return (
                <div className={`band-${c.band}`} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", border: "1px solid var(--line)", borderLeft: "3px solid var(--bc)", borderRadius: "var(--radius)", background: "var(--panel-2)" }}>
                  <span className="live-dot"></span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    <b>Live counterpart signal</b> — {c.events} battle / remote-violence events in {c.country} over the last 30 days. Real conflict in this source's territory is raising counterpart risk now, above the curated baseline.
                  </span>
                  <span style={{ marginLeft: "auto" }}><SourceTag src="acled" /></span>
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 8, margin: "16px 0 6px", flexWrap: "wrap" }}>
              {sel.hormuz && <span className="pill band-critical"><span className="sq"></span>Hormuz-routed</span>}
              {sel.dolphin && <span className="pill band-high"><span className="sq"></span>Dolphin gas</span>}
              <span className="pill"><span className="sq" style={{ background: "var(--accent)" }}></span>Source: {sel.source}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{sel.note}</p>
          </Panel>

          {sel.id === "chips" && (
            <Panel title="Cascade timeline — if cut off today" icon="cascade" label="90-DAY BUFFER">
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {RD.chipTimeline.map((c, i) => (
                  <div key={i} className={`band-${c.band}`} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: "var(--bc)", minWidth: 56 }}>Day {c.day}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{c.text}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Control Layer ------------------------------------------------ */
function ControlView() {
  LIVE.useLiveTick();
  const tabs = [["sovereign", "Sovereign vehicles"], ["foreign", "Foreign assets"], ["agreements", "Agreements"], ["workforce", "Workforce"], ["obligations", "Obligations"]];
  const [tab, setTab] = useState("sovereign");
  const totalAUM = RD.sovereign.reduce((s, v) => s + v.aum, 0);
  const totalDeploy = RD.sovereign.reduce((s, v) => s + v.deployable, 0);
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Control layer</div>
        <div className="view-sub">The levers the state can actually pull — sovereign capital, assets held abroad, agreements, treaty obligations and the workforce that runs critical infrastructure.</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        {[
          { l: "Sovereign AUM", v: "$" + (totalAUM / 1000).toFixed(1) + "T", s: "across 7 vehicles", b: "strong" },
          { l: "Rapidly deployable", v: "$" + totalDeploy + "B", s: "high-liquidity buffer", b: "good" },
          { l: "Agreements at risk", v: RD.agreements.filter((a) => a.urgent).length, s: "expiring or strained", b: "high" },
          { l: "High-risk skills", v: RD.workforce.filter((w) => w.risk === "HIGH").length, s: "of 6 categories", b: "high" },
        ].map((k, i) => (
          <div key={i} className={`band-${k.b}`} style={{ padding: "15px 16px", border: "1px solid var(--line)", borderLeft: "3px solid var(--bc)", borderRadius: "var(--radius-lg)", background: "var(--panel)" }}>
            <div className="label">{k.l}</div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 600, margin: "5px 0 2px" }}>{k.v}</div>
            <div className="helper">{k.s}</div>
          </div>
        ))}
      </div>
      <Panel title="Control inventory" icon="shield"
        right={<div style={{ marginLeft: "auto", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tabs.map(([k, l]) => <button key={k} className={`dir-btn ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
        </div>}>
        {tab === "sovereign" && (
          <table className="tbl"><thead><tr><th>Vehicle</th><th>AUM ($B)</th><th>Liquidity</th><th>Deployable</th></tr></thead>
            <tbody>{RD.sovereign.map((v) => (
              <tr key={v.name}><td style={{ fontWeight: 600 }}>{v.name}</td>
                <td><div className="bar-cell band-strong"><span className="mono">{v.aum}</span><div className="bar-track"><div className="bar-fill" style={{ width: (v.aum / 1000) * 100 + "%" }}></div></div></div></td>
                <td><span className="muted">{v.liquidity}</span></td>
                <td className="mono">${v.deployable}B</td></tr>
            ))}</tbody></table>
        )}
        {tab === "foreign" && (
          <table className="tbl"><thead><tr><th>Asset</th><th>Country</th><th>Host risk</th><th>Effective reduction</th></tr></thead>
            <tbody>{RD.foreignAssets.map((v) => {
              const b = v.host === "Low" ? "good" : v.host === "Medium" ? "moderate" : "high";
              return <tr key={v.name}><td style={{ fontWeight: 600 }}>{v.name}</td><td className="muted">{v.country}</td>
                <td><span className={`tag-band band-${b}`}><span></span>{v.host}</span></td><td className="mono">{v.eff.toFixed(2)}×</td></tr>;
            })}</tbody></table>
        )}
        {tab === "agreements" && (
          <React.Fragment>
          <table className="tbl"><thead><tr><th>Agreement</th><th>Partner</th><th>Expiry</th><th>Status</th><th>Partner conflict · ACLED</th></tr></thead>
            <tbody>{RD.agreements.map((v) => {
              const c = LIVE.conflictFor(v.partner);
              return (
              <tr key={v.name}><td style={{ fontWeight: 600 }}>{v.name}</td><td className="muted">{v.partner}</td>
                <td><span className="mono" style={{ color: v.urgent ? "var(--high)" : "var(--ink)" }}>{v.expiry}{v.urgent && " ⚠"}</span></td>
                <td><span className={`tag-band band-${v.status === "Active" ? "good" : "high"}`}><span></span>{v.status}</span></td>
                <td>{!c.live
                  ? <span className="helper" title="ACLED not connected — set credentials to make partner conflict risk live.">sim</span>
                  : c.tracked
                    ? <span className={`tag-band band-${c.band}`} title={`${c.events} battle / remote-violence events in ${c.country} over the last 30 days (ACLED).`}><span></span>{c.events} events / 30d</span>
                    : <span className="tag-band band-good" title="No tracked conflict events in this partner's territory (ACLED)."><span></span>calm</span>}</td></tr>
              );
            })}</tbody></table>
          <div className="helper" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            Partner conflict risk is live from ACLED battle &amp; remote-violence events in each partner's territory over the last 30 days. <SourceTag src="acled" />
          </div>
          </React.Fragment>
        )}
        {tab === "workforce" && (
          <table className="tbl"><thead><tr><th>Skill class</th><th>Origin concentration</th><th>Risk</th></tr></thead>
            <tbody>{RD.workforce.map((v) => {
              const b = v.risk === "HIGH" ? "high" : v.risk === "MEDIUM" ? "moderate" : "good";
              return <tr key={v.skill}><td style={{ fontWeight: 600 }}>{v.skill}</td><td className="muted mono" style={{ fontSize: 11.5 }}>{v.origin}</td>
                <td><span className={`tag-band band-${b}`}><span></span>{v.risk}</span></td></tr>;
            })}</tbody></table>
        )}
        {tab === "obligations" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {RD.obligations.map((o, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "13px 15px", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--panel-2)" }}>
                <Icon name="shield" size={16} style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }} />
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{o}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- Operations --------------------------------------------------- */
function OperationsView() {
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Operationalize</div>
        <div className="view-sub">Where the national picture meets the ground — the national strategic water reserve, the health supply snapshot, how the model has performed against real events, and what's left to build.</div>
      </div>
      <div className="grid cols-2" style={{ gridTemplateColumns: "1.2fr 1fr", marginBottom: 16, alignItems: "start" }}>
        <Panel title="National strategic water reserve" icon="ops" label="EMERGENCY ESSENTIAL-SUPPLY · DAYS">
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 52, fontWeight: 600, lineHeight: 0.9, letterSpacing: "-0.02em" }}>{RD.water.days}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>days of essential supply</span>
              <span className="helper" style={{ fontSize: 11 }}>essential supply at emergency rate · a deep safety net</span>
            </span>
            <span style={{ marginLeft: "auto" }}>
              <Fx payload={{
                kicker: "National strategic water reserve", title: "How the 90-day reserve is sourced",
                text: RD.water.note,
                inputs: [
                  { k: "Strategic reserve", v: RD.water.days + " days · essential supply" },
                  { k: "Public sources", v: (<span style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px 12px" }}>{RD.water.evidence.map((e, i) => (<a key={i} className="drawer-link" href={e.url} target="_blank" rel="noopener noreferrer">{e.label} ↗</a>))}</span>) },
                ],
                assumption: "The 90-day figure is the emergency essential-supply duration — a deep safety net behind normal operations. Day-to-day demand is met from operational storage, with the strategic reserve held in reserve behind it.",
              }} />
            </span>
          </div>
          <div className="bar-track" style={{ height: 10 }}>
            <div className="bar-fill band-good" style={{ width: "100%", background: "var(--good)" }}></div>
          </div>
          <div className="note-card" style={{ marginTop: 16 }}>
            The UAE operates <b>90-day strategic desalinated-water reserves</b> — Abu Dhabi's <b>Liwa Strategic Water Reserve</b>
            {" "}(the world's largest desalinated-water aquifer store) and Dubai's <b>DEWA Aquifer Storage &amp; Recovery</b> (the
            world's largest potable ASR). These cover essential supply for up to 90 days, with day-to-day demand met from
            operational storage — a deep safety net held behind normal operations.
          </div>
        </Panel>
        <Panel title="Health supply snapshot" icon="ops">
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {[["APIs", RD.health.apis, "high"], ["Vaccines", RD.health.vaccines, "good"], ["Medical devices", RD.health.devices, "high"], ["Hospital capacity", RD.health.beds, "good"]].map(([k, v, b]) => (
              <div key={k} className={`band-${b}`} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bc)" }}></span>
                <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 120 }}>{k}</span>
                <span className="helper" style={{ flex: 1 }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="note-card assume" style={{ marginTop: 14 }}>{RD.health.threshold}</div>
        </Panel>
      </div>
      <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        <Panel title="Model validation" icon="check" label="PREDICTED vs. ACTUAL"
          right={<Fx payload={{
            kicker: "Validation", title: "How accuracy is judged",
            text: "Each past event compares the model's predicted score change to what was later observed. Closeness sets a qualitative accuracy grade.",
            formula: "Accuracy  =  grade(| predicted − actual |)",
            inputs: RD.validation.map((v) => ({ k: v.event, v: v.actual === null ? "predicted " + v.predicted + ", awaiting outcome" : "pred " + v.predicted + " · actual " + v.actual })),
            assumption: "Grades (HIGH / MODERATE / UNTESTED) are coarse on purpose — the model is illustrative and not yet fully calibrated.",
          }} />}>
          <table className="tbl"><thead><tr><th>Event</th><th>Predicted</th><th>Actual</th><th>Accuracy</th></tr></thead>
            <tbody>{RD.validation.map((v) => {
              const b = v.accuracy === "HIGH" ? "good" : v.accuracy === "MODERATE" ? "moderate" : "high";
              return <tr key={v.event}><td style={{ fontWeight: 600 }}>{v.event}</td><td className="mono">{v.predicted}</td>
                <td className="mono">{v.actual === null ? "—" : v.actual}</td>
                <td><span className={`tag-band band-${b}`}><span></span>{v.accuracy}</span></td></tr>;
            })}</tbody></table>
        </Panel>
        <Panel title="Build roadmap" icon="ops" label="SYSTEM MATURITY">
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {RD.roadmap.map((r) => {
              const b = r.pct === 100 ? "good" : r.pct >= 70 ? "moderate" : "high";
              return (
                <div key={r.part} className={`band-${b}`} style={{ display: "grid", gridTemplateColumns: "170px 1fr 40px", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12 }}>{r.part}</span>
                  <div className="bar-track" style={{ height: 6 }}><div className="bar-fill" style={{ width: r.pct + "%" }}></div></div>
                  <span className="mono" style={{ fontSize: 11.5, textAlign: "right" }}>{r.pct}%</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Methodology (explainability home) --------------------------- */
function MethodologyView() {
  const qs = [
    { n: "1", t: "Why two scores, not one?", d: "They are a baseline and its live deviation, not two rival readings. Structural Resilience is the slow-moving CEILING — your fundamentals. Live Stress is that ceiling minus today's active load, and tracks toward it: live strength climbs back to what your fundamentals allow as conditions settle. The gap between them tells you whether a low number is a deep structural problem or a passing storm. Structural Resilience itself breaks into three capacities — Absorb, Recover and Adapt — measured against your most-exposed sector." },
    { n: "2", t: "What is the DRI — and how do its four dimensions differ?", d: "The Dependency Risk Index scores a single import on four equal 0–25 dimensions, summing to a 0–100 fragility score (higher = more fragile). — Source concentration: how few suppliers provide it today (single-basket risk). — Substitution difficulty: how hard it is to switch if that source is cut. — Route exposure: dependence on a contested maritime chokepoint. — Counterpart risk: the chance the supplier becomes unwilling or unable to sell. Concentration and substitution difficulty are the pair most often confused: concentration is how many baskets your eggs are in now; substitution difficulty is whether you can get new baskets if one breaks — you can be concentrated yet easily substituted, or diversified yet hard to substitute." },
    { n: "3", t: "What does non-compensatory mean?", d: "Strong sectors cannot average away a more-exposed one. Structural Resilience anchors to the most-exposed sector — 60% most-exposed + 40% overall capacity — so one concentrated dependency stays visible behind healthy ones, while still reading the full picture." },
    { n: "4", t: "How is consequence weighting calculated?", d: "It is computed, not assigned. Each import's 0–1 national-consequence weight is a blend of four publicly-grounded factors — Essentiality (how vital the end-service is), Service reliance (how much of that service rides on this input), Immediacy (continuous-flow vs slow-burn consumable) and Breadth (sectors and population touched) — combined as 0.40·ess + 0.25·svc + 0.20·imm + 0.15·brd. Piped gas scores 1.00 (powers electricity and desalination, continuous, universal); gold doré ~0.23 (a refining margin, narrow). The weight then scales each dependency's pull on its sector score and on Absorb capacity, so it moves only when the underlying facts move. Open any import on the Dependencies view to see its four factors. Distinct from the DRI, which scores supplier fragility, not national importance." },
    { n: "5", t: "Where do the numbers come from?", d: "Three tiers: live public feeds (ship transits, news, weather, markets, sanctions, conflict), hand-curated open-source datasets, and explicitly stated assumptions. Every figure carries a source tag identifying its tier, and the status bar shows whether each live feed is currently connected (● Live) or temporarily simulated (○ Sim)." },
    { n: "6", t: "Does the system recommend actions?", d: "Yes — the Response & pre-mortem view closes the loop from sense → simulate → ACT. It holds a ranked queue of national responses. Each one is a concrete implementation brief — what gets built, where, with which technology and partners — anchored to a real precedent project and its actual cost and timeline. The one decision per response is how far to go: three scope tiers, from quick stopgap to full build. LIVE tiers improve today's score; CEILING tiers raise the structural ceiling. Priority blends impact, urgency, speed and value for money." },
    { n: "7", t: "What is a pre-mortem?", d: "A post-mortem asks why something failed after the fact; a pre-mortem flips the timeline — it assumes a response has already failed and works backwards to explain how, surfacing weak points before you commit. Every recommendation carries one: the named ways it could fail, each with a likelihood, the leading indicator to watch, and a mitigation. A recommendation is only as trustworthy as its failure modes." },
    { n: "8", t: "What happens when a live feed is unreachable?", d: "The system never quietly substitutes invented data for measured data. Each feed is marked ● Live in the status bar while connected; if a source goes down, that one signal falls back to a clearly-marked simulation (○ Sim) anchored to its last known values — and the driver attribution on the Overview keeps showing exactly which inputs are measured and which are modelled." },
  ];
  const STEPS = [
    { t: "Start with what the country must import", d: "We track 17 supplies the UAE cannot function without — natural gas, desalination membranes, medicines, advanced chips, dollar-clearing access and more.", where: "Dependencies" },
    { t: "Score how shaky each supply is", d: "Each import gets a fragility score built from four things: how few suppliers it has, how hard it would be to switch, how exposed its shipping route is, and how reliable the seller is.", where: "Dependencies → DRI" },
    { t: "Weigh how much each one matters", d: "Each import also gets an importance weight — how badly the country would feel its loss, based on how essential it is and how many people and sectors rely on it.", where: "Dependencies → Consequence" },
    { t: "Roll the imports up into 7 sectors", d: "Imports group into sectors — energy, water, health, food, defence, logistics, finance. A sector's strength is its imports' fragility, weighted by how much each one matters.", where: "Overview → Sector resilience" },
    { t: "Set the fair-weather national strength", d: "The single weakest sector, combined with the country's ability to absorb shocks, recover and adapt, sets Structural Resilience — strength on a calm day.", where: "Overview → Structural Resilience" },
    { t: "Subtract today's real-world pressure", d: "Live events — shipping disruptions, conflict, market stress — subtract from that baseline to give Live Stress, the strength right now. The gap between the two is exactly where the system recommends action.", where: "Overview → Live Stress · Response" },
  ];
  const GLOSS = [
    ["Structural Resilience", "Fair-weather strength — how well the country copes on a calm day. Slow to change."],
    ["Live Stress", "Strength right now, after today's events. Moves day to day."],
    ["The gap", "Today's pressure — how far live strength has dropped below fair-weather strength."],
    ["DRI", "Dependency Risk Index — a 0–100 fragility score for one import. Higher means shakier supply."],
    ["Consequence", "How badly losing an import would hurt the nation, scored 0 to 1."],
    ["Buffer", "How many days the country can keep going on existing stock if a supply stops."],
    ["Absorb · Recover · Adapt", "The three ways a country copes: take a hit, bounce back, and cut future risk."],
    ["Non-compensatory", "A strong sector can't hide a weak one — the weakest link always shows in the score."],
    ["Cascade", "A timeline of what would break first if a shock hit, as buffers run down."],
    ["Pre-mortem", "Imagining a plan has already failed and asking why — to catch weak points before committing."],
    ["Live / Sim", "Live = a real data feed is connected. Sim = that feed is down, showing a last-known stand-in."],
  ];
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">How this works</div>
        <div className="view-sub">The whole model, laid bare. Nothing here is a black box.</div>
      </div>

      <div className="intro-card" style={{ maxWidth: "none", marginBottom: 22 }}>
        <div className="intro-kicker">Read this first</div>
        <div className="intro-title" style={{ fontSize: 22 }}>An illustrative model — transparent by design</div>
        <p className="intro-lead">This is a worked example of how a country's supply-chain resilience could be measured. It runs on live, publicly-available data plus curated open sources, combined through logic and assumptions that are all written down. Think of it as decision-support — not an official or classified government assessment — where every number can be traced back to where it came from.</p>
      </div>

      <div style={{ marginBottom: 22 }}>
        <Panel title="How a national score is built" icon="layers" label="START HERE · PLAIN ENGLISH">
          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 900 }}>
            Every number on this platform is built the same way, from the ground up. Here is the whole chain in six plain steps.
          </p>
          <div>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 13, flex: "0 0 auto" }}>{i + 1}</span>
                  {i < STEPS.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--line-2)", margin: "4px 0" }}></span>}
                </div>
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 3 }}>{s.t}</div>
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 5 }}>{s.d}</div>
                  <span className="helper" style={{ fontSize: 11 }}>In the app: <b style={{ color: "var(--accent)" }}>{s.where}</b></span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ marginBottom: 22 }}>
        <Panel title="What the words mean" icon="book" label="PLAIN-LANGUAGE GLOSSARY">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 30px" }}>
            {GLOSS.map(([term, def], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "148px 1fr", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>{term}</span>
                <span className="helper" style={{ lineHeight: 1.5 }}>{def}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ marginBottom: 22 }}>
        <Panel title="Methodology lineage — what this model is built on" icon="book" label="NO SINGLE GLOBAL STANDARD">
          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "0 0 20px", maxWidth: 980 }}>
            <span style={{ fontStyle: "italic", color: "var(--faint)" }}>Not essential reading — this section is here to show the model's academic roots.</span> There is <b>no single binding international standard</b> for measuring national resilience — the field is a
            fragmented ecosystem of competing frameworks, and published reviews have catalogued <b>18+ distinct measures</b>. So this model can't borrow authority by conforming to one
            standard. Instead its design deliberately follows the logic of the recognised frameworks below — and where it
            invents (the anchored 0–100 scale, the band thresholds) it says so.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginBottom: 22 }}>
            {[
              ["Institutional guidance", [
                ["OECD", "Resilience systems analysis (2014); review of national risk assessments across 20 countries (2017)"],
                ["NIST", "Inventory of community-resilience indicators & assessment frameworks"],
                ["UK Cabinet Office", "National Risk Register & Resilience Action Plan — dynamic risk assessment"],
                ["ISO 22316 / 22301", "Organizational resilience & business continuity (adjacent, org-level — not a national standard)"],
              ]],
              ["National-resilience indices", [
                ["State Resilience Index", "Fund for Peace — capacities & capabilities across 154 countries"],
                ["MVLRI", "Multidimensional Vulnerability & Lack of Resilience — 26 indicators, econ/env/social"],
                ["Index of Future Readiness", "2025 — splits resilience (“bounce back”) from adaptive capacity (“bounce forward”)"],
              ]],
              ["Domain models", [
                ["FAO RIMA", "Resilience Index Measurement & Analysis — food-security resilience"],
                ["Resilient Economies Index", "2025 — trade resilience for food/water/energy; import dependence weighted by partner diversity, HDI-adjusted"],
              ]],
            ].map(([group, items]) => (
              <div key={group}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>{group}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {items.map(([n, d]) => (
                    <div key={n}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{n}</div>
                      <div className="helper" style={{ lineHeight: 1.45 }}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "15px 17px", background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)", borderRadius: "var(--radius)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>Where this model aligns with the field</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 26px" }}>
              {[
                ["Resilience vs. adaptive capacity", "→ our Structural ceiling vs. Live deviation (per the IFR split)"],
                ["Import dependence weighted by partner diversity", "→ our DRI (source concentration + substitution difficulty) (per the Resilient Economies Index)"],
                ["Non-compensatory aggregation", "→ weakest-pillar anchoring, so one critical sector stays visible"],
                ["Buffers-and-flows propagation", "→ the cascade engine: each import has a published buffer in days"],
              ].map(([a, b]) => (
                <div key={a} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                  <b style={{ fontWeight: 600 }}>{a}</b> <span className="muted">{b}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="helper" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            Sources: OECD (2014, 2017) · NIST · UK Cabinet Office (2025) · Fund for Peace SRI · FAO RIMA · Global Center on Adaptation, Resilient Economies Index (2025) · Jawad &amp; Sala-i-Martin, Index of Future Readiness (2025). Public frameworks named for lineage; this model is an independent illustrative synthesis, not an implementation of any one of them.
          </div>
        </Panel>
      </div>

      <div className="grid cols-2" style={{ gridTemplateColumns: "1.3fr 1fr", alignItems: "start" }}>
        <div>
          {qs.map((q) => (
            <div className="method-q" key={q.n}>
              <h3><span className="badge-n">{q.n}</span>{q.t}</h3>
              <p>{q.d}</p>
            </div>
          ))}
        </div>
        <div className="stack">
          <Panel title="Resilience bands" icon="gauge" label="0–100 SCALE">
            {RD.BANDS.map((b) => (
              <div key={b.key} className={`band-${b.key}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--bc)" }}></span>
                <span style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: ".06em", color: "var(--bc)", minWidth: 78 }}>{b.label}</span>
                <span className="mono helper" style={{ minWidth: 48 }}>{b.min}–{b.max}</span>
                <span className="helper" style={{ flex: 1 }}>{b.desc}</span>
              </div>
            ))}
          </Panel>
          <Panel title="Data sources & freshness" icon="layers" label="LIVE / SIMULATED">
            {Object.entries(RD.sources).map(([k, s]) => {
              const isLive = s.kind === "live";
              const mode = s.mode || "sim";
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                  <SourceTag src={k} />
                  <span className="helper" style={{ flex: 1 }}>{s.full}{s.url ? <> · <a className="drawer-link" href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>source ↗</a></> : null}</span>
                  {isLive && (
                    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--line)", color: mode === "live" ? "var(--good)" : "var(--muted)", background: mode === "live" ? "color-mix(in srgb,var(--good) 14%,transparent)" : "transparent" }}>
                      {mode === "live" ? "● Live" : "○ Sim"}
                    </span>
                  )}
                  <span className="mono helper">{s.cadence}</span>
                </div>
              );
            })}
          </Panel>
          <Panel title="Assumptions ledger" icon="book" label="EDITABLE">
            {[
              "Structural Resilience = 0.60 × most-exposed sector + 0.40 × capacity (non-compensatory anchor)",
              "Capacity = equal-weight Absorb (buffers vs 90-day benchmark) · Recover (sovereign firepower + substitutability) · Adapt (sectors with a structural plan)",
              "Live Stress = Structural ceiling − today's active load (tracks toward it)",
              "Structural axis goalpost: 100 = autarky (unreachable), ~72 = realistic-frontier marker — a display anchor only, feeds no score",
              "Sovereign buffer sub-score from verified SWF AUM (~$2.0T)",
              "Chokepoint baselines = each strait's own 12-month busy-period norm (90th-percentile daily transits)",
              "DRI dimensions are unweighted (equal 0–25)",
              "Response priority = 0.38 impact + 0.30 urgency + 0.18 speed + 0.14 efficiency",
              "Response effects are independent & additive: Live′ = min(Ceiling′, live + staged points)",
            ].map((a, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none", fontSize: 12.5 }}>
                <span className="src assumption" style={{ flex: "0 0 auto" }}><span className="d"></span>A{i + 1}</span>
                <span>{a}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MapView, DependenciesView, ControlView, OperationsView, MethodologyView });
