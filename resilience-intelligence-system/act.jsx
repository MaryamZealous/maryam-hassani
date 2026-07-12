/* ============================================================================
   ACT view — Sector responses, as grounded implementation briefs.
   Each response is a sited, costed, partner-named plan anchored to a real
   precedent. The lever is a SCOPE DECISION between real tiers, not a slider.
   Every response still carries a pre-mortem.
   ========================================================================== */
const { useState, useMemo } = React;

const LK_BAND = { High: "high", Medium: "moderate", Low: "good" };
const INPUT_BAND = { imported: "high", partial: "moderate", domestic: "good" };

/* ---- Reading-the-tags legend ------------------------------------------- */
function TagLegend() {
  return (
    <Panel title="Reading the tags" icon="fx">
      <div className="act-legend">
        <div className="act-legend-row">
          <span className="act-eff live">LIVE</span>
          <span>Recovers <b>today's score</b> now, but the underlying weakness remains.</span>
        </div>
        <div className="act-legend-row">
          <span className="act-eff ceiling">CEILING</span>
          <span>Raises the <b>long-term ceiling</b>, the best score the country can reach.</span>
        </div>
        <div className="act-legend-row">
          <span className="act-eff ceiling">LIVE+CEILING</span>
          <span>Does both, some relief now, plus a permanently higher ceiling.</span>
        </div>
      </div>
    </Panel>
  );
}

/* ---- National posture summary (updates as plays are staged) ------------ */
function Posture({ staged, evalById }) {
  const liveBase = RD.headline.live.value;
  const ceilBase = RD.headline.structural.value;
  let addLive = 0, addCeil = 0, cost = 0, firstDays = Infinity, fullDays = 0;
  staged.forEach((id) => {
    const r = evalById(id);
    addLive += r.live; addCeil += r.ceil; cost += r.cost;
    if (r.days < firstDays) { firstDays = r.days; }
    fullDays = Math.max(fullDays, r.days);
  });
  const ceilNew = +(ceilBase + addCeil).toFixed(1);
  const liveNew = +Math.min(ceilNew, liveBase + addLive).toFixed(1);
  const liveB = RD.band(liveNew), n = staged.size;
  const gap = +(ceilNew - liveNew).toFixed(1);
  return (
    <div className="act-posture" style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg)", boxShadow: "0 6px 14px -10px rgba(0,0,0,0.25)" }}>
      <div className="act-posture-scores">
        <div className="act-pscore">
          <span className="label">Live resilience now</span>
          <span className="act-pnum mono">{liveBase.toFixed(1)}</span>
        </div>
        <Icon name="arrowRight" size={20} style={{ color: "var(--faint)", flex: "0 0 auto", marginTop: 24 }} />
        <div className={`act-pscore band-${liveB.key}`}>
          <span className="label">With {n} staged</span>
          <span className="act-pnum mono" style={{ color: n ? "var(--bc)" : "var(--ink)" }}>{liveNew.toFixed(1)}</span>
          {n > 0 && <span className="act-pdelta mono">{[addLive > 0 ? "+" + (liveNew - liveBase).toFixed(1) + " live" : null, addCeil > 0 ? "+" + addCeil.toFixed(1) + " ceiling" : null].filter(Boolean).join(" · ") || "—"}</span>}
        </div>
      </div>
      <div className="act-posture-meta">
        <div className="act-pmeta"><span className="label">Capital committed</span><span className="mono">{n ? ACT.fmtAED(cost) : "—"}</span></div>
        {n && firstDays !== fullDays ? (
          <React.Fragment>
            <div className="act-pmeta"><span className="label">First effect</span><span className="mono">{ACT.fmtDays(firstDays)}</span></div>
            <div className="act-pmeta"><span className="label">Full effect</span><span className="mono">{ACT.fmtDays(fullDays)}</span></div>
          </React.Fragment>
        ) : (
          <div className="act-pmeta"><span className="label">Time to effect</span><span className="mono">{n ? ACT.fmtDays(fullDays) : "—"}</span></div>
        )}
        <div className="act-pmeta"><span className="label">Gap to ceiling</span><span className="mono">{gap.toFixed(1)} pts</span>
          <Fx payload={{
            kicker: "Posture math", title: "How the staged plan stacks",
            text: "Responses come in two kinds. LIVE responses improve today's score: they close the gap between current stress and the ceiling. CEILING responses raise the ceiling itself, the best score the country can structurally reach. Today's score can never rise above the ceiling, which is why the long-term builds matter. Capital shown is committed, not spent.",
            formula: "Ceiling′ = ceiling + Σ ceiling-pts   ·   Live′ = min(Ceiling′,  live + Σ live-pts)",
            inputs: [
              { k: "Live baseline", v: liveBase.toFixed(1), src: "curated" },
              { k: "Structural ceiling", v: ceilBase.toFixed(1) + " → " + ceilNew.toFixed(1), src: "curated" },
              { k: "Staged live recovery", v: "+" + addLive.toFixed(1) + " pts" },
              { k: "Staged ceiling lift", v: "+" + addCeil.toFixed(1) + " pts" },
            ],
            assumption: "We add each response's points together as if they don't affect each other. That keeps the math simple, but some plans compete for the same scarce resource, such as two plans waiting on the same transformer order, so stacking them can deliver less than the sum. The pre-mortems flag where this overlap matters.",
          }} />
        </div>
      </div>
    </div>
  );
}

