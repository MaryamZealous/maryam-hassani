/* ============================================================================
   Views, part 1 — Overview, Live Threats, Cascade, Scenarios
   ========================================================================== */
const { useState } = React;

/* helper: band by magnitude of a delta */
function magBand(d) {
  const a = Math.abs(d);
  return a >= 25 ? "critical" : a >= 12 ? "high" : a >= 4 ? "moderate" : a > 0.05 ? "good" : "good";
}

/* ---------- "what changed" strip ---------------------------------------- */
function WhatChanged() {
  const items = [
    { label: "Live Stress", v: "+2.5", dir: "up", note: "gap to baseline narrowing", src: "acled" },
    { label: "Logistics", v: "−4.2", dir: "down", note: "Hormuz transits collapsed", src: "ais" },
    { label: "Hormuz", v: "−96%", dir: "down", note: "5 of 138 vessels/day", src: "ais" },
    { label: "RO stock", v: "−1 day", dir: "down", note: "now 47 of 75-day buffer", src: "curated" },
    { label: "Brent", v: "+4%", dir: "up", note: "$93.09 / barrel", src: "yfinance" },
  ];
  return (
    <Panel title="What changed since yesterday" icon="spark" label="24-HOUR DELTA"
      right={<span className="helper" style={{ marginLeft: "auto" }}>For the 30-second scan</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="label">{it.label}</span>
            <span className={`mono ${it.dir}`} style={{ fontSize: 22, fontWeight: 600 }}>{it.v}</span>
            <span className="helper">{it.note}</span>
            <span style={{ marginTop: 2 }}><SourceTag src={it.src} /></span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------- Gap bar: baseline vs live deviation -------------------------- */
function GapBar() {
  const s = RD.headline.structural.value;
  const l = RD.headline.live.value;
  const gap = +(s - l).toFixed(1);
  return (
    <div className="gapbar">
      <div className="gapbar-head">
        <span className="gapbar-k">The gap is the signal</span>
        <span className="gapbar-val mono">{gap}</span>
        <span className="gapbar-sub">points below baseline · live disruption</span>
      </div>
      <div className="gapbar-track">
        <div className="gapbar-live" style={{ width: l + "%" }}></div>
        <div className="gapbar-gap" style={{ left: l + "%", width: (s - l) + "%" }}></div>
        <div className="gapbar-ceil" style={{ left: s + "%" }}><span>ceiling {s}</span></div>
        <div className="gapbar-livemark" style={{ left: l + "%" }}><span>live {l}</span></div>
      </div>
      <div className="gapbar-foot">
        Live operational resilience sits <b>{gap} below the structural ceiling</b> — the cost of today's disruption
        (Hormuz &amp; Red Sea throughput, counted once via vessels, plus residual Guinea/EGA bauxite drag — now easing). As it clears, live recovers
        <i>toward</i> {s} but can never pass it. A widening gap is the early-warning metric; a closing gap means the system is returning to its fundamentals.
      </div>
    </div>
  );
}

/* ---------- Overview ----------------------------------------------------- */
function OverviewView({ go }) {
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">The gap is the signal</div>
        <div className="view-sub">
          A <b>baseline and its live deviation</b>, not two independent readings. <b>Structural Resilience</b> is the
          slow-moving ceiling — your fundamentals, exposure net of the capacity to absorb and adapt. <b>Live Stress</b>
          is that ceiling <i>minus</i> today's acute drag, and can never exceed it: you can't be more resilient mid-crisis
          than your fundamentals allow. The <b>gap</b> between them is the real signal — wide gap = acute crisis; narrow = operating near baseline.
        </div>
      </div>

      <div className="hero">
        <ScoreCard d={RD.headline.structural} />
        <ScoreCard d={RD.headline.live} />
      </div>

      <GapBar />

      <div style={{ marginBottom: 16 }}><WhatChanged /></div>

      <Panel title="Sector resilience" icon="gauge" label="7 CRITICAL SECTORS"
        right={<span className="helper" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          Worst sector caps the score <Fx payload={{
            kicker: "Aggregation rule", title: "Non-compensatory by blend",
            text: "Strong sectors cannot average away a weak one, but the weakest pillar shouldn't drag the score below itself either. Readiness is anchored to the worst sector while still reading the mean — so a single critical dependency stays visible without producing an impossibly low floor.",
            formula: "Readiness  =  0.60 × weakest sector  +  0.40 × mean(sectors)",
            inputs: [
              { k: "Weakest sector", v: "Defence · 40.1" },
              { k: "Mean of 7 sectors", v: "61.3" },
              { k: "Blended readiness", v: "48.6" },
            ],
            assumption: "The 0.60 weak-anchor weight is a deliberate, editable assumption — it sets how hard the worst pillar dominates. It replaces an earlier multiplicative penalty that could push the result below the weakest sector, which overstated fragility.",
          }} />
        </span>}>
        <div className="sector-grid">
          {RD.sectors.map((s) => <SectorCard key={s.id} s={s} onOpen={(sec) => go("dependencies", { sector: sec.id })} />)}
        </div>
      </Panel>

      <div className="grid cols-2" style={{ marginTop: 16, gridTemplateColumns: "1.5fr 1fr" }}>
        {/* cascade CTA */}
        <section className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <header className="panel-h"><Icon name="cascade" size={15} style={{ color: "var(--muted)" }} />
            <span className="ttl">How a shock spreads</span>
            <span className="label" style={{ marginLeft: "auto" }}>SIGNATURE VIEW</span></header>
          <div className="panel-b" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              The model's core idea: a single disruption doesn't stay put. Watch a Hormuz closure travel from
              chokepoint to precursor to asset to sector to the national score — day by day, every step explained.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {["Trigger", "Precursor", "Asset", "Sector", "National"].map((t, i) => (
                <React.Fragment key={t}>
                  <span className="pill"><span className="sq" style={{ background: i === 0 || i === 4 ? "var(--crit)" : "var(--high)" }}></span>{t}</span>
                  {i < 4 && <Icon name="arrowRight" size={14} style={{ color: "var(--faint)" }} />}
                </React.Fragment>
              ))}
            </div>
            <button className="btn primary" style={{ alignSelf: "flex-start", marginTop: "auto" }} onClick={() => go("cascade")}>
              <Icon name="play" size={15} />Open the cascade
            </button>
          </div>
        </section>

        {/* top signals */}
        <Panel title="Live signals" icon="threat" label="TOP 4"
          right={<button className="exp" style={{ marginLeft: "auto" }} onClick={() => go("threats")}>All threats →</button>}>
          {RD.indicators.slice(0, 4).map((ind) => (
            <div className={`indi band-${ind.status}`} key={ind.id}>
              <span className="indi-led"></span>
              <div className="indi-name">{ind.name} <span className="u">{ind.unit}</span></div>
              <Sparkline data={ind.spark} band={ind.status} />
              <div className="indi-val mono">{ind.value}</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Live Threats ------------------------------------------------- */
function ProvenanceLedger() {
  const live = RD.headline.live, structural = RD.headline.structural;
  const choke = RD.chokepoints.map((c) => ({
    signal: c.name, src: "ais",
    observed: `${c.vessels} vessels/day`,
    series: c.spark || null,
    ref: `${c.baseline}/day · 90-day median`,
    transform: `1 − ${c.vessels}/${c.baseline} → −${c.drop}%`,
    feeds: "Maritime throughput (~75% of drag)",
    assume: "Judged against this strait's own 90-day median, never an absolute count. Chokepoint pressure feeds the acute-drag term only — it never moves the structural baseline.",
  }));
  const shk = RD.shocks.filter((s) => s.id === "guinea").map((s) => ({
    signal: s.name, src: s.src,
    observed: `event · ${s.when}`,
    series: null, note: s.note, evidence: s.evidence,
    ref: "severity rubric (0 to −35)",
    transform: `${s.impact} pts`,
    feeds: "Non-maritime shock severity",
    assume: "Severity is a curated, editable judgement from the observed event — not a measured quantity.",
  }));
  const rows = [...choke, ...shk];
  const openRow = (r) => {
    const sm = RD.sources[r.src];
    window.__explain && window.__explain({
      kicker: "Observed raw & assumptions",
      title: r.signal,
      text: `Feed: ${sm.full}. The value below is the raw figure the feed reported; the transform is applied before it reaches the Live Stress score.`,
      inputs: [
        { k: "Observed (raw)", v: r.observed, src: r.src },
        r.series ? { k: "Recent series (old → new)", v: r.series.join("  →  ") } : null,
        r.note ? { k: "Event note", v: r.note } : null,
        { k: "Reference", v: r.ref },
        { k: "Transform", v: r.transform },
        { k: "Feeds into", v: r.feeds },
        { k: "Feed cadence", v: `${sm.cadence} · last ${sm.fresh}` },
        (r.evidence && r.evidence.length)
          ? { k: "Public sources", v: (<span style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px 12px" }}>{r.evidence.map((e, i) => (<a key={i} className="drawer-link" href={e.url} target="_blank" rel="noopener noreferrer">{e.label} ↗</a>))}</span>) }
          : (sm.url ? { k: "Public source", v: (<a className="drawer-link" href={sm.url} target="_blank" rel="noopener noreferrer">{sm.url} ↗</a>) } : null),
      ].filter(Boolean),
      assumption: r.assume,
    });
  };
  const trail = [
    [`Live Stress ${live.value.toFixed(1)}`, `Structural ceiling ${structural.value} − Acute drag ${(structural.value - live.value).toFixed(1)}`, 0],
    [`Acute drag ${(structural.value - live.value).toFixed(1)}`, "Maritime throughput (→ −5.6) + non-maritime shocks (→ −1.9)", 1],
    ["Maritime throughput", "AIS · " + RD.chokepoints.map((c) => `${({ hormuz: "Hormuz", redsea: "Red Sea", suez: "Suez" })[c.id] || c.name} ${c.vessels}/${c.baseline}`).join(", ") + " — embeds escalation", 2],
    ["Non-maritime shocks", "ACLED · Guinea bauxite −15 (the only shock not already in vessel counts)", 2],
  ];
  return (
    <Panel title="Source & provenance ledger" icon="book" label="EVERY NUMBER, TRACEABLE" style={{ marginTop: 16 }}>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 14px", maxWidth: 940 }}>
        The integrity of the live score rests on traceability. <b>Click any row</b> to open its observed raw series and the
        exact assumptions applied before it reaches the score — the public source URL is listed inside each panel. This is
        the audit trail behind <b>Live Stress {live.value.toFixed(1)}</b>. Only inputs that actually feed the calculation are
        listed here — price and event-context signals live in the panels above.
      </p>
      <div className="prov-trail">
        {trail.map(([k, v, depth], i) => (
          <div key={i} className="prov-trail-row" style={{ marginLeft: depth * 26 }}>
            {depth > 0 && <span className="prov-trail-elbow">└</span>}
            <span className="prov-trail-k mono">{k}</span>
            <span className="prov-trail-eq">=</span>
            <span className="prov-trail-v">{v}</span>
          </div>
        ))}
      </div>
      <div className="prov-note">
        <b>Maritime disruption is counted once.</b> Escalation isn't a separate input — it's the <i>cause</i> of the vessel
        drop (carriers reroute because of it), so the measured throughput already embeds it. The maritime events in the
        convergence panel are shown as the causes of the throughput hit, not re-added to the score. Only non-maritime
        shocks (e.g. Guinea bauxite) contribute a separate severity term.
      </div>
      <div className="prov-table-wrap">
        <table className="prov-table">
          <thead>
            <tr><th>Signal</th><th>Feed &amp; endpoint</th><th>Observed (raw)</th><th>Reference</th><th>Transform</th><th>Feeds into</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const sm = RD.sources[r.src];
              return (
                <tr key={i} className="prov-row" onClick={() => openRow(r)} title="Show observed raw & assumptions">
                  <td style={{ fontWeight: 600 }}>{r.signal}</td>
                  <td><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><SourceTag src={r.src} /><span className="prov-endpoint">{sm.endpoint}</span></div></td>
                  <td className="mono">{r.observed}</td>
                  <td className="muted">{r.ref}</td>
                  <td className="mono prov-transform">{r.transform}</td>
                  <td className="muted">{r.feeds}</td>
                  <td><span className="prov-raw-btn">raw &amp; assumptions ›</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="helper" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        Each row opens its observed raw series and the assumptions applied. Live feeds refresh on the cadences shown in the status bar; curated values are version-controlled and reviewed. Raw pulls are retained so any score can be reconstructed for any timestamp, and the public-source URL for independent checking is listed inside each panel.
      </div>
    </Panel>
  );
}
function ThreatsView() {
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Live threats</div>
        <div className="view-sub">Chokepoint pressure, converging shocks and leading indicators — the fast-moving inputs to the Live Stress score.</div>
      </div>

      <Panel title="Maritime chokepoints" icon="globe" label="VESSEL TRANSITS vs. 90-DAY BASELINE" style={{ marginBottom: 16 }}>
        <div className="grid cols-3">
          {RD.chokepoints.map((c) => {
            const pct = Math.round((c.vessels / c.baseline) * 100);
            return (
              <div key={c.id} className={`band-${c.band}`} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--panel-2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "var(--font-display)" }}>{c.name}</span>
                  <BandTag score={c.band === "critical" ? 30 : c.band === "high" ? 50 : 80} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 30, fontWeight: 600 }}>{c.vessels}</span>
                  <span className="muted mono" style={{ fontSize: 13 }}>/ {c.baseline} normal</span>
                  <span className="mono down" style={{ marginLeft: "auto", fontSize: 13 }}>−{c.drop}%</span>
                </div>
                <div className="bar-track" style={{ margin: "12px 0 10px", height: 6 }}><div className="bar-fill" style={{ width: pct + "%" }}></div></div>
                <div className="helper">{c.note}</div>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SourceTag src="ais" />
                  <Fx payload={{
                    kicker: "Chokepoint pressure", title: c.name,
                    text: `Pressure is the drop in daily transits versus this chokepoint's own 90-day baseline of ${c.baseline} vessels/day. Today: ${c.vessels}/day, a ${c.drop}% fall.`,
                    formula: "Pressure  =  1 − (today's transits / 90-day baseline)",
                    inputs: [
                      { k: "Today", v: c.vessels + " vessels/day", src: "ais" },
                      { k: "Baseline", v: c.baseline + " vessels/day (median)", src: "ais" },
                      { k: "Contribution", v: "feeds 60% of Live Stress" },
                    ],
                    assumption: "A quiet strait and a busy one are judged on their own normal — absolute counts are never compared across chokepoints.",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Panel title="Shock convergence" icon="alert" label="LAST 30 DAYS">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RD.shocks.map((s) => {
              const modelled = s.src === "assumption";
              return (
              <div key={s.id} className={`band-${s.band}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", border: "1px solid var(--line)", borderLeft: "3px solid var(--bc)", borderRadius: "var(--radius)", background: "var(--panel-2)", opacity: modelled ? 0.92 : 1, borderStyle: modelled ? "dashed" : "solid" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {s.name}
                    {modelled && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 4, padding: "1px 5px" }}>What-if · not observed</span>}
                  </div>
                  <div className="helper" style={{ marginTop: 2 }}>{s.note}</div>
                  {s.track && (
                    <div className="trk-row">
                      <span className="trk-dot"></span>
                      <span className="trk-txt">{s.track}</span>
                    </div>
                  )}
                  {s.evidence && (
                    <div className="evi-row">
                      <button className="prov-raw-btn" onClick={(ev) => { ev.stopPropagation(); window.__explain && window.__explain({
                        kicker: "Observed raw & assumptions",
                        title: s.name,
                        text: `Observed event signal · source ${RD.sources[s.src].full}. The impact below is a curated severity judgement applied to the Live Stress acute-drag term.`,
                        inputs: [
                          { k: "Observed", v: `event · ${s.when}`, src: s.src },
                          { k: "Event note", v: s.note },
                          { k: "Severity applied", v: `${s.impact} pts` },
                          { k: "Feeds into", v: "Shock severity (40% of acute drag)" },
                          { k: "Public sources", v: (<span style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px 12px" }}>{s.evidence.map((e, i) => (<a key={i} className="drawer-link" href={e.url} target="_blank" rel="noopener noreferrer">{e.label} ↗</a>))}</span>) },
                        ],
                        assumption: "Severity is a curated, editable judgement, not a measured quantity. Overlapping-corridor shocks compound rather than add.",
                      }); }}>Raw data &amp; assumptions ›</button>
                    </div>
                  )}
                </div>
                <SourceTag src={s.src} />
                <span className="mono down" style={{ fontSize: 15, fontWeight: 600, minWidth: 38, textAlign: "right", opacity: modelled ? 0.55 : 1 }}>{s.impact}</span>
              </div>
              );
            })}
            <div className={`band-${RD.convergence.band}`} style={{ marginTop: 4, padding: "13px 15px", borderRadius: "var(--radius)", background: "color-mix(in srgb,var(--bc) 12%,transparent)", border: "1px solid var(--bc)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="alert" size={17} style={{ color: "var(--bc)" }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>{RD.convergence.concurrent} concurrent shocks</span>
                <span className="mono" style={{ marginLeft: "auto", fontSize: 18, fontWeight: 700, color: "var(--bc)" }}>{RD.convergence.combined}</span>
                <Fx payload={{
                  kicker: "Convergence", title: "Why combined is worse than the sum",
                  text: RD.convergence.note,
                  formula: "Combined  =  Σ shocks  +  corridor-overlap amplifier",
                  inputs: RD.shocks.map((s) => ({ k: s.name, v: s.impact + " pts", src: s.src })),
                  assumption: "Overlap amplification is a modelled assumption — shocks hitting the same corridor compound rather than simply add.",
                }} />
              </div>
              <div className="helper" style={{ marginTop: 7 }}>{RD.convergence.note}</div>
            </div>
          </div>
        </Panel>

        <Panel title="Leading indicators" icon="spark" label="EARLY SIGNALS">
          {RD.indicators.map((ind) => (
            <div className={`indi band-${ind.status}`} key={ind.id}>
              <span className="indi-led"></span>
              <div className="indi-name" style={{ flex: "0 0 38%" }}>{ind.name}<br /><span className="u">{ind.unit}</span></div>
              <Sparkline data={ind.spark} band={ind.status} />
              <div className="indi-val mono">{ind.value}</div>
              <div className={`indi-delta ${ind.dir === "up" ? (ind.status === "good" ? "up" : "warnup") : ind.dir === "down" ? "down" : "flat"}`}>
                {ind.delta > 0 ? "+" : ""}{ind.delta}{ind.id.includes("transit") || ind.delta === 0 ? "%" : ind.id === "romembrane" ? "" : "%"}
              </div>
              <SourceTag src={ind.src} />
            </div>
          ))}
        </Panel>
      </div>

      <ProvenanceLedger />
    </div>
  );
}

/* ---------- Cascade view ------------------------------------------------- */
function CascadeView() {
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">The cascade engine</div>
        <div className="view-sub">
          This is how the system actually thinks. A shock at a chokepoint depletes the buffers of the imports
          that route through it; as each buffer runs out, the asset it feeds degrades, then the sector, then the
          national score. Press play, or step through the timeline — every node explains itself.
        </div>
      </div>
      <Panel title="Hormuz closure — propagation over 90 days" icon="cascade" label="ILLUSTRATIVE TRACE">
        <CascadeDiagram />
      </Panel>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        {[
          { n: "1", t: "Buffers, not bangs", d: "Nothing fails instantly. Each import has a published buffer in days; the shock simply starts the clock." },
          { n: "2", t: "Consequence-weighted", d: "RO membranes (0.90) and piped gas (1.00) propagate hard; gold doré (0.20) barely moves the system." },
          { n: "3", t: "Non-compensatory end", d: "Once Water turns critical, the national score is capped — strong Finance and Food cannot buy it back." },
        ].map((c) => (
          <div className="method-q" key={c.n} style={{ marginBottom: 0 }}>
            <h3><span className="badge-n">{c.n}</span>{c.t}</h3>
            <p>{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Scenarios ---------------------------------------------------- */
function ScenariosView() {
  const [pick, setPick] = useState("combined");
  const scn = RD.scenarios.find((s) => s.id === pick);
  const after = (47.0 + scn.overall).toFixed(1);

  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Scenario simulator</div>
        <div className="view-sub">Pre-built stress tests. Select one to see how each sector and the national score respond — and who would most plausibly be behind it.</div>
      </div>

      <div className="grid cols-2" style={{ gridTemplateColumns: "0.9fr 1.3fr", alignItems: "start" }}>
        <Panel title="Choose a scenario" icon="layers" label={RD.scenarios.length + " AVAILABLE"}>
          <div className="scn-list">
            {RD.scenarios.map((s) => (
              <button key={s.id} className={`scn ${pick === s.id ? "active" : ""} band-${magBand(s.overall)}`} onClick={() => setPick(s.id)}>
                <span className="scn-sev">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < s.severity ? "on" : ""}></i>)}</span>
                <div>
                  <div className="scn-name">{s.name}</div>
                  <div className="scn-sub">{s.sub}</div>
                </div>
                <span className="scn-delta" style={{ color: s.overall < 0 ? "var(--crit)" : "var(--muted)" }}>{s.overall === 0 ? "—" : s.overall}</span>
              </button>
            ))}
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Impact on the national score" icon="gauge"
            right={<span className="label" style={{ marginLeft: "auto" }}>{scn.name.toUpperCase()}</span>}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 18 }}>
              <div className="kpi"><span className="kpi-v mono">47.0</span><span className="kpi-l">Baseline live stress</span></div>
              <Icon name="arrowRight" size={20} style={{ color: "var(--faint)" }} />
              <div className="kpi"><span className="kpi-v mono" style={{ color: scn.overall < 0 ? "var(--crit)" : "var(--ink)" }}>{after}</span><span className="kpi-l">Under this scenario</span></div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: scn.overall < 0 ? "var(--crit)" : "var(--muted)" }}>{scn.overall === 0 ? "0.0" : scn.overall}</div>
                <div className="label">net change</div>
              </div>
            </div>
            <div className="delta-bars">
              {RD.sectors.map((sec) => {
                const d = scn.deltas[sec.id] || 0;
                const wpct = Math.min(Math.abs(d) / 50, 1) * 50;
                return (
                  <div className="delta-row" key={sec.id}>
                    <span className="delta-name">{sec.name}</span>
                    <div className={`delta-track band-${magBand(d)}`}>
                      <span className="delta-mid"></span>
                      <span className="delta-fill" style={{ background: "var(--bc)", width: wpct + "%", left: d < 0 ? (50 - wpct) + "%" : "50%" }}></span>
                    </div>
                    <span className="delta-val mono" style={{ color: d < -0.05 ? "var(--bc)" : "var(--muted)" }}>{d > 0 ? "+" : ""}{d}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Plausible actors behind it" icon="threat" label="RANKED BY CONFIDENCE">
            {RD.actors.slice().sort((a, b) => b.confidence - a.confidence).map((a) => (
              <div className={`band-${a.band}`} key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 90 }}>{a.name}</span>
                <span className="helper" style={{ flex: 1 }}>{a.vector}</span>
                <div className="bar-track" style={{ width: 90 }}><div className="bar-fill" style={{ width: a.confidence + "%" }}></div></div>
                <span className="mono" style={{ fontSize: 12, minWidth: 36, textAlign: "right", color: "var(--bc)" }}>{a.confidence}%</span>
              </div>
            ))}
            <div className="helper" style={{ marginTop: 10 }}>Confidence is an analyst-assigned prior, not a probability of attack. <SourceTag src="assumption" /></div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OverviewView, ThreatsView, CascadeView, ScenariosView, magBand });
