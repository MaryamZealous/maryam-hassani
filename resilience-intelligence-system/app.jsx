/* ============================================================================
   App shell — rail nav, top bar, explain drawer, routing. Briefing style only.
   ========================================================================== */
const { useState, useEffect, useRef } = React;
const NAV = [
  { group: "Monitor", items: [
    { id: "overview", label: "Overview", icon: "gauge" },
    { id: "threats", label: "Live signals", icon: "threat" },
    { id: "map", label: "Supply map", icon: "map" },
  ]},
  { group: "Analyze", items: [
    { id: "dependencies", label: "Dependencies", icon: "chain" },
    { id: "cascade", label: "Cascade", icon: "cascade" },
    { id: "scenarios", label: "Scenarios", icon: "layers" },
  ]},
  { group: "Respond", items: [
    { id: "act", label: "Sector responses", icon: "target" },
    { id: "control", label: "Control layer", icon: "shield" },
  ]},
  { group: "Understand", items: [
    { id: "methodology", label: "How it works", icon: "book" },
  ]},
];
const TITLES = {
  overview: "Overview", threats: "Live signals", map: "Supply map", cascade: "Cascade",
  scenarios: "Scenarios", dependencies: "Dependencies", act: "Sector responses", control: "Control layer",
  methodology: "How it works",
};