/* ---- Ranked queue row -------------------------------------------------- */
function QueueRow({ p, rank, prio, r, selected, isStaged, onSelect, onStage }) {
  const b = prio.weakness >= 0.56 ? "critical" : prio.weakness >= 0.5 ? "high" : "moderate";
  return (
    <div className={`act-row band-${b} ${selected ? "sel" : ""}`} onClick={() => onSelect(p.id)}>
      <div className="act-rank mono">{String(rank).padStart(2, "0")}</div>
      <div className="act-row-body">
        <div className="act-row-top">
          <span className="act-row-title">{p.title}</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, flex: "0 0 auto" }} onClick={(e) => e.stopPropagation()}>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--bc)" }} title="Priority score, 0–100, relative standing within this queue; higher = more urgent">{prio.score}<span style={{ fontSize: 9.5, fontWeight: 500, color: "var(--muted)" }}>/100</span></span>
            <Fx payload={{
              kicker: "Priority · computed", title: "Why this rank",
              text: "Priority ranks the PROBLEM, not the plan you're eyeing: a blend of how weak the sector is, how much the recommended fix would recover, and any time-pressure the weakness can't show on its own. Each factor is rescaled to its range across the queue, so tightly-clustered values (sector fragilities) keep their full weight instead of being outvoted by a wider-spread factor (payoffs). It is a standing within this queue, not an absolute grade: the lowest-ranked response scores 0 by construction, meaning 'least urgent of these', not 'worthless'.",
              formula: "Priority  =  0.5 × Weakness  +  0.3 × Payoff  +  0.2 × Time-pressure   (each rescaled to its range across the queue)",
              inputs: [
                { k: "Weakness (anchored sector fragility)", v: prio.wdri + " / 100 → " + prio.rel.weakness + " relative" },
                { k: "Payoff, points the recommended fix recovers", v: (prio.payoff * 100).toFixed(0) + " / 100 → " + prio.rel.payoff + " relative" },
                { k: "Time-pressure", v: (p.window * 100).toFixed(0) + " / 100 → " + prio.rel.time + " relative" + (p.window >= 0.75 ? ", closing clock" : p.window <= 0.4 ? ", no clock" : "") },
                { k: "→ Priority", v: prio.score + " / 100 (relative to the other responses)" },
              ],
              assumption: "Weakness carries half the weight. Time-pressure is the only hand-set factor: chips' export-license clock lifts Defense, while Finance's depth and absent clock keep it low.",
              links: [
                { label: "The " + p.sector + " sector's score & imports · Overview", view: "overview" },
                { label: "The imports behind the weakness · Dependencies", view: "dependencies", opts: { sector: p.sector } },
              ],
            }} />
          </span>
        </div>
        <div className="act-row-addr">{p.addresses}</div>
        <div className="act-row-stats">
          <span className="mono" style={{ color: "var(--bc)", fontWeight: 600 }} title="Sector fragility, anchored (0.6 × anchor import DRI + 0.4 × consequence-weighted mean), the exact complement of the sector score on the Overview">DRI {prio.wdri}</span>
          <span className="act-row-tier">{r.tier.name.replace(/Tier (\d) · /, "T$1 · ")}</span>
          <span className="mono act-stat-pts">+{r.pts.toFixed(1)} pts</span>
        </div>
      </div>
      <button className={`act-stage ${isStaged ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onStage(p.id); }}
        title={isStaged ? "Staged, click to remove" : "Stage this response"}>
        <Icon name={isStaged ? "check" : "play"} size={14} />
      </button>
    </div>
  );
}

/* ---- Scope decision: tier selector -------------------------------------- */
function TierSelector({ p, tierIndex, onPick }) {
  return (
    <div className="act-tiers">
      {p.tiers.map((t, i) => {
        const on = i === tierIndex;
        const pts = t.livePts + t.ceilPts;
        const ek = t.livePts > 0 && t.ceilPts > 0 ? "mixed" : t.ceilPts > 0 ? "ceiling" : "live";
        return (
          <button key={t.id} className={`act-tier ${on ? "on" : ""}`} onClick={() => onPick(i)}>
            <div className="act-tier-head">
              <span className="act-tier-name">{t.name}</span>
              {t.recommended && <span className="act-tier-rec">recommended start</span>}
              <span className={`act-eff ${ek === "live" ? "live" : "ceiling"}`} style={{ marginLeft: "auto" }}
                title={ek === "live" ? "Improves today's score (Live Resilience)" : ek === "ceiling" ? "Improves the long-term score (Structural ceiling)" : "Improves both today's score and the long-term ceiling"}>
                {ek === "live" ? "LIVE" : ek === "ceiling" ? "CEILING" : "LIVE+CEILING"}
              </span>
            </div>
            <div className="act-tier-del">{t.deliverable}</div>
            <div className="act-tier-stats">
              <span className="mono">{ACT.fmtAED(t.cost)}</span>
              <span className="mono">{ACT.fmtDays(t.days)}</span>
              <span className="mono act-stat-pts">{t.livePts > 0 && t.ceilPts > 0 ? `+${t.livePts} now · +${t.ceilPts} ceiling` : t.livePts > 0 ? `+${t.livePts} now` : `+${t.ceilPts} ceiling`}</span>
              {t.local != null && <span className="mono">{t.local}% localized</span>}
            </div>
            <div className="act-tier-note">
              {t.livePts > 0 && t.ceilPts > 0
                ? "Some relief now, but the bigger gain builds over years, and that gain is permanent."
                : t.ceilPts > 0
                ? "No relief now. Builds home-grown capability that lasts and can't expire."
                : "Full relief now, but it's a buffer that drains, so it must be re-bought to keep it."}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---- Cost & effect readout for the chosen tier -------------------------- */
function TierReadout({ p, r }) {
  const liveBase = RD.headline.live.value, ceilBase = RD.headline.structural.value;
  const t = r.tier;
  const srcRow = (p.precedent && p.precedent.sources && p.precedent.sources.length)
    ? [{ k: "Precedent sources", v: (<span style={{ display: "inline-flex", flexDirection: "column", gap: 5 }}>{p.precedent.sources.map((s, i) => (<a key={i} className="drawer-link" href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>))}</span>) }]
    : [];
  const isCeil = t.ceilPts >= t.livePts;
  const after = isCeil
    ? { base: ceilBase, val: +(ceilBase + r.ceil).toFixed(1), lbl: "Structural ceiling" }
    : { base: liveBase, val: +Math.min(ceilBase, liveBase + r.live).toFixed(1), lbl: "Live resilience" };
  return (
    <div className="act-cb">
      <div className="act-cb-grid">
        <div className="kpi"><span className="kpi-v mono">{ACT.fmtAED(r.cost)}</span><span className="kpi-l">Cost
          <Fx payload={{
            kicker: "Fiscal cost", title: "Where this number comes from",
            text: t.costBasis,
            formula: "Anchored to the named precedent / unit economics, not derived from an abstract curve.",
            inputs: [
              { k: "Scope", v: t.name },
              { k: "Vehicle", v: t.vehicle },
              { k: "Total", v: ACT.fmtAED(t.cost) },
              ...srcRow,
            ],
            assumption: "Figures anchored to a real comparable say so; figures marked 'modeled' have no direct comparable and are planning envelopes, not quotes.",
          }} /></span></div>
        <div className="kpi"><span className="kpi-v mono">{ACT.fmtDays(r.days)}</span><span className="kpi-l">Time to effect
          <Fx payload={{
            kicker: "Time to effect", title: "Why it takes this long",
            text: t.timeBasis,
            formula: "Set by the physical clock, procurement queues, construction, qualification, not by funding speed.",
            inputs: [
              { k: "Scope", v: t.name },
              { k: "Physical clock", v: ACT.fmtDays(t.days) },
              ...srcRow,
            ],
            assumption: "Paying faster does not compress supplier queues, GMP qualification or construction. Where a precedent exists, its real announce→operations clock is used.",
          }} /></span></div>
        <div className="kpi"><span className="kpi-v mono" style={{ color: "var(--good)" }}>+{r.pts.toFixed(1)}</span><span className="kpi-l">{t.livePts > 0 && t.ceilPts > 0 ? `${t.livePts} today · ${t.ceilPts} ceiling` : t.livePts > 0 ? "pts to today's score" : "pts to the ceiling"}</span></div>
        <div className="kpi"><span className="kpi-v mono">{after.base.toFixed(1)} <Icon name="arrowRight" size={13} style={{ color: "var(--faint)" }} /> <span style={{ color: "var(--good)" }}>{after.val.toFixed(1)}</span></span><span className="kpi-l">{after.lbl}</span></div>
      </div>
      <div className="act-resid">
        <span className="act-resid-k">What this doesn't fix</span>
        <span className="act-resid-v">{t.residual}</span>
      </div>
      {t.milestones && (
        <div style={{ marginTop: 14 }}>
          <span className="label" style={{ display: "block", marginBottom: 8 }}>The path: {t.name.replace(/Tier \d · /, "")}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {t.milestones.map(([at, txt], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "52px auto 1fr", gap: 10, alignItems: "baseline" }}>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent)", textAlign: "right" }}>{at}</span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flex: "0 0 auto", marginTop: 4 }}></span>
                  {i < t.milestones.length - 1 && <span style={{ flex: 1, width: 1.5, background: "var(--line-2)", minHeight: 12 }}></span>}
                </span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, paddingBottom: i < t.milestones.length - 1 ? 10 : 0 }}>{txt}</span>
              </div>
            ))}
          </div>
          <div className="helper" style={{ marginTop: 8 }}>Milestones follow the precedent's real clock where one exists; treat them as planning order-of-magnitude, not a schedule.</div>
        </div>
      )}
    </div>
  );
}

/* ---- The implementation brief ------------------------------------------ */
function Brief({ p }) {
  return (
    <div className="act-brief">
      {p.sponsor && (
        <div className="act-brief-sec">
          <span className="act-brief-k"><Icon name="shield" size={13} /> Sponsor, who commissions it</span>
          <div className="act-brief-v">
            <b>{p.sponsor.name}</b>
            <span>{p.sponsor.why}</span>
          </div>
        </div>
      )}
      <div className="act-brief-sec">
        <span className="act-brief-k"><Icon name="map" size={13} /> Where</span>
        <div className="act-brief-v">
          <b>{p.site.where}</b>
          <span>{p.site.why}</span>
        </div>
      </div>
      <div className="act-brief-sec">
        <span className="act-brief-k"><Icon name="fx" size={13} /> Technology &amp; inputs</span>
        <div className="act-brief-v">
          <span>{p.tech.summary}</span>
          <div className="act-inputs">
            {p.tech.inputs.map((inp) => (
              <div className="act-input" key={inp.name}>
                <span className={`tag-band band-${INPUT_BAND[inp.status]}`}><span></span>{inp.status}</span>
                <span className="act-input-body"><span className="act-input-name">{inp.name}</span> <span className="act-input-note">{inp.note}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="act-brief-sec">
        <span className="act-brief-k"><Icon name="ops" size={13} /> Partners</span>
        <div className="act-brief-v">
          {p.partners.map((pa) => (
            <div className="act-partner" key={pa.name}><b>{pa.name}</b><span>{pa.role}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Real-world precedent card ------------------------------------------ */
function Precedent({ p }) {
  const pr = p.precedent;
  return (
    <div className="act-prec">
      <div className="act-prec-head">
        <span className="act-prec-kicker"><Icon name="book" size={11} /> Real-world precedent</span>
        <SourceTag src={pr.flag === "sourced" ? "curated" : "assumption"} />
      </div>
      <div className="act-prec-title">{pr.title}</div>
      <ul className="act-prec-facts">
        {pr.facts.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
      {pr.sources && pr.sources.length > 0 && (
        <div className="act-prec-foot">
          <button className="act-prec-srcbtn" onClick={() => window.__explain && window.__explain({
            kicker: "Real-world precedent", title: pr.title,
            text: "Primary public sources for this precedent's cost and timeline figures.",
            inputs: pr.sources.map((s) => ({ k: "Source", v: (<a className="drawer-link" href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>) })),
          })}>Sources <span aria-hidden="true">→</span></button>
        </div>
      )}
    </div>
  );
}

/* ---- Pre-mortem -------------------------------------------------------- */
function Premortem({ p }) {
  const LK_ORDER = { High: 0, Medium: 1, Low: 2 };
  const modes = p.premortem.slice().sort((a, b) => (LK_ORDER[a.likelihood] ?? 1) - (LK_ORDER[b.likelihood] ?? 1));
  return (
    <div className="act-pm">
      {modes.map((f, i) => {
        const b = LK_BAND[f.likelihood] || "moderate";
        return (
          <div className="act-fail" key={i}>
            <div className="act-fail-head">
              <span className="act-fail-n mono" title={"Failure mode " + (i + 1) + ", ranked by likelihood"}>F{i + 1}</span>
              <span className="act-fail-mode">{f.mode}</span>
              <span className={`tag-band band-${b}`} style={{ marginLeft: "auto" }}><span></span>{f.likelihood}</span>
            </div>
            <div className="act-fail-grid">
              <div className="act-fail-cell">
                <span className="act-fail-k">Leading indicator{f.tracked && <span className="act-tracked" title={f.trackedWhere ? "Tracked in: " + f.trackedWhere : "Already tracked by the system"}>tracked</span>}</span>
                <span className="act-fail-v">{f.indicator}{f.trackedWhere && <span className="helper" style={{ display: "block", marginTop: 3, fontSize: 10.5 }}>Tracked in: {f.trackedWhere}</span>}</span>
              </div>
              <div className="act-fail-cell">
                <span className="act-fail-k">Mitigation</span>
                <span className="act-fail-v">{f.mitigation}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="act-pm-note">
        A pre-mortem flips a post-mortem: assume this response has already failed, then work back through how it happened. Taking failure as given surfaces the weak points that optimism hides. Each failure mode (F1, F2…) is ranked by likelihood, with the indicator that would warn first and its mitigation.
      </div>
    </div>
  );
}

/* ---- Detail panel ------------------------------------------------------ */
function PlayDetail({ p, r, onPickTier, isStaged, onStage }) {
  return (
    <div className="stack">
      <Panel title={p.title} icon="shield"
        right={(() => { const s = RD.sectors.find((x) => x.id === p.sector); const b = RD.band(s.score); const n = RD.precursors.filter((x) => x.sector === p.sector).length; return (
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            <span className={`tag-band band-${b.key}`} title={s.name + " sector resilience: " + s.score.toFixed(1) + " / 100, the weakness this play addresses (from the Overview sector grid)"}><span></span>{s.name} {s.score.toFixed(1)}<span style={{ fontWeight: 400, opacity: 0.7 }}>/100</span></span>
            <button className="exp" onClick={() => window.__go && window.__go("dependencies", { sector: p.sector })} title={"Open the " + n + " tracked " + s.name + " imports behind this score"}>{n} sector imports →</button>
          </span>
        ); })()}>
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.65, margin: "0 0 14px" }}>{p.thesis}</p>
        <Precedent p={p} />
      </Panel>

      <Panel title="The decision: how far to go" icon="fx" label="EACH TIER IS A COMPLETE PLAN">
        <TierSelector p={p} tierIndex={r.tierIndex} onPick={onPickTier} />
        <div className="divider"></div>
        <TierReadout p={p} r={r} />
        <button className={`btn ${isStaged ? "" : "primary"}`} style={{ marginTop: 16 }} onClick={() => onStage(p.id)}>
          <Icon name={isStaged ? "check" : "play"} size={15} />{isStaged ? "Staged, click to remove" : "Stage this response"}
        </button>
      </Panel>

      <Panel title="Implementation brief" icon="map" label="SITE · TECHNOLOGY · PARTNERS">
        <Brief p={p} />
      </Panel>

      <Panel title="Pre-mortem" icon="reset" label="HOW THIS FAILS">
        <Premortem p={p} />
      </Panel>
    </div>
  );
}

/* ---- Main view --------------------------------------------------------- */
function ActView({ initial = {} }) {
  const [states, setStates] = useState({});            // id → { tier: index }
  const [staged, setStaged] = useState(() => new Set());
  const [selId, setSelId] = useState(() => {
    const m = initial.sector && ACT.PLAYS.find((p) => p.sector === initial.sector);
    return m ? m.id : ACT.PLAYS[0].id;
  });

  const set = (id, patch) => setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const evalById = (id) => ACT.evalPlay(ACT.PLAYS.find((p) => p.id === id), states[id]);
  const onStage = (id) => setStaged((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // The queue ORDER is a property of the problem (urgency + stakes), so it never
  // moves while you explore or stage. The per-row figures reflect whichever tier
  // is currently selected for that response, live, so picking a tier in the
  // detail panel updates the queue row immediately, before you stage it.
  const queueEvals = useMemo(
    () => ACT.PLAYS.map((p) => ({ p, r: ACT.evalPlay(p, states[p.id]) })),
    [states, staged]
  );
  const prio = useMemo(() => {
    const ps = ACT.priorities(queueEvals);
    const m = {}; ps.forEach((x) => (m[x.id] = x));
    return m;
  }, [queueEvals]);
  const ranked = useMemo(() => queueEvals.slice().sort((a, b) => prio[b.p.id].score - prio[a.p.id].score), [queueEvals, prio]);

  const sel = ACT.PLAYS.find((p) => p.id === selId);
  const selR = evalById(selId);

  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Sector responses</div>
        <div className="view-sub">
          Where the loop closes. Each response is a concrete plan, what gets built, where, and with which technology and
          partners, informed by a real-world precedent and its reported cost and timeline. You make one decision:
          <b> how far to go</b>.
        </div>
      </div>

      <Posture staged={staged} evalById={evalById} />

      <div className="grid cols-2" style={{ gridTemplateColumns: "minmax(360px, 0.95fr) 1.45fr", alignItems: "start", marginTop: 16 }}>
        <div className="stack act-left" style={{ position: "sticky", top: 120, alignSelf: "start" }}>
        <Panel title="National response queue" icon="ops"
          right={<span className="helper" style={{ marginLeft: "auto" }}>Ranked by weakness, payoff &amp; time-pressure</span>}>
          <div className="act-queue" style={{ overflowY: "auto", maxHeight: "52vh", paddingRight: 4, overscrollBehavior: "contain" }}>
            {ranked.map(({ p, r }, i) => (
              <QueueRow key={p.id} p={p} rank={i + 1} prio={prio[p.id]} r={r}
                selected={selId === p.id} isStaged={staged.has(p.id)}
                onSelect={setSelId} onStage={onStage} />
            ))}
          </div>
        </Panel>
        <TagLegend />
        </div>

        <PlayDetail p={sel} r={selR} onPickTier={(i) => set(selId, { tier: i })}
          isStaged={staged.has(selId)} onStage={onStage} />
      </div>
    </div>
  );
}

Object.assign(window, { ActView });
