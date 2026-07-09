/* ============================================================================
   Views, part 1 — Overview, Live signals, Cascade, Scenarios
   ========================================================================== */
const { useState } = React;

/* Per-state conflict bars — a static-friendly viz for the daily conflict feed
   (a time sparkline can't move within a session). Bar height = coverage vs that
   state's own baseline; colour = band. */
function StateBars({ states, w }) {
  const list = (states && states.length) ? states.slice(0, 4) : [];
  if (!list.length) return <span style={{ width: w, display: "inline-block" }}></span>;
  const max = Math.max(1.3, ...list.map((s) => s.ratio));
  return (
    <span style={{ width: w, display: "inline-flex", alignItems: "flex-end", justifyContent: "center", gap: 5, height: 30 }}
      title="Conflict coverage vs each state's own baseline">
      {list.map((s) => (
        <span key={s.c} style={{ flex: "0 0 auto", width: 12, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span className={`band-${s.band}`} style={{ width: "100%", height: Math.max(3, Math.round((s.ratio / max) * 22)), background: "var(--bc)", borderRadius: 1, display: "block" }}></span>
          <span style={{ fontSize: 8, letterSpacing: ".02em", color: "var(--faint)", fontFamily: "var(--font-mono)" }}>{s.c.slice(0, 2).toUpperCase()}</span>
        </span>
      ))}
    </span>
  );
}

/* helper: band by magnitude of a delta */
function magBand(d) {
  const a = Math.abs(d);
  return a >= 25 ? "critical" : a >= 12 ? "high" : a >= 4 ? "moderate" : "good";
}

/* ---------- two-state gas node (contracted floor vs oil-linked marginal) -- */
function gasBasisFx() {
  const g = RD.gasNode || { floor: 1.5, marginal: 12, multiple: 8, brent: 93, shipConst: 0.4 };
  return {
    kicker: "Two-state gas node",
    title: "Gas: contracted floor vs marginal replacement",
    text: "The UAE lives in two gas-price worlds at once. Contracted Dolphin gas is a fixed ~$" + g.floor.toFixed(2) + "/MMBtu floor. The molecule that replaces it if Dolphin is curtailed is sea-borne LNG, priced off oil at ~12.5% of Brent. Losing Dolphin is therefore a price-BASIS flip from contract to oil-linked, a reprice of roughly ≈" + g.multiple.toFixed(1) + "×, not a volume gap against a buffer.",
    formula: "Marginal replacement  =  slope × Brent  +  shipping/regas  =  0.125 × $" + g.brent.toFixed(0) + "  +  $" + g.shipConst.toFixed(2) + "  =  $" + g.marginal.toFixed(2) + " / MMBtu",
    inputs: [
      { k: "Contracted floor (Dolphin)", v: "$" + g.floor.toFixed(2) + " / MMBtu, fixed long-term contract", src: "assumption" },
      { k: "Oil-indexed slope", v: "~12.5% of Brent (plausible 10–15%)", src: "curated" },
      { k: "Brent (live)", v: "$" + g.brent.toFixed(2) + " / bbl", src: "yfinance" },
      { k: "Marginal replacement cost", v: "$" + g.marginal.toFixed(2) + " / MMBtu  ·  ≈" + g.multiple.toFixed(1) + "× the floor" },
    ],
    assumption: "Dolphin's ~$1.30–1.50/MMBtu price is a widely-reported estimate (MEES, MEED, Energy Intelligence); the parties have never published it, so it is tagged as an assumption, not a live feed. The ~12.5% Brent slope is the documented market convention for Qatari oil-indexed LNG. Henry Hub (US gas, ~$3) is deliberately NOT used: it is the wrong price basis for the UAE.",
  };
}
function GasBasisRow({ ind }) {
  const g = RD.gasNode || { floor: 1.5, multiple: 8 };
  return (
    <div className="indi band-moderate">
      <span className="indi-led"></span>
      <div className="indi-name">{ind.name}<br /><span className="u">two-state · contract vs oil-linked</span></div>
      <div style={{ gridColumn: "3 / 6", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span className="pill"><span className="sq" style={{ background: "var(--good)" }}></span>floor ${g.floor.toFixed(2)}</span>
        <Icon name="arrowRight" size={13} style={{ color: "var(--faint)" }} />
        <span className="pill band-high"><span className="sq"></span>marginal {ind.value} · ≈{g.multiple.toFixed(1)}×</span>
      </div>
      <Fx payload={gasBasisFx()} />
      <SourceTag src={ind.src || "curated"} />
    </div>
  );
}

/* ---------- "what changed" strip ---------------------------------------- */
/* ---------- Today's gap + 24h scan (merged live-delta panel) ------------- */
function LiveGap() {
  const s = RD.headline.structural.value;
  const l = RD.headline.live.value;
  const gap = +(s - l).toFixed(1);
  const live = RD.headline.live;
  const hz = RD.chokepoints.find((c) => c.id === "hormuz");
  const brent = RD.indicators.find((i) => i.id === "brent");
  const gasb = RD.indicators.find((i) => i.id === "gasbasis");
  const lsd = RD.trends ? RD.trends.live : null;
  const ofacTotal = RD.sources.ofac && RD.sources.ofac._total;
  const ofacLive = ofacTotal != null;
  const sancDrag = (RD._drags && RD._drags.sanction) || 0;
  const sancRising = sancDrag > 0.05;
  const items = [
    { label: "Live Resilience", v: lsd == null ? "—" : (lsd > 0 ? "+" : "") + lsd, dir: lsd == null ? "flat" : lsd >= 0 ? "up" : "down", note: "change vs 24h ago", src: "ais" },
    { label: "Hormuz", v: "−" + hz.drop + "%", dir: "down", note: hz.vessels + " of " + hz.baseline + " transit calls/day", src: "ais" },
    ofacLive
      ? { label: "OFAC", v: sancRising ? "Rising" : "Stable", dir: sancRising ? "down" : "flat", note: Number(ofacTotal).toLocaleString() + " SDN entities · " + (sancRising ? "new listings adding load" : "no new listings, no load"), src: "ofac" }
      : { label: "OFAC", v: "—", dir: "flat", note: "SDN entity count · feed offline", src: "ofac" },
    { label: "Brent", v: (brent.delta > 0 ? "+" : "") + brent.delta + "%", dir: brent.delta >= 0 ? "up" : "down", note: brent.value + " / barrel", src: "yfinance" },
    { label: "Gas basis", v: gasb.value, dir: "flat", note: "marginal LNG vs $" + (RD.gasNode ? RD.gasNode.floor.toFixed(2) : "1.50") + " floor", src: "curated" },
  ];
  return (
    <Panel title="Today's gap" icon="spark"
      right={<span className="helper" style={{ marginLeft: "auto" }}>{gap} pts of live load below the {s} ceiling, clears as it eases</span>}>
      <div className="gapbar-track" style={{ marginTop: 30, marginBottom: 46 }}>
        <div className="gapbar-live" style={{ width: l + "%" }}></div>
        <div className="gapbar-gap" style={{ left: l + "%", width: (s - l) + "%" }}></div>
        <div className="gapbar-ceil" style={{ left: s + "%" }}><span>ceiling {s}</span></div>
        <div className="gapbar-livemark" style={{ left: l + "%" }}><span>live {l}</span></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
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

/* ---------- Driver attribution: what's pulling the score down, by feed ---- */
function DriverTrace() {
  const drivers = (RD.headline.live.drivers || []).slice().sort((a, b) => (b.real - a.real) || (b.v - a.v));
  const maxV = Math.max(0.1, ...drivers.map((d) => d.v));
  const liveN = drivers.filter((d) => d.real).length;
  if (!drivers.length) return null;
  // two states: a connected live feed (LIVE), or a simulated stand-in awaiting
  // its feed (SIM — never dressed up as live).
  const stateOf = (d) => d.real ? "live" : "sim";
  const META = {
    live:  { badge: "LIVE",  cls: "on",    sub: "live feed" },
    sim:   { badge: "SIM",   cls: "",      sub: "modelled · not on a live feed" },
  };
  return (
    <Panel title="What's moving the score right now" icon="book"
      right={<span className="helper" style={{ marginLeft: "auto" }}>{liveN} of {drivers.length} drivers on a connected live feed</span>}>
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
        Feeds: PortWatch (AIS) · Open-Meteo · Google News · Brent · OFAC/OpenSanctions. {liveN} of {drivers.length} drivers are on a connected live feed right now{liveN < drivers.length ? ", the rest are clearly badged SIM and run on the model" : ""}. A live driver reading near zero is quiet, not missing.
      </div>
    </Panel>
  );
}

/* ---------- Capacities: Absorb · Recover · Adapt ------------------------- */
function Capacities() {
  LIVE.useLiveTick();
  const cap = RD.capacity;
  const absorb = cap.absorb, recover = cap.recover, adapt = cap.adapt, capacity = cap.blend;
  const resourcing = cap.resourcing, subPenalty = cap.subPenalty;
  const sectorsWithPlay = cap.planCount;
  const exposed = RD.headline.structural.exposedSector;
  const standing = RD.headline.structural.value;

  const tiles = [
    { key: "Absorb", n: absorb, q: "How big a hit can we take?",
      sub: "Reserves & buffers vs a 90-day benchmark, weighted by how much each import matters",
      fx: { kicker: "Capacity · Absorb", title: "Absorb: shock-absorbing buffers",
        text: "How much disruption the system soaks up before function degrades: the depth of reserves across the " + RD.precursors.length + " critical imports, weighted by national consequence. Maps to the 'absorptive capacity' shared by the OECD and IPCC resilience frameworks.",
        formula: "Absorb  =  Σ(consequence × min(buffer / 90, 1))  /  Σ consequence",
        inputs: (() => {
          const below = RD.precursors.filter((p) => p.buffer < 90)
            .sort((a, b) => (a.consequence * Math.min(a.buffer / 90, 1)) - (b.consequence * Math.min(b.buffer / 90, 1)) || b.consequence - a.consequence);
          const full = RD.precursors.length - below.length;
          return [
            { k: "Benchmark", v: "90 days of cover = full credit" },
            ...below.map((p) => ({ k: p.name, v: p.buffer + "-day buffer → " + (p.buffer / 90).toFixed(2) + " cover · weight " + p.consequence.toFixed(2) })),
            { k: full + " remaining imports", v: "90+ day buffers → full cover" },
            { k: "Weighted result", v: absorb + " / 100" },
          ];
        })(),
        assumption: "The 90-day benchmark (one quarter of cover) is an editable goalpost.",
        links: [{ label: "Every import's buffer & provenance · Dependencies", view: "dependencies" }],
      } },
    { key: "Recover", n: recover, q: "How fast can we bounce back?",
      sub: "Sovereign firepower to fund recovery + how easily critical inputs can be re-sourced",
      fx: { kicker: "Capacity · Recover", title: "Recover: bounce-back speed",
        text: "How quickly function is restored after a hit: a blend of financial firepower (sovereign capital that can be redeployed fast) and how substitutable the critical imports are. Deep pockets help, but money cannot compress a 120-day reorder lead time, which is why recovery, not absorption, is the binding capacity here.",
        formula: "Recover  =  0.5 × financial firepower  +  0.5 × re-sourcing ease",
        inputs: [
          { k: "Financial firepower", v: "100 × min($" + cap.finDeployW + "bn liquidity-weighted deployable / $" + cap.finBench + "bn stress benchmark, 1) = " + cap.financial, src: "curated" },
          { k: "— deployable capital", v: "per-fund deployable from the Control layer's sovereign table (~$2.1T total AUM), × liquidity factor High 1.0 / Medium 0.6 / Low 0.3" },
          { k: "— stress benchmark", v: "$" + cap.finBench + "bn ≈ 18 months of the national import bill (est.), an editable goalpost" },
          { k: "Re-sourcing ease", v: "100 − consequence-weighted substitution-difficulty (" + subPenalty + ") = " + resourcing },
          { k: "Blend (0.5 / 0.5)", v: recover + " / 100" },
        ],
        assumption: "Equal 0.5/0.5 weighting is an editable judgement. Maps to 'rapidity / resourcefulness' in the resilience-engineering 4 R's (Bruneau et al., 2003, Earthquake Spectra 19(4), robustness, redundancy, resourcefulness, rapidity).",
        links: [{ label: "The sovereign table behind the firepower score · Control layer", view: "control" }],
      } },
    { key: "Adapt", n: adapt, q: "Are we cutting future risk?",
      sub: "Depth × speed of each sector's structural plan, weighted by how much the sector matters; commit plans in Sector responses",
      fx: { kicker: "Capacity · Adapt", title: "Adapt: bounce-forward capacity",
        text: "Whether the system can structurally reduce its exposure for next time (‘bounce forward’, not just back). Having a plan is not enough: each sector's play is scored on DEPTH (how many structural ceiling points its deepest tier would add, 2.5 pts = full credit) and SPEED (how fast the first structural effect lands, 24 months or less = full credit), blended 0.6/0.4 and weighted by the sector's total import consequence. A sector with no structural play scores zero. This is adaptive CAPACITY; realized adaptation tracks what you actually commit in the Response & pre-mortem view.",
        formula: "Adapt  =  Σ( sector weight × (0.6 × depth + 0.4 × speed) )  /  Σ weight",
        inputs: [
          ...RD.capacity.adaptDetail.map((d) => ({ k: d.name, v: d.score === 0 ? "no structural play → 0" : "depth " + d.depth + " · speed " + d.speed + " → " + d.score + " · weight " + d.w })),
          { k: "Weighted result", v: adapt + " / 100" },
        ],
        assumption: "Depth and speed come from the response catalog's own tiers (deepest-tier ceiling points; days to the first ceiling-raising tier). The 2.5-pt depth and 24-month speed goalposts are editable judgements. Counts capacity (credible plans), not realized change, maps to the 'bounce forward' / transformative-capacity split of the Index of Future Readiness.",
        links: [{ label: "The plans being scored · Sector responses", view: "act" }],
      } },
  ];

  return (
    <Panel title="What Structural Resilience is made of" icon="layers"
      right={<span className="helper" style={{ marginLeft: "auto" }}>Absorb · Recover · Adapt</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {tiles.map((t) => {
          const b = RD.band(t.n);
          return (
            <div key={t.key} className={`band-${b.key}`} style={{ padding: "15px 16px", border: "1px solid var(--line)", borderLeft: "3px solid var(--bc)", borderRadius: "var(--radius-lg)", background: "var(--panel-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="label" style={{ color: "var(--bc)" }}>{t.key}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--faint)", marginLeft: 2 }}>{b.label}</span>
                <span style={{ marginLeft: "auto" }}><Fx payload={t.fx} /></span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1 }}>{t.n}</span>
                <span className="mono" style={{ fontSize: 13, color: "var(--faint)" }}>/100</span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 9 }}>{t.q}</div>
              <div className="bar-track" style={{ height: 6, margin: "9px 0 8px" }}><div className="bar-fill" style={{ width: t.n + "%" }}></div></div>
              <div className="helper">{t.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "11px 14px", background: "color-mix(in srgb,var(--accent) 6%,transparent)", border: "1px solid color-mix(in srgb,var(--accent) 22%,transparent)", borderRadius: "var(--radius)" }}>
        <Icon name="layers" size={15} style={{ color: "var(--accent)", flex: "0 0 auto" }} />
        <span className="mono" style={{ fontSize: 12.5, color: "var(--ink)" }}>
          Structural Resilience = 0.60 × most-exposed ({exposed.name} {exposed.score.toFixed(1)}) + 0.40 × capacity ({capacity}) = {standing.toFixed(1)}
        </span>
        <span style={{ marginLeft: "auto" }}>
          <Fx payload={{
            kicker: "Putting it together", title: "Capacity: measured against exposure",
            text: "Following the vulnerability-vs-resilience logic used for small open economies (Briguglio): CAPACITY (what you can Absorb, how fast you Recover, your ability to Adapt) is set against EXPOSURE, the most-exposed sector. The result is non-compensatory: strong capacity can't fully paper over a concentrated weak point, so the most-exposed sector anchors the score.",
            formula: "Structural Resilience  =  0.60 × most-exposed sector  +  0.40 × capacity blend",
            inputs: [
              { k: "Exposure (weak link)", v: exposed.name + " sector · " + exposed.score.toFixed(1) },
              { k: "Capacity blend", v: "(Absorb " + absorb + " + Recover " + recover + " + Adapt " + adapt + ") / 3 = " + capacity },
              { k: "Anchored result", v: "0.60×" + exposed.score.toFixed(1) + " + 0.40×" + capacity + " = " + standing.toFixed(1) },
            ],
            assumption: "The 0.60 exposure-anchor weight is editable. Capacity is equal-weighted across the three sub-capacities; exposure uses the single most-exposed sector (weakest-link, non-compensatory).",
          }} />
        </span>
      </div>
    </Panel>
  );
}

/* ---------- Overview ----------------------------------------------------- */
function OverviewView({ go }) {
  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Gap is the signal</div>
        <div className="view-sub">
          Two readings of one system: <b>Structural Resilience</b> is the ceiling; <b>Live Resilience</b> is that ceiling minus today's active load. The <b>gap</b> between them is the signal.
        </div>
        <button className="newhere-link" onClick={() => go("methodology")}>
          New here? How it works <Icon name="arrowRight" size={13} />
        </button>
      </div>

      <div className="hero">
        <ScoreCard d={RD.headline.structural} />
        <ScoreCard d={RD.headline.live} />
      </div>

      <Capacities />

      <div style={{ marginTop: 16 }}><LiveGap /></div>

      <div style={{ marginTop: 16 }}><DriverTrace /></div>

      <Panel title="Sector resilience" icon="gauge"
        right={<span className="helper" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          Most-exposed sector sets the floor <Fx payload={{
            kicker: "How sector scores work", title: "How each sector score is built",
            text: "Each sector scores 100 minus its anchored fragility. Its ★ anchor import, the one with the highest DRI × consequence, carries 60%; the consequence-weighted average of all its imports carries the other 40%. The same weakest-link rule runs one level up: the most-exposed sector anchors 60% of national Structural Resilience, blended with capacity, so one concentrated dependency always stays visible. Open any card for its own imports and math.",
            formula: "Sector = 100 − (0.6 × anchor DRI + 0.4 × consequence-weighted mean)     ·     Structural = 0.60 × most-exposed sector + 0.40 × capacity",
            inputs: [
              { k: "Most-exposed sector", v: RD.headline.structural.exposedSector.name + " · " + RD.headline.structural.exposedSector.score.toFixed(1) },
              { k: "Capacity (Absorb·Recover·Adapt)", v: "" + RD.capacity.blend },
              { k: "Anchored result", v: "= " + RD.headline.structural.value.toFixed(1) },
            ],
            assumption: "The 0.60 anchor weights are editable. Change any import's DRI or consequence on Dependencies and every sector score, and the national headline, recompute.",
          }} />
        </span>}>
        <div className="sector-grid">
          {RD.sectors.slice().sort((a, b) => a.score - b.score).map((s) => <SectorCard key={s.id} s={s} onOpen={(sec) => go("dependencies", { sector: sec.id })} />)}
        </div>
      </Panel>

      <div className="grid cols-2" style={{ marginTop: 16, gridTemplateColumns: "1.5fr 1fr" }}>
        {/* cascade CTA */}
        <section className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <header className="panel-h"><Icon name="cascade" size={15} style={{ color: "var(--muted)" }} />
            <span className="ttl">How a shock spreads</span></header>
          <div className="panel-b" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              The model's core idea: a single disruption doesn't stay put. Watch a Hormuz closure travel from
              chokepoint to critical import to asset to sector to the national score, day by day, every step explained.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {["Trigger", "Import", "Asset", "Sector", "National"].map((t, i) => (
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
        <Panel title="Live signals" icon="threat"
          right={<button className="exp" style={{ marginLeft: "auto" }} onClick={() => go("threats")}>All signals →</button>}>
          {RD.chokepoints.map((c) => (
            <div className={`indi compact band-${c.band}`} key={c.id}>
              <span className="indi-led"></span>
              <div className="indi-name">{c.name} <span className="u">transit calls/day</span></div>
              <Sparkline data={c.spark || []} band={c.band} w={70} />
              <div className="indi-val mono">−{c.drop}%</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Live signals ------------------------------------------------ */
function ProvenanceLedger() {
  const live = RD.headline.live;
  const choke = RD.chokepoints.map((c) => ({
    signal: c.name, src: "ais",
    observed: `${c.vessels} transit calls/day`,
    series: c.spark || null,
    ref: `${c.baseline}/day · 12-month norm`,
    transform: `1 − ${c.vessels}/${c.baseline} → −${c.drop}%`,
    feeds: "Maritime throughput (typically the largest driver)",
    assume: "Real IMF PortWatch transit calls (satellite AIS), smoothed to a 7-day average and judged against this strait's own 12-month busy-period norm, never an absolute count. Chokepoint pressure feeds the acute-drag term only, it never moves the structural baseline. Concurrent maritime shocks (Hormuz, Red Sea) are counted once here, through the measured throughput drop, never stacked or added a second time.",
  }));
  // Non-maritime shocks feed the ledger when active; none are live today.
  const shk = RD.shocks.filter((s) => s.id !== "hormuz" && s.id !== "redsea").map((s) => ({
    signal: s.name, src: s.src,
    observed: `event · ${s.when}`,
    series: null, note: s.note, evidence: s.evidence,
    ref: "severity rubric (0 to −35)",
    transform: `${s.impact} pts`,
    feeds: "Non-maritime shock severity",
    assume: "Severity is a curated, editable judgement from the observed event, not a measured quantity.",
  }));
  const DMETA = {
    "Sea state": { ref: "drag begins above 1.2 m wave", feeds: "Sea-state drag", assume: "Open-Meteo wave height & wind on the chokepoint approaches; adds live drag only above the 1.2 m threshold." },
    "Trade-route news": { ref: "coverage vs each route's normal volume", feeds: "Trade-route news drag", assume: "Above-normal closure / conflict coverage on Hormuz, Red Sea and Suez (Google News, GDELT fallback). A surge over baseline, not a single headline." },
    "Partner-supply news": { ref: "adverse coverage vs each partner's normal", feeds: "Partner-supply drag", assume: "Adverse-only coverage of single/few-source partners (Qatar, Taiwan, Kazakhstan, China, India, Brazil/Argentina feed grain), scaled by the highest-consequence import riding on each partner and capped." },
    "Energy-market stress": { ref: "Brent > $96 / marginal LNG > $14", feeds: "Energy-market drag", assume: "Brent crude and the Brent-linked marginal LNG replacement cost; adds drag only above the stress marks." },
    "Counterpart / sanctions": { ref: "total SDN entities vs session baseline", feeds: "Counterpart / sanctions drag", assume: "OFAC SDN total entity count (OpenSanctions mirror). A rise since the session's first reading adds counterpart drag (÷200, capped at 0.5). It does not filter to UAE-specific designations, that finer signal isn't wired." },
  };
  const extra = (live.drivers || []).filter((d) => DMETA[d.k]).map((d) => ({
    signal: d.k, src: d.src,
    observed: d.read || "—", series: null,
    ref: DMETA[d.k].ref,
    transform: `−${(d.v || 0).toFixed(1)} pts`,
    feeds: DMETA[d.k].feeds,
    assume: DMETA[d.k].assume,
  }));
  const cf = RD.indicators.find((i) => i.id === "conflict");
  const conflictRow = (RD.sources.acled && RD.sources.acled._ts && cf && cf.states && cf.states.length) ? [{
    signal: "Conflict coverage", src: "acled",
    observed: cf.states.map((s) => s.c + " " + Math.round(s.ratio * 100) + "% of norm").join(" · "),
    series: null,
    ref: "each state's own 30-day baseline",
    transform: "context only, not a Live-score driver",
    feeds: "Counterpart-risk context (Dependencies)",
    assume: "GDELT 30-day conflict-coded coverage on the states behind exposed dependencies (Iran, Yemen, Sudan, Russia), each judged against its own baseline. It informs counterpart risk on Dependencies and the Conflict-intensity indicator; it does not enter the Live Resilience score.",
  }] : [];
  const rows = [...choke, ...extra, ...conflictRow, ...shk];
  const openRow = (r) => {
    const sm = RD.sources[r.src];
    window.__explain && window.__explain({
      kicker: "Observed raw & assumptions",
      title: r.signal,
      text: `Feed: ${sm.full}. The value below is the raw figure the feed reported; the transform is applied before it reaches the Live Resilience score.`,
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
  return (
    <Panel title="Source & provenance ledger" icon="book" label="EVERY NUMBER, TRACEABLE" style={{ marginTop: 16 }}>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 14px", maxWidth: 940 }}>
        The integrity of the live score rests on traceability. <b>Click any row</b> to open its observed raw series and the
        exact assumptions applied before it reaches the score, the public source URL is listed inside each panel. This is
        the complete audit trail behind <b>Live Resilience {live.value.toFixed(1)}</b>, every live driver that moves the score, with its
        raw value and the transform applied before it lands. Drivers contributing ~0 today are listed too: a quiet input is still part of the calculation. The GDELT conflict feed is listed as well, it informs counterpart risk rather than the live score, so it carries no point transform.
      </p>
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
    { id: "qatar", label: "Qatar, piped gas" },
    { id: "taiwan", label: "Taiwan, chips" },
    { id: "kazakhstan", label: "Kazakhstan, uranium (fuel chain)" },
    { id: "china", label: "China, solar / battery / devices" },
    { id: "india", label: "India, pharma APIs" },
    { id: "feedgrain", label: "Brazil / Argentina, feed grain" },
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
    <Panel title="Supply & trade-route news monitor" icon="globe" label="GOOGLE NEWS · CLOSURE, CONFLICT & PARTNER-SUPPLY" style={{ marginTop: 16 }}
      right={<span style={{ marginLeft: "auto" }}><SourceTag src="gdelt" /></span>}>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 14px", maxWidth: 940 }}>
        Vessel data (PortWatch) updates weekly, so <b>news is the early detector between updates</b>. We scan world
        media every few minutes across two fronts: <b>trade-route closures</b> (Hormuz, Red Sea, Suez) and <b>partner-supply
        shocks</b>, led by the single- and few-source dependencies (Qatar gas, Taiwan chips, Kazakhstan fuel), then China,
        India and the Brazil/Argentina feed-grain belt. Partner lanes count <b>only adverse coverage</b>: a "deal signed" doesn't add pressure, a halt or export ban does.
        A surge above a lane's normal volume registers as <b>news pressure</b> and adds live drag before throughput or trade data would confirm it.
      </p>
      {!news ? (
        <div className="helper" style={{ padding: "18px 0" }}>
          Connecting to the news feed… <span className="muted">live trade-route headlines appear here once the news feed is connected.</span>
        </div>
      ) : (
        <div className="grid cols-2" style={{ gridTemplateColumns: "0.85fr 1.15fr", gap: 16, alignItems: "start" }}>
          {/* pressure by route */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span className="label">News pressure by route & partner</span>
            {AREAS.map((a) => {
              const d = news[a.id]; if (!d) return null;
              const pct = Math.round((d.score || 0) * 100);
              const noData = d.vol == null;
              return (
                <div key={a.id} className={`band-${band(d.score || 0)}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 150 }}>{a.label}</span>
                  <div className="bar-track" style={{ flex: 1, height: 6 }}><div className="bar-fill" style={{ width: pct + "%" }}></div></div>
                  <span className="mono" style={{ fontSize: 11.5, minWidth: 76, textAlign: "right", color: noData ? "var(--faint)" : "var(--muted)" }}
                    title={noData ? "This query could not be fetched on the last pull, shown as no data, never as a fake zero." : undefined}>
                    {noData ? "no data" : d.vol + " articles"}</span>
                </div>
              );
            })}
            <div className="helper" style={{ marginTop: 4 }}>Pressure = how far 2-day coverage runs above each route's normal volume (2× normal = full pressure).
              {" "}Checked {RD.sources.gdelt.fresh || "—"} · re-polls every 6 min.</div>
          </div>
          {/* featured headlines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="label">Latest, {featured ? featured.label : ""}</span>
            {featured && featured.d.headlines && featured.d.headlines.length ? featured.d.headlines.map((h, i) => (
              <a key={i} href={h.url} target="_blank" rel="noopener noreferrer" className="news-row">
                <span className="news-dot"></span>
                <span className="news-title">{h.title}</span>
                <span className="news-meta">{h.domain}{fmtDate(h.seendate) ? " · " + fmtDate(h.seendate) : ""}</span>
              </a>
            )) : <div className="helper" style={{ padding: "10px 0" }}>No above-normal coverage on the featured route right now, a quiet feed is itself a signal.</div>}
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
        <div className="view-title">Live signals</div>
        <div className="view-sub">Chokepoint transit activity, trade-route news pressure, and the full audit trail behind the Live Resilience score.</div>
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
                      c.real ? { k: "Source", v: "IMF PortWatch · satellite AIS · as of " + c.asof } : { k: "Contribution", v: "typically the largest driver of Live Resilience" },
                    ],
                    assumption: c.real
                      ? "Real IMF PortWatch transit calls (satellite AIS on ~90,000 ships), smoothed to a 7-day average and judged against this strait's own 12-month busy-period norm (90th percentile). A sustained collapse still reads as a real drop rather than quietly becoming the new normal."
                      : "A quiet strait and a busy one are judged on their own normal. Absolute counts are never compared across chokepoints.",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

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
        <div className="view-title">Cascade engine</div>
        <div className="view-sub">
          Unmitigated exposure by default, no response staged. Toggle to see the same shock absorbed by the
          reroutes and reserves staged in the Sector responses section.
        </div>
      </div>
      <Panel title="Hormuz closure, unmitigated exposure vs. responses staged" icon="cascade" label="ILLUSTRATIVE TRACE · 150-DAY WINDOW">
        <CascadeDiagram />
      </Panel>

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        {[
          { n: "1", t: "Buffers, not bangs", d: "Nothing fails instantly. Each import carries a stated buffer in days; the shock simply starts the clock." },
          { n: "2", t: "Consequence-weighted", d: (() => { const c = (id) => { const p = RD.precursors.find((x) => x.id === id); return p ? p.consequence.toFixed(2) : "?"; }; return `RO membranes (${c("ro")}) and the gas balancing input (${c("gas")}) propagate hard; gold doré (${c("golddore")}) barely moves the system.`; })() },
          { n: "3", t: "Non-compensatory end", d: "Once Water turns critical, Live Resilience is capped, strong Finance and Food cannot buy it back." },
          { n: "4", t: "Unmitigated vs. staged", d: "The default trace assumes nothing is done. Toggle 'Stage responses' to see the same shock absorbed by reroutes and reserves, the mechanism behind a real closure producing limited visible effect." },
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
/* Resolve a scenario watch-item to a live, sourced signal row. */
function resolveWatch(w) {
  if (w.k === "choke") {
    const c = RD.chokepoints.find((x) => x.id === w.id);
    if (!c) return null;
    return { label: c.name + ", transit calls", value: c.vessels + "/day", ref: "vs " + c.baseline + " norm · −" + c.drop + "%", band: c.band, src: "ais", live: true };
  }
  if (w.k === "news") {
    const labelMap = { hormuz: "Hormuz news pressure", redsea: "Red Sea news pressure", suez: "Suez news pressure", general: "Global trade-disruption news" };
    const n = LIVE.real && LIVE.real.news && LIVE.real.news[w.id];
    if (!n) return { label: labelMap[w.id] || "News pressure", value: "connecting…", ref: "Google News · re-polls every 6 min", band: "good", src: "gdelt", live: false };
    const pct = Math.round((n.score || 0) * 100);
    const b = pct >= 66 ? "critical" : pct >= 33 ? "high" : pct > 5 ? "moderate" : "good";
    return { label: labelMap[w.id] || "News pressure", value: n.vol != null ? n.vol + " articles" : "no data", ref: pct + "% of full pressure · vs route's normal volume", band: b, src: "gdelt", live: true };
  }
  if (w.k === "sea") {
    const nameMap = { hormuz: "Hormuz sea state", redsea: "Bab-el-Mandeb sea state" };
    const s = LIVE.real && LIVE.real.meteo && LIVE.real.meteo.sea && LIVE.real.meteo.sea[w.id];
    if (!s || s.wave == null) return { label: nameMap[w.id] || "Sea state", value: "—", ref: "Open-Meteo · transit drag starts >1.2 m", band: "good", src: "meteo", live: false };
    const b = s.wave > 2.5 ? "high" : s.wave > 1.2 ? "moderate" : "good";
    return { label: nameMap[w.id] || "Sea state", value: s.wave.toFixed(1) + " m" + (s.wind != null ? " · " + Math.round(s.wind) + " kn" : ""), ref: "transit drag starts >1.2 m", band: b, src: "meteo", live: true };
  }
  if (w.k === "acled") {
    const a = LIVE.conflictFor(w.c);
    if (!a || !a.tracked) return { label: w.c + ", conflict coverage", value: a && a.live ? "at baseline" : "connecting…", ref: "GDELT · conflict-coded news, 30 days · vs this state's norm", band: "good", src: "acled", live: !!(a && a.live) };
    return { label: a.country + ", conflict coverage", value: a.events.toLocaleString() + " articles/30d", ref: "GDELT · conflict-coded news vs this state's baseline", band: a.band, src: "acled", live: true };
  }
  if (w.k === "ofac") {
    const total = RD.sources.ofac && RD.sources.ofac._total;
    const liveOk = total != null;
    return { label: "OFAC SDN list", value: liveOk ? Number(total).toLocaleString() + " entities" : "connecting…", ref: "US Treasury sanctions list · a rise since the session baseline adds counterpart drag", band: "good", src: "ofac", live: liveOk };
  }
  if (w.k === "market") {
    const m = RD.indicators.find((x) => x.id === w.id);
    if (!m) return null;
    return { label: m.name, value: m.value + (m.unit ? " " + m.unit : ""), ref: m.short || m.note || "live market feed", band: m.status || "good", src: m.src, live: true, fx: w.id === "gasbasis" ? gasBasisFx() : m.fx };
  }
  if (w.k === "note") return { note: true, label: w.t };
  return null;
}

function ScenariosView() {
  LIVE.useLiveTick();
  const [pick, setPick] = useState("combined");
  const scn = RD.scenarios.find((s) => s.id === pick);
  const baseLive = RD.headline.live.value;
  // A 0–100 resilience score can't go negative. Most scenarios land above 0;
  // the synthetic 4× "Combined Maximum" applies more stress than the entire
  // live score remaining, so the index bottoms out at 0 (systemic failure).
  const rawAfter = baseLive + scn.overall;
  const afterN = Math.max(0, rawAfter);
  const after = afterN.toFixed(1);
  // Net change = the ACTUAL change in the score (clamped), so 45.8 → 0.0 reads
  // as −45.8, never the raw −58 that would imply an impossible negative score.
  const netChange = +(afterN - baseLive).toFixed(1);
  const floored = rawAfter < 0;

  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Scenario simulator</div>
        <div className="view-sub">Pre-built stress tests. Select one to see how each sector and the national score respond, and what would warn you first.</div>
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
              <div className="kpi"><span className="kpi-v mono">{baseLive.toFixed(1)}</span><span className="kpi-l">Baseline live resilience</span></div>
              <Icon name="arrowRight" size={20} style={{ color: "var(--faint)" }} />
              <div className="kpi"><span className="kpi-v mono" style={{ color: scn.overall < 0 ? "var(--crit)" : "var(--ink)" }}>{after}</span><span className="kpi-l">Under this scenario</span></div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: netChange < 0 ? "var(--crit)" : "var(--muted)" }}>{netChange === 0 ? "—" : netChange}</div>
                <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>net change
                  {(() => { const ds = Object.values(scn.deltas); const worst = Math.min(...ds); const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
                    return <Fx payload={{
                      kicker: "Scenario impact · computed", title: "How the national impact is derived",
                      text: "The scenario's national impact is computed from its seven sector deltas with the same non-compensatory anchoring as the structural score: the worst-hit sector dominates, and the mean across all sectors fills in the rest. The result is then applied to today's live score (floored at 0).",
                      formula: "Overall  =  0.60 × worst-hit sector delta  +  0.40 × mean sector delta",
                      inputs: [
                        { k: "Worst-hit sector delta", v: worst.toFixed(1) + " pts" },
                        { k: "Mean sector delta (7 sectors)", v: mean.toFixed(1) + " pts" },
                        { k: "Overall", v: "0.60×" + worst.toFixed(1) + " + 0.40×" + mean.toFixed(1) + " = " + scn.overall },
                        { k: "Applied to today's score", v: baseLive.toFixed(1) + " → " + after },
                      ],
                      assumption: "Sector deltas are curated stress judgements per scenario (Combined compounds its two parents element-wise: the worse shock + 0.6 × the lesser; Combined Maximum is a hand-authored worst-case vector). The 0.60 anchor mirrors the structural formula.",
                      links: [
                        { label: "Watch this unfold day by day · Cascade", view: "cascade" },
                        { label: "Responses that blunt it · Sector responses", view: "act" },
                      ],
                    }} />; })()}
                </div>
              </div>
            </div>
            {floored && (
              <div className="helper" style={{ margin: "-6px 0 16px", padding: "9px 12px", borderRadius: "var(--radius)", background: "color-mix(in srgb,var(--crit) 8%,transparent)", border: "1px solid color-mix(in srgb,var(--crit) 22%,transparent)", lineHeight: 1.5 }}>
                <b>Why 0.0?</b> This stress test applies {scn.overall} points, more than the {baseLive.toFixed(1)} of live score remaining, so the index bottoms out at 0. A 0–100 resilience score can&#8217;t go negative; reaching 0 represents systemic failure across every sector at once, not a precise value.
              </div>
            )}
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

          <Panel title="Trigger & early warning" icon="alert"
            label={scn.id === "baseline" ? "CALM-DAY REFERENCE" : "LIVE SIGNALS TO WATCH"}>
            <div style={{ marginBottom: 14 }}>
              <span className="label">What sets it off</span>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: "5px 0 0", color: "var(--ink)" }}>{scn.trigger}</p>
            </div>
            {scn.watch && scn.watch.length ? (
              <>
                <span className="label">What would warn us first</span>
                <div style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
                  {scn.watch.map((w, i) => {
                    const r = resolveWatch(w);
                    if (!r) return null;
                    if (r.note) return <div key={i} className="helper" style={{ padding: "9px 0 9px 8px", borderBottom: "1px solid var(--line)" }}>{r.label}</div>;
                    return (
                      <div className={`band-${r.band}`} key={i} style={{ padding: "10px 0 10px 10px", borderBottom: "1px solid var(--line)", borderLeft: "2px solid var(--bc)" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>{r.label}{r.fx ? <Fx payload={r.fx} /> : null}</span>
                          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: r.live ? "var(--bc)" : "var(--faint)", marginLeft: "auto", whiteSpace: "nowrap" }}>{r.value}</span>
                          <SourceTag src={r.src} />
                        </div>
                        <div className="helper" style={{ marginTop: 3, lineHeight: 1.5 }}>{r.ref}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="helper" style={{ marginTop: 10 }}>
                  These are the live, sourced signals that move <i>before</i> the score does. The system does not assign a probability to the scenario itself, it shows what to monitor and how hot each signal is right now.
                </div>
              </>
            ) : (
              <div className="helper" style={{ padding: "4px 0" }}>No stress applied, so nothing is elevated. Select a scenario to see the live signals that would warn of it first.</div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OverviewView, ThreatsView, CascadeView, ScenariosView, magBand });