function IntroOverlay({ onEnter, dir }) {
  return (
    <div className="intro-scrim" data-dir={dir}>
      <div className="intro-card">
        <div className="intro-kicker">UAE National Resilience Intelligence System</div>
        <div className="intro-title">You're looking at an illustrative model.</div>
        <p className="intro-lead">A transparent, worked example of how national supply-chain resilience could be quantified — so the logic is inspectable, not hidden.</p>
        <div className="intro-points">
          <div className="intro-pt"><span className="ico"><Icon name="spark" size={15} /></span><span><b>Live + public data.</b> Conflict, vessel-traffic, market and sanctions feeds, plus curated open-source datasets.</span></div>
          <div className="intro-pt"><span className="ico"><Icon name="fx" size={15} /></span><span><b>Every number is explainable.</b> Click any <span style={{fontFamily:"var(--font-mono)"}}>ƒ</span> to see the exact formula, inputs, source and assumptions.</span></div>
          <div className="intro-pt"><span className="ico"><Icon name="info" size={15} /></span><span><b>Not an official assessment.</b> Decision-support and demonstration only — assumptions are stated and editable.</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="btn primary" onClick={onEnter}><Icon name="arrowRight" size={15} />Enter the system</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  useLiveTick();
  const dir = "b";                 // Briefing style only
  const IS_EMBED = typeof location !== "undefined" && /[?&]embed=1\b/.test(location.search);
  const [view, setView] = useState("overview");
  const [opts, setOpts] = useState({});
  const [drawer, setDrawer] = useState(null);
  const [intro, setIntro] = useState(() => !IS_EMBED && !localStorage.getItem("uae_seen"));
  const scrollRef = useRef(null);

  const go = (v, o = {}) => { setView(v); setOpts(o); setDrawer(null); if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const explain = (p) => setDrawer(p);
  useEffect(() => { window.__go = go; window.__explain = explain; }, []);
  useEffect(() => { if (window.MA) window.MA.section(intro ? "Welcome screen" : (TITLES[view] || view)); }, [view, intro]);

  const enter = () => { localStorage.setItem("uae_seen", "1"); setIntro(false); };

  const liveChips = [
    { k: "Ships", src: "ais" }, { k: "News", src: "gdelt" }, { k: "Markets", src: "yfinance" }, { k: "OFAC", src: "ofac" }, { k: "Sea", src: "meteo" }, { k: "Conflict", src: "acled" },
  ];

  const renderView = () => {
    switch (view) {
      case "overview": return <OverviewView go={go} />;
      case "threats": return <ThreatsView />;
      case "map": return <MapView />;
      case "cascade": return <CascadeView />;
      case "scenarios": return <ScenariosView />;
      case "dependencies": return <DependenciesView initial={opts} />;
      case "act": return <ActView initial={opts} />;
      case "control": return <ControlView />;
      case "methodology": return <MethodologyView />;
      default: return <OverviewView go={go} />;
    }
  };

  return (
    <ExplainCtx.Provider value={explain}>
      <div className="app" data-dir={dir}>
        {intro && <IntroOverlay onEnter={enter} dir={dir} />}

        {/* ---- rail ---- */}
        <nav className="rail">
          <div className="rail-brand">
            <div className="brand-mark">
              <div className="brand-glyph">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"></path>
                  <path d="M12 7v6M9 10h6" stroke="var(--accent)"></path>
                </svg>
              </div>
              <div>
                <div className="brand-name">Resilience<br />Intelligence</div>
                <div className="brand-sub">UAE</div>
              </div>
            </div>
          </div>
          <div className="rail-nav">
            {NAV.map((g) => (
              <div className="nav-group" key={g.group}>
                <div className="nav-group-label">{g.group}</div>
                {g.items.map((it) => {
                  let badge = it.badge, crit = it.crit;
                  if (it.id === "threats") {
                    const hot = RD.chokepoints.filter((c) => c.band === "critical" || c.band === "high");
                    badge = hot.length ? String(hot.length) : null;
                    crit = hot.some((c) => c.band === "critical");
                  }
                  return (
                  <button key={it.id} className={`nav-item ${view === it.id ? "active" : ""}`} onClick={() => go(it.id)}>
                    <Icon name={it.icon} size={16} className="nav-ico" />
                    <span>{it.label}</span>
                    {badge && <span className={`nav-badge ${crit ? "crit" : ""}`} title="Chokepoints currently in a high or critical band">{badge}</span>}
                  </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="rail-foot">
            <button className="illus-badge" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => explain({
              kicker: "About this system", title: "An illustrative model",
              text: "Combines live public data feeds with curated open-source datasets and transparent assumptions to produce explainable resilience estimates.",
              formula: "Live data  +  Curated sources  +  Stated assumptions  →  Explainable estimate",
              inputs: [
                { k: "Live feeds (6)", v: "PortWatch · Google News · Open-Meteo · markets · OFAC · GDELT conflict", src: "live" },
                { k: "Curated", v: RD.precursors.length + " imports · " + RD.assets.length + " assets · " + RD.scenarios.length + " scenarios", src: "curated" },
                { k: "Assumptions", v: "weights, buffers & goalposts — stated", src: "assumption" },
              ],
              assumption: "Nothing here is classified or an official Government of UAE position. It is a transparent demonstration of method.",
            })}>
              <span className="pulse"></span><b>ILLUSTRATIVE MODEL</b>
            </button>
          </div>
        </nav>

        {/* ---- main ---- */}
        <div className="main">
          <header className="topbar">
            <span className="crumb">{NAV.find((g) => g.items.some((i) => i.id === view)).group} / <b>{TITLES[view]}</b></span>
            <div className="topbar-spacer"></div>
            <div className="live-chips">
              {liveChips.map((c) => {
                const mode = (RD.sources[c.src] && RD.sources[c.src].mode) || "sim";
                const sm = RD.sources[c.src] || {};
                return (
                  <span className={`live-chip ${mode === "sim" ? "sim" : ""}`} key={c.k}
                    title={mode === "live" ? `${sm.full} — live real feed. Last checked ${sm.fresh}; source updates ${sm.cadence}.` : `${sm.full} — simulated (no live source connected)`}>
                    <span className={`live-dot ${mode === "sim" ? "sim" : ""}`}></span>{c.k}<span className="mono">{mode === "sim" ? "sim" : sm.fresh}</span>
                  </span>
                );
              })}
            </div>
            <IllusBadge />
          </header>

          <div className="scroll" ref={scrollRef}>
            {renderView()}
          </div>
        </div>

        {drawer && <Drawer payload={drawer} onClose={() => setDrawer(null)} />}
      </div>
    </ExplainCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
