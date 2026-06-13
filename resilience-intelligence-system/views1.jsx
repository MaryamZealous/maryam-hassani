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
  const live = RD.headline.live, struct = RD.headline.structural;
  const hz = RD.chokepoints.find((c) => c.id === "hormuz");
  const ro = RD.indicators.find((i) => i.id === "romembrane");
  const brent = RD.indicators.find((i) => i.id === "brent");
  const lsd = +(live.value - live.prev).toFixed(1);
  const lg = RD.sectors.find((s) => s.id === "logistics");
  const lgd = +(lg.score - lg.prev).toFixed(1);
  const items = [
    { label: "Live Stress", v: (lsd > 0 ? "+" : "") + lsd, dir: lsd >= 0 ? "up" : "down", note: "vs yesterday's baseline", src: "acled" },
    { label: "Logistics", v: (lgd > 0 ? "+" : "") + lgd, dir: lgd >= 0 ? "up" : "down", note: "Hormuz transits depressed", src: "ais" },
    { label: "Hormuz", v: "−" + hz.drop + "%", dir: "down", note: hz.vessels + " of " + hz.baseline + " transit calls/day", src: "ais" },
    { label: "RO stock", v: "−1 day", dir: "down", note: "now " + ro.value + " of 75-day buffer", src: "curated" },
    { label: "Brent", v: (brent.delta > 0 ? "+" : "") + brent.delta + "%", dir: brent.delta >= 0 ? "up" : "down", note: brent.value + " / barrel", src: "yfinance" },
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
        <span className="gapbar-sub">points below baseline · live load</span>
      </div>
      <div className="gapbar-track">
        <div className="gapbar-live" style={{ width: l + "%" }}></div>
        <div className="gapbar-gap" style={{ left: l + "%", width: (s - l) + "%" }}></div>
        <div className="gapbar-ceil" style={{ left: s + "%" }}><span>ceiling {s}</span></div>
        <div className="gapbar-livemark" style={{ left: l + "%" }}><span>live {l}</span></div>
      </div>
      <div className="gapbar-foot">
        Live operational resilience sits <b>{gap} below the structural ceiling</b> — the active load the system is absorbing today,
        summed from the named drivers below: maritime throughput (Hormuz &amp; Red Sea, counted once via transits), news pressure, sea state,
        market stress, sanctions drift, and the residual Guinea/EGA bauxite load (easing). As load clears, live recovers
        <i> toward</i> {s}, tracking back to its fundamentals. A widening gap shows where to focus today; a closing gap means the system is returning to full strength.
      </div>
    </div>
  );
}

