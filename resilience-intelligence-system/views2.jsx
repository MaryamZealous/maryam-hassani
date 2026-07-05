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
  "United States of America": { label: "United States", who: "RO · ERD · turbines · water chems · GNSS · USD", pre: ["ro","erd","turbines","waterchem","gps","usdclearing"], cons: 0.88, lng: -98, lat: 39, tip: "Leading source of reverse-osmosis membranes and energy-recovery devices within a concentrated US/Japan/Korea supplier set — the spine of UAE desalination — plus GE gas-turbine hot-section parts, specialty desalination chemicals (antiscalants), precision-timing modules and correspondent-bank USD clearing." },
  "Taiwan": { label: "Taiwan", who: "Leading-edge chips", pre: ["chips"], cons: 0.72, lng: 121, lat: 23.6, tip: "Fabrication of advanced silicon for EDGE guided-systems concentrates here, but the binding risk is US export-control licensing, not a Taiwan supply halt — a channel that eased in late 2025." },
  "India": { label: "India", who: "APIs · devices · labour", pre: ["api"], cons: 0.78, lng: 79, lat: 22.5, dy: 17, tip: "~65% of active pharma ingredients (est.) and the largest share of critical-infrastructure workers." },
  "Kazakhstan": { label: "Kazakhstan", who: "Uranium — LEU fuel chain", pre: ["leu"], cons: 0.72, lng: 67, lat: 48, tip: "Uranium feedstock for Barakah's fuel chain — conversion, enrichment and fabrication (KEPCO NF, Korea) happen downstream. A 540-day buffer with no near-term alternative chain." },
  "Qatar": { label: "Qatar", who: "Piped gas (Dolphin)", pre: ["gas"], cons: 1.00, lng: 51.2, lat: 25.3, dx: -10, dy: -10, anchor: "end", tip: "25% of gas for power and water via the Dolphin pipeline — piped, not Hormuz-routed. Contract runs to 2032. The exposure is counterpart + price-basis: losing Dolphin reprices the marginal molecule from a fixed ~$1.50/MMBtu contract to oil-linked LNG (~12.5% of Brent, ≈8×)." },
  "Canada": { label: "Canada", who: "Potash · wheat", pre: ["potash","wheat"], cons: 0.55, lng: -109, lat: 57, tip: "Fertiliser and grain feedstock — diversified, lower-risk food inputs." },
  "Russia": { label: "Russia", who: "Potash · wheat", pre: ["potash","wheat"], cons: 0.60, lng: 62, lat: 61, tip: "Alternate potash and wheat supply; counterpart risk elevated by sanctions exposure." },
  "China": { label: "China", who: "Solar PV · batteries · devices", pre: ["solarpv","libattery","devices"], cons: 0.70, lng: 103, lat: 35, tip: "Concentrates the clean-energy transition inputs — ~80%+ of solar polysilicon/modules and the bulk of lithium-ion cell supply — plus 40% of medical devices (est.) on a thin 45-day buffer. China as the processing chokepoint, with rising counterpart risk." },
  "Australia": { label: "Australia", who: "Wheat", pre: ["wheat"], cons: 0.60, lng: 134, lat: -25, tip: "Diversified grain supply that deepens national food reserves." },
  "Chile": { label: "Chile", who: "Copper (cathode / rod)", pre: ["copper"], cons: 0.60, lng: -71, lat: -33, tip: "The UAE mines no copper; refined cathode & rod — from Chile, Zambia and the global market — feed Ducab's cabling and the grid build-out. Material World's bottleneck metal of electrification: diversified today, structurally tight over the decade ahead." },
  "Japan": { label: "Japan", who: "Turbines (Mitsubishi) · RO membranes", pre: ["turbines","ro"], cons: 0.82, lng: 138, lat: 37.5, tip: "Mitsubishi gas-turbine hot-section parts plus Toray / Nitto reverse-osmosis membranes — Japan sits inside both the turbine-OEM and the desalination-membrane supplier sets, two single-digit-supplier fields for the power-and-water fleet." },
  "Germany": { label: "Germany", who: "Turbines (Siemens) · water chemicals", pre: ["turbines","waterchem"], cons: 0.82, lng: 10.4, lat: 51.2, tip: "Siemens gas-turbine hot-section components and BASF-class specialty water-treatment chemicals (antiscalants) — part of the single-digit qualified-OEM field the generation and desalination fleet runs on." },
  "United Arab Emirates": { label: "UAE", hub: true, lng: 54.4, lat: 24.5, who: "Jebel Ali · Barakah · Taweelah", tip: "The hub. ~60% of imports land at Jebel Ali (est.), then re-export across the region — dependency runs both ways." },
};
const PRE_BY_ID = Object.fromEntries((window.RD ? RD.precursors : []).map((p) => [p.id, p]));
const consOf = (s) => (s.pre && s.pre.length) ? Math.max(...s.pre.map((id) => (PRE_BY_ID[id] ? PRE_BY_ID[id].consequence : 0))) : (s.cons || 0);
const FLOWS = [
  { from: "United States of America", via: "suez" }, { from: "Taiwan", via: null },
  { from: "India", via: "hormuz" }, { from: "Kazakhstan", via: null }, { from: "Qatar", via: null },
  { from: "Canada", via: "suez" }, { from: "Russia", via: null }, { from: "China", via: "hormuz" },
  { from: "Australia", via: null }, { from: "Chile", via: null },
  { from: "Japan", via: null }, { from: "Germany", via: "suez" },
];
const OUTFLOWS = [
  { label: "Crude → East Asia (via Hormuz)", tag: "Crude → Asia", lp: [129, 14], to: [114, 27], via: "hormuz", type: "export", w: 3.8, tip: "The bulk of energy exports still transit the Strait of Hormuz to East-Asian buyers — the UAE's largest, and most exposed, outbound flow." },
  { label: "Fujairah bypass → Asia", tag: "Fujairah bypass", lp: [94, -12], from: [56.33, 25.17], to: [90, 8], via: null, type: "export", w: 3.0, tip: "Fujairah's east-coast terminal ships crude straight to Asia WITHOUT entering the Strait of Hormuz — the UAE's strategic Hormuz bypass." },
  { label: "Ammonia / urea → world markets", tag: "Ammonia / urea →", lp: [70, -3], from: [52.73, 24.11], to: [82, 16], via: "hormuz", type: "export", w: 2.6, tip: "Fertiglobe (ADNOC ~87%) ships urea & ammonia from Ruwais/Fertil to ~41 countries — the world's largest seaborne nitrogen exporter. The UAE's domestic gas leaves as fertiliser, not as a food-security input. Note the irony: this export sails OUT through Hormuz, so the fertiliser strength shares the same chokepoint exposure as the imports." },
  { label: "Energy → Europe", tag: "Energy → Europe", lp: [-16, 41], to: [11, 45], via: "suez", type: "transit", w: 2.2, tip: "Crude and product routed through the Red Sea and Suez to European markets." },
  { label: "Re-export → East Africa", tag: "Re-export → E. Africa", lp: [42, -14], to: [40, 5], via: "redsea", type: "transit", w: 1.6, tip: "Jebel Ali re-export hub supplies East-African markets — the UAE as regional entrepôt." },
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
  jebelali: "Imports ≈60% of national goods (est.) · regional re-export hub",
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
        const s = GEO_SRC[fl.from]; const cons = consOf(s); const d = routeS(P(s.lng, s.lat), hubS, fl.via, 0.16); const w = 0.8 + cons * 3;
        return (
          <g key={fl.from} className="flow-grp" onMouseEnter={() => onTip({ b: "Import → UAE", text: s.label + " — " + s.tip, who: s.who + " · import weight " + cons.toFixed(2) })} onMouseLeave={() => onTip(null)}>
            <path className="flow-arc import" d={d} markerEnd="url(#mk-import)" strokeWidth={w} />
            <path className="flow-pulse import casc-pulse" d={d} strokeWidth={w} />
          </g>
        );
      })}
      {layers.exports && OUTFLOWS.map((fl, i) => {
        const origin = fl.from ? P(fl.from[0], fl.from[1]) : hubS;
        const d = routeS(origin, P(fl.to[0], fl.to[1]), fl.via, 0.16); const w = fl.w || 2.4;
        return (
          <g key={i} className="flow-grp" onMouseEnter={() => onTip({ b: fl.type === "export" ? "Export ← UAE" : "Transit · hub", text: fl.label + " — " + fl.tip, who: "outbound weight " + w.toFixed(1) })} onMouseLeave={() => onTip(null)}>
            <path className={"flow-arc " + fl.type} d={d} markerEnd={`url(#mk-${fl.type})`} strokeWidth={w} />
            <path className={"flow-pulse casc-pulse " + fl.type} d={d} strokeWidth={w} />
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
        <div className="view-sub">Where the UAE sits in the world's supply web. Each line is a dependency — <b>blue flows in</b> (imports, line thickness ~ relative import weight), <b>gold &amp; green flow out</b> (export &amp; transit) — because the UAE is a hub, not an endpoint. Hover anything for why it matters, click for the full logic, and <b>zoom into the UAE to reveal its strategic assets and ports</b>.</div>
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
            {[["Why a hub, not a list", "~60% of imports (est.) land at Jebel Ali and re-export across the region — so dependency runs both ways, inbound and outbound."],
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
  const [selId, setSelId] = useState((initial && initial.import) || (list[0] ? list[0].id : "ro"));
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
        <div className="view-sub">The {RD.precursors.length} critical imports the whole model rests on. Each carries a Dependency Risk Index (DRI) — a route-weighted blend of its supply dimensions <i>plus</i> a buffer / reaction-time fragility — and a national-consequence weight. The breakdown below shows both parts, all scored so that <b>higher always means more fragile</b>.</div>
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
                    <span className="helper">{p.source} · {p.buffer}-day buffer{p.bufferProv ? <span className="bprov" title={p.bufferProv.n}> · {p.bufferProv.t === "stated" ? "stated" : "est."}</span> : null}</span>
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
                text: "DRI scores how fragile a single import is, from two parts. STRUCTURAL fragility blends the four supply dimensions — Route carries the largest weight, because a contested-chokepoint shipment is a higher-severity risk than the other axes. BUFFER fragility adds the missing half: the buffer is your reaction time, so a thin buffer is itself a fragility (Dolphin's 30 days and LEU's 540 are not the same risk even with similar dimensions).",
                formula: "DRI = 0.67 × structural fragility + 0.33 × buffer fragility — every input on the same 0–100 scale.  Structural = 0.34·Route + 0.22·Concentration + 0.22·Substitution + 0.22·Counterpart.  Buffer = (1 − min(buffer / 180d, 1)) × 100",
                inputs: [
                  ...dims.map(([k, l, def]) => ({ k: l + (k === "route" ? " (weight 0.34)" : " (weight 0.22)"), v: sel.dims[k] + " / 100 — " + def })),
                  { k: "Structural fragility", v: sel.driStruct + " / 100 — route-weighted blend of the four dimensions" },
                  { k: "Buffer fragility", v: sel.driBuffer + " / 100 — from a " + sel.buffer + "-day buffer vs a 180-day reaction horizon" },
                  { k: "DRI", v: "0.67 × " + sel.driStruct + "  +  0.33 × " + sel.driBuffer + "  =  " + sel.dri + " / 100" },
                ],
                assumption: "All five inputs share the same 0–100 fragility scale — the weights (0.34 route / 0.22 each, then 0.67/0.33 structural vs buffer) set how much each counts. Buffer fragility reaches zero past ~180 days of cover, where stock stops being the binding constraint. The route weight and the 180-day horizon are tunable assumptions.",
                links: [
                  { label: "How DRI rolls up into its sector score · Overview", view: "overview" },
                  { label: "Weights & horizons · Assumptions ledger", view: "methodology" },
                ],
              }} /></span></div>
              <div className="kpi"><span className="kpi-v mono">{sel.buffer}</span><span className="kpi-l">Buffer days{sel.bufferProv ? " · " + (sel.bufferProv.t === "stated" ? "stated" : "est.") : ""}</span></div>
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
                links: [
                  { label: "Where this weight is used · Overview sector grid", view: "overview" },
                  { label: "Responses that lower this risk · Response & pre-mortem", view: "act" },
                ],
              }} /></span></div>
              <div className="kpi"><span className="kpi-v" style={{ fontSize: 15, fontFamily: "var(--font-display)" }}>{RD.sectors.find((s) => s.id === sel.sector).name}</span><span className="kpi-l">Sector</span></div>
            </div>
            <h4 style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--faint)", marginBottom: 12 }}>DRI breakdown — structural dimensions + buffer <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--faint)", fontWeight: 400 }}>(higher = more fragile)</span></h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {dims.map(([k, l, def]) => {
                const v = sel.dims[k]; const b = RD.band(100 - v).key;
                return (
                  <div key={k} className={`band-${b}`} style={{ display: "grid", gridTemplateColumns: "1fr 46px", alignItems: "baseline", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{l}{k === "route" ? <span className="helper" style={{ fontWeight: 400 }}> · weight 0.34 (highest)</span> : null}</div>
                      <div className="bar-track" style={{ height: 7 }}><div className="bar-fill" style={{ width: v + "%" }}></div></div>
                      <div className="helper" style={{ marginTop: 5, lineHeight: 1.45 }}>{def}</div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>{v}/100</span>
                  </div>
                );
              })}
              {(() => {
                const bf = sel.driBuffer; const b = RD.band(100 - bf).key;
                return (
                  <div className={`band-${b}`} style={{ display: "grid", gridTemplateColumns: "1fr 46px", alignItems: "baseline", gap: 12, marginTop: 4, paddingTop: 13, borderTop: "1px solid var(--line)" }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Buffer fragility <span className="helper" style={{ fontWeight: 400 }}>· {sel.buffer}-day reaction window · weight 0.33 of DRI</span></div>
                      <div className="bar-track" style={{ height: 7 }}><div className="bar-fill" style={{ width: bf + "%" }}></div></div>
                      <div className="helper" style={{ marginTop: 5, lineHeight: 1.45 }}>{
                        bf <= 0
                          ? "The " + sel.buffer + "-day buffer exceeds the ~180-day reaction horizon, so it adds no fragility — there is ample time to re-source before stock runs out."
                          : bf >= 70
                          ? "A thin " + sel.buffer + "-day buffer leaves little time to react, so it is a major fragility in its own right (" + Math.round(bf) + "/100)."
                          : "The " + sel.buffer + "-day buffer gives partial reaction time — a moderate fragility (" + Math.round(bf) + "/100), easing toward zero as cover approaches ~180 days."
                      }</div>
                    </div>
                    <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>{Math.round(bf)}</span>
                  </div>
                );
              })()}
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
            {(() => {
              const pn = LIVE.partnerNewsFor(sel.source);
              if (!pn.tracked) return null;
              const pct = Math.round((pn.score || 0) * 100);
              return (
                <div className={`band-${pn.band}`} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", border: "1px solid var(--line)", borderLeft: "3px solid var(--bc)", borderRadius: "var(--radius)", background: "var(--panel-2)" }}>
                  <span className="live-dot"></span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    <b>Live partner-supply signal</b> — {pn.live ? (pct > 5
                      ? "supply-disruption coverage on " + pn.partner.replace(/^./, (m) => m.toUpperCase()) + " is running " + pct + "% above normal, lifting counterpart risk above the curated baseline now."
                      : "coverage on " + pn.partner.replace(/^./, (m) => m.toUpperCase()) + " is at/below normal — no adverse pressure above the curated baseline right now.")
                      : "watched via the news monitor; the feed is connecting, so this falls back to the curated counterpart score."}
                  </span>
                  <span style={{ marginLeft: "auto" }}><SourceTag src="gdelt" /></span>
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 8, margin: "16px 0 6px", flexWrap: "wrap" }}>
              {sel.hormuz && <span className="pill band-critical"><span className="sq"></span>Hormuz-routed</span>}
              {sel.dolphin && <span className="pill band-high"><span className="sq"></span>Dolphin gas</span>}
              <span className="pill"><span className="sq" style={{ background: "var(--accent)" }}></span>Source: {sel.source}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>{sel.note}</p>
            {sel.bufferProv && <p className="helper" style={{ marginTop: 6 }}><b style={{ color: "var(--muted)" }}>Buffer ({sel.buffer}d) — {sel.bufferProv.t === "stated" ? "stated policy" : "analyst estimate"}:</b> {sel.bufferProv.n}</p>}
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
        <div className="view-sub">The levers the state can actually pull — sovereign capital, assets held abroad, agreements, treaty obligations, the workforce that runs critical infrastructure, and the national reserves held behind essential supply.</div>
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
              <tr key={v.name}><td style={{ fontWeight: 600 }}>{v.url
                ? <a href={v.url} target="_blank" rel="noopener" style={{ color: "var(--ink)", textDecoration: "none", borderBottom: "1px solid var(--line-2)" }} title={v.urlNote || ("Open the source for " + v.name + " (new tab)")}>{v.name} <span style={{ color: "var(--faint)", fontSize: 11 }}>↗</span></a>
                : v.name}</td><td className="muted">{v.partner}</td>
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
          <React.Fragment>
          <table className="tbl"><thead><tr><th>Skill class</th><th>Origin concentration</th><th>Risk</th></tr></thead>
            <tbody>{RD.workforce.map((v) => {
              const b = v.risk === "HIGH" ? "high" : v.risk === "MEDIUM" ? "moderate" : "good";
              return <tr key={v.skill}><td style={{ fontWeight: 600 }}>{v.skill}</td><td className="muted mono" style={{ fontSize: 11.5 }}>{v.origin}</td>
                <td><span className={`tag-band band-${b}`}><span></span>{v.risk}</span></td></tr>;
            })}</tbody></table>
          <div className="helper" style={{ marginTop: 10 }}>Origin splits are analyst estimates assembled from public labour reporting — no official dataset publishes this breakdown at this precision.</div>
          </React.Fragment>
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
      <ReservesRow />
    </div>
  );
}

/* ---------- National reserves (shown on the Control layer) -------------- */
function ReservesRow() {
  return (
    <div className="grid cols-2" style={{ gridTemplateColumns: "1.2fr 1fr", marginTop: 16, alignItems: "start" }}>
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
  );
}

/* ---------- Model maturity (shown on How this works) -------------------- */
const DRIVER_LABEL = { throughput: "Maritime throughput", routeNews: "Trade-route news", partnerNews: "Partner-supply news", sea: "Sea state", market: "Market stress", sanctions: "Sanctions drift" };
function MaturityRow() {
  LIVE.useLiveTick();
  const eps = (LIVE.real && LIVE.real.episodes) || [];
  const open = LIVE.real && LIVE.real.episodeOpen;
  const logLive = !!(LIVE.real && LIVE.real.episodesLive);
  const fmtD = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  // calibration anchors — each scenario's computed severity vs the best-matching
  // measured episode from the shared log
  const matchFor = (id) => {
    const m = eps.filter((e) =>
      id === "hormuz" ? e.hormuzDrop >= 30 :
      id === "redsea" ? e.redseaDrop >= 30 && e.hormuzDrop < 30 :
      id === "chips" ? e.topDriver === "partnerNews" : false);
    if (!m.length) return null;
    return m.reduce((a, b) => (b.peakDrop > a.peakDrop ? b : a), m[0]);
  };
  const grade = (diff) => diff <= 3 ? ["HIGH", "good"] : diff <= 7 ? ["MODERATE", "moderate"] : ["LOW", "high"];
  const anchors = ["hormuz", "redsea", "chips"].map((id) => {
    const s = RD.scenarios.find((x) => x.id === id);
    const ep = matchFor(id);
    return { id, name: s.name, predicted: s.overall, ep };
  });
  const calib = RD.calib;
  const applyFrom = (a) => {
    const r = Math.max(0.5, Math.min(1.5, a.ep.peakDrop / Math.abs(a.predicted)));
    LIVE.setCalibration({ dragScale: +r.toFixed(2), basis: a.name + " · measured −" + a.ep.peakDrop + " vs anchor " + a.predicted + " · " + fmtD(a.ep.start), appliedAt: Date.now() });
  };
  return (
    <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 22, alignItems: "start" }}>
        <div className="stack">
        <Panel title="Measured episodes" icon="check" label={logLive ? "SHARED LOG · LIVE" : "SHARED LOG · CONNECTING"}
          right={<Fx payload={{
            kicker: "Validation · measured, not asserted", title: "How the track record is built",
            text: "The system watches its own score around the clock and keeps a permanent record of every real disruption. When the live score falls 3 or more points below its recent normal, an episode opens; when the score recovers, it closes. Each closed episode records what was measured — how far the score fell, how long the fall took, how long recovery took, which driver caused it, and whether the news signal moved before the shipping signal (the early-warning lead time). Episodes only count when at least 3 data feeds are live, so simulated readings can never enter the record. The log is stored centrally and is identical for every visitor.",
            formula: "open: live < baseline − 3 (≥3 live feeds) · close: live ≥ baseline − 1 · peak drop = baseline − min(live)",
            inputs: [
              { k: "Episodes recorded", v: String(eps.length) },
              { k: "Monitoring cadence", v: "every 6 hours around the clock; every 10 minutes while the dashboard is open" },
              { k: "Storage", v: "one central log, shared by all visitors" },
              { k: "Integrity", v: "episode rules run centrally — no visitor can alter or invent history" },
            ],
            assumption: "The 3-point open / 1-point close thresholds and the ≥3-live-feeds rule are stated model assumptions. The log starts empty and only fills as real disruptions occur — no seeded history.",
          }} />}>
          {eps.length === 0 && !open ? (
            <div className="empty" style={{ padding: "18px 0" }}>No episodes recorded yet — the shared log fills as real disruptions occur. {logLive ? "The detector is live." : "Connecting to the log…"}</div>
          ) : (
            <table className="tbl"><thead><tr><th>Episode</th><th>Peak drop</th><th>Recovery</th><th>News lead</th></tr></thead>
              <tbody>
                {open && <tr><td style={{ fontWeight: 600 }}>{fmtD(open.start)} — ongoing · {DRIVER_LABEL[open.topDriver] || open.topDriver}</td><td className="mono" style={{ color: "var(--high)" }}>−{open.dropSoFar} so far</td><td className="mono">—</td><td className="mono">—</td></tr>}
                {eps.slice(-6).reverse().map((e, i) => (
                  <tr key={i}><td style={{ fontWeight: 600 }}>{fmtD(e.start)} · {DRIVER_LABEL[e.topDriver] || e.topDriver}</td>
                    <td className="mono">−{e.peakDrop} pts · {e.daysToPeak}d</td>
                    <td className="mono">{e.daysToRecover}d</td>
                    <td className="mono">{e.newsLeadMin == null ? "—" : e.newsLeadMin > 0 ? "+" + (e.newsLeadMin >= 60 ? Math.round(e.newsLeadMin / 60) + "h" : e.newsLeadMin + "m") : "no lead"}</td></tr>
                ))}
              </tbody></table>
          )}
        </Panel>
        <Panel title="Calibration anchors" icon="gauge" label="SCENARIO SEVERITY vs MEASURED"
          right={<Fx payload={{
            kicker: "Calibration", title: "How measured episodes recalibrate the model",
            text: "Each scenario's severity is a stress-test assumption, not a prediction — so it is graded here as a calibration anchor: when a real episode of the same kind occurs (matched by chokepoint context or dominant driver), its measured peak drop is compared to the anchor. Close agreement raises confidence in the drag weights; a large gap produces a concrete correction — Apply scales the live drag layer by measured ÷ anchor (clamped 0.5–1.5×), per-browser and revertable, and the active multiplier is disclosed here and in the assumptions ledger.",
            formula: "grade(|anchor − measured|): ≤3 HIGH · ≤7 MODERATE · else LOW · apply: drag × (measured ÷ |anchor|)",
            inputs: anchors.map((a) => ({ k: a.name, v: a.ep ? "anchor " + a.predicted + " · measured −" + a.ep.peakDrop : "anchor " + a.predicted + " · awaiting a measured episode" })),
            assumption: "Scenario sector deltas stay curated — calibration tunes the LIVE drag layer only. The grade thresholds (3 / 7 pts) are stated assumptions.",
          }} />}>
          <table className="tbl"><thead><tr><th>Scenario anchor</th><th>Anchor</th><th>Measured</th><th>Fit</th></tr></thead>
            <tbody>{anchors.map((a) => {
              const g = a.ep ? grade(Math.abs(Math.abs(a.predicted) - a.ep.peakDrop)) : null;
              return <tr key={a.id}><td style={{ fontWeight: 600 }}>{a.name}</td><td className="mono">{a.predicted}</td>
                <td className="mono">{a.ep ? "−" + a.ep.peakDrop : "—"}</td>
                <td>{g
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className={`tag-band band-${g[1]}`}><span></span>{g[0]}</span>
                      <button className="drawer-link" style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => applyFrom(a)}>apply</button></span>
                  : <span className="tag-band band-moderate"><span></span>AWAITING</span>}</td></tr>;
            })}</tbody></table>
          <div className="helper" style={{ marginTop: 10, lineHeight: 1.5 }}>
            {calib
              ? <>Calibration <b>×{calib.dragScale}</b> applied to the live drag layer — basis: {calib.basis}. <button className="drawer-link" style={{ fontSize: 11.5, background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => LIVE.setCalibration(null)}>revert to ×1.0</button></>
              : "No calibration applied — the live drag layer runs at its stated weights (×1.0). Apply becomes available once a matching episode is measured."}
          </div>
        </Panel>
        </div>
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
  );
}

/* ---------- Methodology (explainability home) --------------------------- */
function MethodologyView() {
  const qs = [
    { n: "1", t: "Why two scores, not one?", d: "They are a baseline and its live deviation. Structural Resilience is the slow-moving ceiling — your fundamentals, built from three capacities (Absorb, Recover, Adapt) set against the most-exposed sector. Live Resilience is that ceiling minus today's active load, and climbs back toward it as conditions settle. The gap between them tells you whether a low number is a deep structural problem or a passing storm." },
    { n: "2", t: "What is the DRI — and how is it built?", d: "The Dependency Risk Index scores one import's fragility, 0–100, from five inputs on the same scale. Structural fragility (0.67 of the score) blends four supply dimensions — source concentration, substitution difficulty, route exposure and counterpart risk — with Route weighted highest (0.34 vs 0.22 each) because chokepoint dependence is the hardest risk to mitigate. Buffer fragility (0.33) adds reaction time: a thin buffer is itself a fragility, which is why Dolphin gas (30-day buffer) and LEU fuel (540-day) score very differently despite comparable dimensions." },
    { n: "3", t: "What does non-compensatory mean?", d: "Strong sectors cannot average away a more-exposed one — and the rule applies at both levels. Within a sector, the anchor import — the one with the highest DRI × consequence, the most fragile import that matters — carries 60% of the sector score. Nationally, Structural Resilience anchors to the most-exposed sector — 60% most-exposed + 40% overall capacity — so one concentrated dependency stays visible behind healthy ones, while still reading the full picture." },
    { n: "4", t: "How is consequence weighting calculated?", d: "It is computed, not assigned: a blend of four publicly-grounded factors — Essentiality, Service reliance, Immediacy and Breadth — combined as 0.40·ess + 0.25·svc + 0.20·imm + 0.15·brd. Piped gas scores " + RD.precursors.find((p) => p.id === "gas").consequence.toFixed(2) + " (continuous, universal); gold doré " + RD.precursors.find((p) => p.id === "golddore").consequence.toFixed(2) + " (a refining margin, narrow). The weight scales each import's pull on its sector score and on Absorb capacity; open any import in Dependencies to see its four factors. Distinct from the DRI, which scores supplier fragility, not national importance." },
    { n: "5", t: "Where do the numbers come from?", d: "Three tiers: live public feeds (ship transits, route & partner-supply news, weather, markets, sanctions, conflict), hand-curated open-source datasets, and explicitly stated assumptions. Every figure carries a source tag identifying its tier, and the status bar shows whether each live feed is currently connected (● Live) or temporarily simulated (○ Sim)." },
    { n: "6", t: "Does the system recommend actions?", d: "Yes — the Response & pre-mortem view holds a ranked queue of national responses. Each is a concrete implementation brief — what gets built, where, with which technology and partners — anchored to a real precedent project with its actual cost and timeline. The one decision per response is scope: three tiers, from quick stopgap to full build. Live tiers improve today's score; ceiling tiers raise the structural ceiling. Priority ranks the problem, not the plan you pick — weakness leads, blended with payoff and time-pressure." },
    { n: "7", t: "What is a pre-mortem?", d: "A post-mortem asks why something failed after the fact; a pre-mortem flips the timeline — it assumes a response has already failed and works backwards to explain how, surfacing weak points before you commit. Every recommendation carries one: the named ways it could fail, each with a likelihood, the leading indicator to watch, and a mitigation. A recommendation is only as trustworthy as its failure modes." },
    { n: "8", t: "What happens when a live feed is unreachable?", d: "The system never quietly substitutes invented data for measured data. Each feed is marked ● Live in the status bar while connected; if a source goes down, that one signal falls back to a clearly-marked simulation (○ Sim) anchored to its last known values — and the driver attribution on the Overview keeps showing exactly which inputs are measured and which are modelled." },
    { n: "9", t: "Why do the scores show a ± range?", d: "A single fixed number implies precision the model does not have, so every headline and sector score is shown with a ± range — the band you see on each score track. The range comes from re-running the whole model with each editable assumption pushed to the high and low ends of what's reasonable; the widest swings set its width. Open any score's explainer to see that range broken down — how far it moves, a plain-language confidence read, and which assumptions move it most, longest bar first — so a tighter range is a more settled score." },
    { n: "10", t: "Why is gas modelled as two prices, not one?", d: "Because the UAE lives in two gas-price worlds at once. Contracted Dolphin gas is a fixed ~$1.50/MMBtu floor; its replacement if curtailed is sea-borne LNG at ~12.5% of Brent (~$12 today). Losing Dolphin is a price-basis flip — roughly an 8× reprice — not a volume gap. Henry Hub (US gas, ~$3) is the wrong price basis for the UAE and is not used." },
  ];
  const STEPS = [
    { t: "Score each import's fragility — the DRI", f: "DRI = 0.67 × route-weighted supply fragility + 0.33 × buffer fragility",
      d: "We track " + RD.precursors.length + " supplies the UAE cannot function without — gas, desalination membranes, medicines, chips, dollar-clearing and more. Each gets a 0–100 fragility score from four supply dimensions — source concentration, substitution difficulty, route exposure (the most heavily weighted, because shipping chokepoints are the UAE's defining exposure) and counterpart risk — plus its stockpile buffer, because a thin buffer means no time to react.", where: "Dependencies → DRI" },
    { t: "Weigh each import's consequence", f: "Consequence = 0.40 essentiality + 0.25 service reliance + 0.20 immediacy + 0.15 breadth",
      d: "Fragility alone isn't risk — a shaky supply of something trivial doesn't matter. Each import also gets a 0–1 weight for how badly the nation would feel its loss.", where: "Dependencies → Consequence" },
    { t: "Roll imports up into 7 sector scores", f: "Sector = 100 − (0.6 × anchor DRI + 0.4 × consequence-weighted mean) · anchor = highest DRI × consequence",
      d: "A sector's score anchors to its riskiest import — the most fragile one that matters most carries 60% — with the consequence-weighted average of all its imports as the other 40%. Non-compensatory: one critical dependency can never hide behind a portfolio of safer ones.", where: "Overview → Sector resilience" },
    { t: "Set the calm-day ceiling — Structural Resilience", f: "Structural = 0.60 × most-exposed sector + 0.40 × capacity (Absorb · Recover · Adapt)",
      d: "The same weakest-link rule, one level up: the single most-exposed sector carries 60%, blended with the country's coping capacity — buffers vs a 90-day benchmark, sovereign firepower and substitutability, and the depth and speed of each sector's structural plan. This is fair-weather strength; it moves monthly, not daily.", where: "Overview → Structural Resilience" },
    { t: "Subtract today's measured pressure — Live Resilience", f: "Live = ceiling − (throughput + route news + partner news + sea state + market stress + sanctions drift)",
      d: "Six drag terms, each measured from a live public feed and individually capped, subtract from the ceiling to give strength right now. The gap between the two scores is today's pressure — and exactly where the Response queue points.", where: "Overview → Live Resilience · Response" },
  ];
  const GLOSS = [
    ["Structural Resilience", "Fair-weather strength — how well the country copes on a calm day. Slow to change."],
    ["Live Resilience", "Strength right now, after today's events. Moves day to day."],
    ["The gap", "Today's pressure — how far live strength has dropped below fair-weather strength."],
    ["DRI", "Dependency Risk Index — a 0–100 fragility score for one import. Higher means shakier supply."],
    ["Consequence", "How badly losing an import would hurt the nation, scored 0 to 1."],
    ["Buffer", "How many days the country can keep going on existing stock if a supply stops."],
    ["Sector resilience", "A 0–100 strength score per sector: 100 minus its anchored fragility — the anchor import's DRI carries 60%, the consequence-weighted average of all its imports 40%. The anchor is the import with the highest DRI × consequence, so the weak link that matters always shows. Runs opposite to DRI — higher is stronger, so the lowest-scoring sector is the most at risk."],
    ["Absorb · Recover · Adapt", "The three ways a country copes: take a hit, bounce back, and cut future risk."],
    ["Non-compensatory", "A strong sector can't hide a weak one — the weakest link always shows in the score."],
    ["Cascade", "A timeline of what would break first if a shock hit, as buffers run down."],
    ["Pre-mortem", "Imagining a plan has already failed and asking why — to catch weak points before committing."],
    ["Live / Sim", "Live = a real data feed is connected. Sim = that feed is down, showing a last-known stand-in."],
  ];
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">How it works</div>
        <div className="view-sub">The whole model, laid bare — an illustrative, transparent example, not an official or classified assessment. Nothing here is a black box.</div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <Panel title="The model in five steps" icon="layers" label="START HERE · PLAIN ENGLISH">
          <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 900 }}>
            Every number on this platform is built the same way, from the ground up — five formulas, each consuming the one below. In one sentence: <b style={{ color: "var(--ink)" }}>score what's fragile, weight it by what matters, never let averages hide the weak link, set the calm-day ceiling, subtract today's measured pressure.</b>
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
                  {s.f && <div className="mono" style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 6, padding: "5px 10px", margin: "2px 0 7px", display: "inline-block", maxWidth: "100%" }}>{s.f}</div>}
                  <div className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 5 }}>{s.d}</div>
                  <span className="helper" style={{ fontSize: 11 }}>In the app: <b style={{ color: "var(--accent)" }}>{s.where}</b></span>
                </div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid var(--line)", maxWidth: 900 }}>
            Everything else derives from these five: scenarios push sector-delta vectors through the same 60/40 anchor, the cascade runs buffers down through time, the Response queue ranks plays by 0.5 × sector fragility + 0.3 × payoff + 0.2 × time-pressure, and measured episodes recalibrate the live drag terms.
          </p>
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
        <div className="view-head" style={{ marginBottom: 6 }}>
          <div className="view-title" style={{ fontSize: 19 }}>How the model has performed — and what's left to build</div>
          <div className="view-sub">A measured track record: disruption episodes are detected and recorded by a shared server-side log, then compared against the scenario severities as calibration anchors. This is commentary on the model itself, not on the UAE.</div>
        </div>
        <MaturityRow />
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
                ["Buffers-and-flows propagation", "→ the cascade engine: each import carries a stated buffer in days"],
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
            {Object.entries(RD.sources).filter(([k]) => k !== "live").map(([k, s]) => {
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
            {(() => {
              const GROUPS = [
                ["Scoring the imports & sectors", [
                  "DRI = 0.67 × structural fragility (Route 0.34 · Concentration / Substitution / Counterpart 0.22 each) + 0.33 × buffer fragility (1 − min(buffer / 180d, 1)) — a thin buffer is itself a fragility. The 180-day horizon here is the time to re-source a dependency for good (build new supply lines), so a buffer only fully removes fragility once it covers that whole re-sourcing window",
                  "Sector = 100 − (0.6 × anchor DRI + 0.4 × consequence-weighted mean); anchor = highest DRI × consequence — the same weakest-link rule as the national headline",
                  "Buffer days are curated estimates ('est.') or reported policy ('stated') — provenance shown on each import in Dependencies",
                ]],
                ["The two headline scores", [
                  "Structural Resilience = 0.60 × most-exposed sector + 0.40 × capacity (non-compensatory anchor)",
                  "Capacity = equal-weight Absorb (consequence-weighted buffers vs a 90-day operational-cover benchmark — the days-of-cover that earn full credit, set to match the national 90-day strategic reserve, a different question from DRI's 180-day re-sourcing horizon) · Recover (sovereign firepower + re-sourcing ease) · Adapt (plan depth × speed from the response catalog; 2.5 pts & 24 months = full credit; no play = 0)",
                  "Capacity is compensatory by design (complementary coping modes) and scores stocks, money and plans only — redundancy, workforce and institutions are tracked qualitatively in the Control layer",
                  "Financial firepower = 100 × min(liquidity-weighted deployable sovereign capital / $750bn stress benchmark, 1) — liquidity factors 1.0 / 0.6 / 0.3; the benchmark ≈ 18 months of the national import bill (est.)",
                  "Axis goalposts: 100 = autarky (unreachable); ~72 = realistic frontier — display anchors only, feeding no score",
                  "Score uncertainty = each editable assumption nudged to its high and low ends; the wider the swing, the lower the confidence label",
                ]],
                ["Live load & feeds", [
                  "Live Resilience = ceiling − active load (throughput + route news + partner news + sea state + market stress + sanctions drift); each term capped, total floored at 25",
                  "Partner-supply news counts adverse-only coverage of single/few-source partners, scaled by the highest-consequence import on that partner — it moves Live, never the structural DRI",
                  "Chokepoint baselines = each strait's own 12-month busy-period norm (90th-percentile daily transits)",
                  "Each news lane (route-closure, partner-supply, etc.) has a manually set 'normal' article-volume baseline. Pressure = (last 2 days' volume ÷ that baseline − 1) ÷ 2, then capped at 1. In plain terms: coverage has to run at 3× its normal volume to register full pressure (1.0), and it can't read higher than that — so a single noisy lane can't swamp the score",
                  "Trends compare stored score snapshots in this browser (24h / 30d); with no old-enough history the UI shows a dash, never a seed",
                  "OFAC weekly 'new designations' is an illustrative stand-in; only the live total-entity-count drift enters the score",
                  "Gas is a two-state node: ~$1.50/MMBtu contract floor (reported estimate) vs marginal LNG ≈ 12.5% of Brent — a price-basis flip, not a volume gap; Henry Hub is not used",
                ]],
                ["Scenarios & validation", [
                  "A scenario's overall impact is computed from how far each sector's score drops: 0.60 × the worst-hit sector's drop + 0.40 × the average drop across all sectors — so a scenario is judged mostly by its weakest link, partly by its breadth. This figure is always derived from the per-sector drops, never typed in by hand. Only 'Combined Maximum' has hand-authored per-sector drops (a deliberate worst case); its overall is still computed from them the same way",
                  "The episode log records genuine stress spells. An episode opens when Live drops 3+ points below its baseline with at least 3 feeds live, and closes once Live recovers to within 1 point",
                ]],
                ["Response engine", [
                  "Response priority = 0.50 weakness + 0.30 payoff + 0.20 time-pressure, each rescaled to its range across the queue",
                  "On the Response view you can stage one or more responses to preview their combined effect. Each response contributes a fixed number of points on its own — the model assumes no interaction or diminishing returns between them, so staged points simply add up. The resulting live score = today's live + those staged points, but never above the new ceiling (which the ceiling-raising responses may themselves have lifted): relief now can't push you past the best score the system can structurally reach",
                ]],
              ];
              let n = 0;
              return GROUPS.map(([g, items]) => (
                <div key={g} style={{ marginBottom: 6 }}>
                  <div className="label" style={{ padding: "8px 0 2px" }}>{g}</div>
                  {items.map((a) => { n++; return (
                    <div key={a} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line)", fontSize: 12.5 }}>
                      <span className="src assumption" style={{ flex: "0 0 auto" }}><span className="d"></span>A{n}</span>
                      <span>{a}</span>
                    </div>
                  ); })}
                </div>
              ));
            })()}
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MapView, DependenciesView, ControlView, MethodologyView });