/* ---------- Driver attribution: what's pulling the score down, by feed ---- */
function DriverTrace() {
  const drivers = (RD.headline.live.drivers || []).slice().sort((a, b) => (b.real - a.real) || (b.v - a.v));
  const maxV = Math.max(0.1, ...drivers.map((d) => d.v));
  const liveN = drivers.filter((d) => d.real).length;
  if (!drivers.length) return null;
  // three states: a connected live feed (LIVE), a simulated stand-in awaiting
  // its feed (SIM — never dressed up as live), or the curated model input (MODEL).
  const stateOf = (d) => d.modelled ? "model" : (d.real ? "live" : "sim");
  const META = {
    live:  { badge: "LIVE",  cls: "on",    sub: "live feed" },
    sim:   { badge: "SIM",   cls: "",      sub: "simulated until its feed connects" },
    model: { badge: "MODEL", cls: "model", sub: "modelled severity" },
  };
  return (
    <Panel title="What's moving the score right now" icon="book" label="LIVE DRIVER ATTRIBUTION"
      right={<span className="helper" style={{ marginLeft: "auto" }}>{liveN} of {drivers.length} drivers on a connected live feed</span>}>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 14px", maxWidth: 940 }}>
        The gap below baseline is the sum of named live loads. Each row shows its point contribution, its current reading, and how it is sourced:
        <span style={{ color: "var(--good)", fontWeight: 600 }}> LIVE</span> (a connected feed, moving on its own as the world changes),
        <span style={{ fontWeight: 600 }}> SIM</span> (a simulated stand-in, shown only until its feed connects) or
        <span style={{ color: "var(--muted)", fontWeight: 600 }}> MODEL</span> (a curated severity judgement with no real-time numeric feed). This is the honest line between what the system measures and what it estimates.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {drivers.map((d, i) => {
          const w = Math.round((d.v / maxV) * 100);
          const calm = !d.modelled && d.v < 0.05;
          const st = stateOf(d); const m = META[st];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 250, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.k}</span>
                <span className="helper" style={{ fontSize: 10 }}>{d.read || m.sub}</span>
              </div>
              <span className={`live-badge ${m.cls}`} title={m.sub}>{m.badge}</span>
              <div className="bar-track" style={{ flex: 1, height: 7 }}>
                <div className="bar-fill" style={{ width: Math.max(w, calm ? 0 : 2) + "%", background: st === "live" ? "var(--good)" : "var(--faint)" }}></div>
              </div>
              {calm
                ? <span className="mono" style={{ fontSize: 11, minWidth: 50, textAlign: "right", color: d.real ? "var(--good)" : "var(--faint)" }}>{d.real ? "watching" : "idle"}</span>
                : <span className="mono down" style={{ fontSize: 13, minWidth: 50, textAlign: "right" }}>−{d.v.toFixed(1)}</span>}
              <span style={{ minWidth: 92 }}><SourceTag src={d.src} /></span>
            </div>
          );
        })}
      </div>
      <div className="helper" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        Feeds — <b>maritime throughput</b>: IMF PortWatch satellite AIS · <b>sea state</b>: Open-Meteo · <b>trade-route news</b>: Google News ·
        <b> energy-market stress</b>: Brent &amp; gas · <b>counterpart risk</b>: OFAC / OpenSanctions. The residual Guinea/EGA bauxite
        load is the one <b>MODEL</b> input — a curated, easing severity judgement with no real-time numeric feed, so it is never shown as live.
      </div>
    </Panel>
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
          slow-moving ceiling — your fundamentals, exposure net of the capacity to absorb and adapt. <b>Live Stress</b> is
          that ceiling <i>minus</i> today's active load, and tracks toward it as conditions settle: live strength climbs back to
          what your fundamentals allow. The <b>gap</b> between them is the real signal — a wide gap shows where to focus today; narrow = operating close to full strength.
        </div>
      </div>

      <div className="hero">
        <ScoreCard d={RD.headline.structural} />
        <ScoreCard d={RD.headline.live} />
      </div>

      <GapBar />

      <div style={{ marginTop: 16 }}><DriverTrace /></div>

      <div style={{ marginBottom: 16 }}><WhatChanged /></div>

      <Panel title="Sector resilience" icon="gauge" label="7 CRITICAL SECTORS"
        right={<span className="helper" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          Most-exposed sector sets the floor <Fx payload={{
            kicker: "Aggregation rule", title: "Non-compensatory by blend",
            text: "Strong sectors cannot average away a more-exposed one, but the most-exposed pillar shouldn't pull the score below itself either. Readiness is anchored to the most-exposed sector while still reading the mean — so a single concentrated dependency stays visible without producing an impossibly low floor.",
            formula: "Readiness  =  0.60 × most-exposed sector  +  0.40 × mean(sectors)",
            inputs: [
              { k: "Most-exposed sector", v: "Defence · 40.1" },
              { k: "Mean of 7 sectors", v: "61.3" },
              { k: "Blended readiness", v: "48.6" },
            ],
            assumption: "The 0.60 exposure-anchor weight is a deliberate, editable assumption — it sets how strongly the most-exposed pillar anchors the score. It replaces an earlier multiplicative penalty that could push the result below the most-exposed sector, which overstated fragility.",
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
    observed: `${c.vessels} transit calls/day`,
    series: c.spark || null,
    ref: `${c.baseline}/day · 12-month norm`,
    transform: `1 − ${c.vessels}/${c.baseline} → −${c.drop}%`,
    feeds: "Maritime throughput (largest single driver)",
    assume: "Real IMF PortWatch transit calls (satellite AIS), smoothed to a 7-day average and judged against this strait's own 12-month busy-period norm, never an absolute count. Chokepoint pressure feeds the acute-drag term only — it never moves the structural baseline.",
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
  const drv = (k) => { const d = (RD.headline.live.drivers || []).find((x) => x.k === k); return d ? d.v : 0; };
  const throughDrag = drv("Maritime throughput");
  const residDrag = drv("Residual shock (Guinea)");
  const acuteDrag = (structural.value - live.value);
  const trail = [
    [`Live Stress ${live.value.toFixed(1)}`, `Structural ceiling ${structural.value} − Active load ${acuteDrag.toFixed(1)}`, 0],
    [`Active load ${acuteDrag.toFixed(1)}`, `Maritime throughput (−${throughDrag.toFixed(1)}) + sea state, news, markets & sanctions + residual Guinea shock (−${residDrag.toFixed(1)})`, 1],
    ["Maritime throughput", "IMF PortWatch · " + RD.chokepoints.map((c) => `${({ hormuz: "Hormuz", redsea: "Red Sea", suez: "Suez" })[c.id] || c.name} ${c.vessels}/${c.baseline}`).join(", ") + " — embeds escalation", 2],
    ["Residual shock", "ACLED · Guinea bauxite (settled May 2026, easing) — the only shock not already in transit counts", 2],
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
/* ---------- Real trade-route news (Google News + GDELT) ----------------- */
function TradeRouteNews() {
  const news = (LIVE.real && LIVE.real.news) || RD.convergence._news || null;
  const live = LIVE.real && LIVE.real.status && LIVE.real.status.gdelt === "live";
  const AREAS = [
    { id: "hormuz", label: "Strait of Hormuz" },
    { id: "redsea", label: "Bab-el-Mandeb / Red Sea" },
    { id: "suez", label: "Suez Canal" },
    { id: "general", label: "Global trade disruption" },
  ];
  const fmtDate = (s) => {
    if (!s) return "";
    const m = String(s).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
    if (!m) return "";
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 60) return mins + "m ago";
    if (mins < 1440) return Math.round(mins / 60) + "h ago";
    return Math.round(mins / 1440) + "d ago";
  };
  const band = (sc) => sc >= 0.66 ? "critical" : sc >= 0.33 ? "high" : sc > 0.05 ? "moderate" : "good";
  // pick the area with the most pressure to feature its headlines
  const ranked = AREAS.map((a) => ({ ...a, d: news && news[a.id] })).filter((a) => a.d);
  const featured = ranked.slice().sort((a, b) => (b.d.score || 0) - (a.d.score || 0))[0];

  return (
    <Panel title="Trade-route news monitor" icon="globe" label="GOOGLE NEWS · CLOSURE / CONFLICT COVERAGE" style={{ marginTop: 16 }}
      right={<span style={{ marginLeft: "auto" }}><SourceTag src="gdelt" /></span>}>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 14px", maxWidth: 940 }}>
        With no free real-time vessel feed, <b>news is the early detector for trade-route disruption</b>. We scan world
        media every few minutes; a surge of closure or conflict coverage above each route's normal volume registers as
        <b> news pressure</b> and adds live drag to the score before throughput data would ever confirm it.
      </p>
      {!news ? (
        <div className="helper" style={{ padding: "18px 0" }}>
          Connecting to the news feed… <span className="muted">live trade-route headlines appear here once the news feed is connected.</span>
        </div>
      ) : (
        <div className="grid cols-2" style={{ gridTemplateColumns: "0.85fr 1.15fr", gap: 16, alignItems: "start" }}>
          {/* pressure by route */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span className="label">News pressure by route</span>
            {AREAS.map((a) => {
              const d = news[a.id]; if (!d) return null;
              const pct = Math.round((d.score || 0) * 100);
              const noData = d.vol == null;
              return (
                <div key={a.id} className={`band-${band(d.score || 0)}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 150 }}>{a.label}</span>
                  <div className="bar-track" style={{ flex: 1, height: 6 }}><div className="bar-fill" style={{ width: pct + "%" }}></div></div>
                  <span className="mono" style={{ fontSize: 11.5, minWidth: 76, textAlign: "right", color: noData ? "var(--faint)" : "var(--muted)" }}
                    title={noData ? "This query could not be fetched on the last pull — shown as no data, never as a fake zero." : undefined}>
                    {noData ? "no data" : d.vol + " articles"}</span>
                </div>
              );
            })}
            <div className="helper" style={{ marginTop: 4 }}>Pressure = how far 2-day coverage runs above each route's normal volume (2× normal = full pressure).
              {" "}Checked {RD.sources.gdelt.fresh || "—"} · re-polls every 6 min.</div>
          </div>
          {/* featured headlines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="label">Latest — {featured ? featured.label : ""}</span>
            {featured && featured.d.headlines && featured.d.headlines.length ? featured.d.headlines.map((h, i) => (
              <a key={i} href={h.url} target="_blank" rel="noopener noreferrer" className="news-row">
                <span className="news-dot"></span>
                <span className="news-title">{h.title}</span>
                <span className="news-meta">{h.domain}{fmtDate(h.seendate) ? " · " + fmtDate(h.seendate) : ""}</span>
              </a>
            )) : <div className="helper" style={{ padding: "10px 0" }}>No above-normal coverage on the featured route right now — a quiet feed is itself a signal.</div>}
          </div>
        </div>
      )}
    </Panel>
  );
}

function ThreatsView() {
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Live threats</div>
        <div className="view-sub">Chokepoint activity, converging signals and leading indicators — the fast-moving inputs to the Live Stress score.</div>
      </div>

      <Panel title="Maritime chokepoints" icon="globe" label="TRANSIT CALLS/DAY vs. 12-MONTH NORM" style={{ marginBottom: 16 }}>
        <div className="grid cols-3">
          {RD.chokepoints.map((c) => {
            const pct = Math.round((c.vessels / c.baseline) * 100);
            return (
              <div key={c.id} className={`band-${c.band}`} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", background: "var(--panel-2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "var(--font-display)" }}>{c.name}</span>
                  <BandTag score={c.band === "critical" ? 30 : c.band === "high" ? 50 : c.band === "moderate" ? 67 : 82} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 30, fontWeight: 600 }}>{c.vessels}</span>
                  <span className="muted mono" style={{ fontSize: 13 }}>/ {c.baseline} {c.real ? "norm" : "normal"}</span>
                  <span className="mono down" style={{ marginLeft: "auto", fontSize: 13 }}>−{c.drop}%</span>
                </div>
                <div className="bar-track" style={{ margin: "12px 0 10px", height: 6 }}><div className="bar-fill" style={{ width: pct + "%" }}></div></div>
                <div className="helper">{c.note}</div>
                {c.real && c.asof && (
                  <div className="helper" style={{ marginTop: 6, color: "var(--good)" }}>Real transit calls/day · 7-day avg vs 12-month norm · IMF PortWatch, as of {c.asof}</div>
                )}
                {c.sea && c.sea.wave != null && (
                  <div className="helper" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--good)" }}></span>
                      Sea state <b style={{ color: "var(--ink)" }}>{c.sea.wave.toFixed(1)} m</b>
                      {c.sea.wind != null && <> · wind <b style={{ color: "var(--ink)" }}>{Math.round(c.sea.wind)} kn</b></>}
                    </span>
                    <SourceTag src="meteo" />
                  </div>
                )}
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SourceTag src="ais" />
                  <Fx payload={{
                    kicker: "Chokepoint pressure", title: c.name,
                    text: `Pressure is the drop in daily transits versus this chokepoint's own ${c.real ? "12-month busy-period norm" : "90-day baseline"} of ${c.baseline} transit calls/day. Today: ${c.vessels}/day, a ${c.drop}% fall.`,
                    formula: c.real ? "Pressure  =  1 − (7-day avg transits / 12-month norm)" : "Pressure  =  1 − (today's transits / 90-day baseline)",
                    inputs: [
                      { k: c.real ? "Current (7-day avg)" : "Today", v: c.vessels + " transit calls/day", src: "ais" },
                      { k: c.real ? "12-month norm (90th pct)" : "Baseline", v: c.baseline + " transit calls/day", src: "ais" },
                      c.real ? { k: "Source", v: "IMF PortWatch · satellite AIS · as of " + c.asof } : { k: "Contribution", v: "largest single driver of Live Stress" },
                    ],
                    assumption: c.real
                      ? "Real IMF PortWatch transit calls (satellite AIS on ~90,000 ships), smoothed to a 7-day average and judged against this strait's own 12-month busy-period norm (90th percentile). A sustained collapse still reads as a real drop rather than quietly becoming the new normal."
                      : "A quiet strait and a busy one are judged on their own normal — absolute counts are never compared across chokepoints.",
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
                          { k: "Feeds into", v: "Residual non-maritime severity term of the active load" },
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
                  kicker: "Convergence", title: "Why combined exceeds the sum",
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

      <TradeRouteNews />

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
          This is how the system actually thinks. A shock at a chokepoint draws down the buffers of the imports
          that route through it; as each buffer draws down, the asset it supports comes under load, then the sector, then the
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
  const baseLive = RD.headline.live.value;
  const after = (baseLive + scn.overall).toFixed(1);

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
              <div className="kpi"><span className="kpi-v mono">{baseLive.toFixed(1)}</span><span className="kpi-l">Baseline live stress</span></div>
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
