/* ============================================================================
   ACT view — Response & Pre-mortem, as grounded implementation briefs.
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
          <span>Improves <b>today's score</b> — it recovers Live Stress now, but the underlying weakness remains.</span>
        </div>
        <div className="act-legend-row">
          <span className="act-eff ceiling">CEILING</span>
          <span>Improves the <b>long-term score</b> — it raises the Structural ceiling, the best score the country can reach.</span>
        </div>
        <div className="act-legend-row">
          <span className="act-eff ceiling">LIVE+CEILING</span>
          <span>Does both — some relief now, plus a permanently higher ceiling.</span>
        </div>
        <div className="act-legend-row">
          <span className="act-eff">T1 / T2 / T3</span>
          <span>The <b>scope tiers</b> — three sizes of the same plan, from quick stopgap to full build. Each is a complete, real plan on its own.</span>
        </div>
      </div>
    </Panel>
  );
}

/* ---- What-is-a-pre-mortem explainer ------------------------------------ */
function PremortemNote() {
  return (
    <div className="act-pm-note">
      <div className="act-pm-note-mark"><Icon name="reset" size={16} /></div>
      <div>
        <b>What is a pre-mortem?</b> A regular post-mortem asks, after a failure, “why did this die?” A pre-mortem
        flips the timeline: it <i>assumes the response has already failed catastrophically</i> and works backwards to
        explain how. Stating failure as a given surfaces the weak points optimism normally hides. Here, no response is
        shown without one — every brief names the ways it breaks, how likely each is, the leading indicator
        that would warn you, and the mitigation that keeps it alive.
      </div>
    </div>
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
    firstDays = Math.min(firstDays, r.days); fullDays = Math.max(fullDays, r.days);
  });
  const ceilNew = +(ceilBase + addCeil).toFixed(1);
  const liveNew = +Math.min(ceilNew, liveBase + addLive).toFixed(1);
  const liveB = RD.band(liveNew), n = staged.size;
  const gap = +(ceilNew - liveNew).toFixed(1);
  return (
    <div className="act-posture">
      <div className="act-posture-scores">
        <div className="act-pscore">
          <span className="label">Live stress now</span>
          <span className="act-pnum mono">{liveBase.toFixed(1)}</span>
        </div>
        <Icon name="arrowRight" size={20} style={{ color: "var(--faint)", flex: "0 0 auto" }} />
        <div className={`act-pscore band-${liveB.key}`}>
          <span className="label">With {n} response{n === 1 ? "" : "s"} staged</span>
          <span className="act-pnum mono" style={{ color: n ? "var(--bc)" : "var(--ink)" }}>{liveNew.toFixed(1)}</span>
          <span className="act-pdelta mono">{addLive > 0 ? "+" + (liveNew - liveBase).toFixed(1) + " live" : "—"}{addCeil > 0 ? " · +" + addCeil.toFixed(1) + " ceiling" : ""}</span>
        </div>
      </div>
      <div className="act-posture-meta">
        <div className="act-pmeta"><span className="label">Capital committed</span><span className="mono">{n ? ACT.fmtAED(cost) : "—"}</span></div>
        <div className="act-pmeta"><span className="label">First effect</span><span className="mono">{n ? ACT.fmtDays(firstDays) : "—"}</span></div>
        <div className="act-pmeta"><span className="label">Full effect</span><span className="mono">{n ? ACT.fmtDays(fullDays) : "—"}</span></div>
        <div className="act-pmeta"><span className="label">Gap to ceiling</span><span className="mono">{gap.toFixed(1)} pts</span>
          <Fx payload={{
            kicker: "Posture math", title: "How the staged plan stacks",
            text: "Responses come in two kinds. LIVE responses improve today's score — they close the gap between current stress and the ceiling. CEILING responses raise the ceiling itself — the best score the country can structurally reach. Today's score can never rise above the ceiling, which is why the long-term builds matter. Note the emergency fund's capital is committed, not spent — this roll-up adds headline figures.",
            formula: "Ceiling′ = ceiling + Σ ceiling-pts   ·   Live′ = min(Ceiling′,  live + Σ live-pts)",
            inputs: [
              { k: "Live baseline", v: liveBase.toFixed(1), src: "ais" },
              { k: "Structural ceiling", v: ceilBase.toFixed(1) + " → " + ceilNew.toFixed(1), src: "curated" },
              { k: "Staged live recovery", v: "+" + addLive.toFixed(1) + " pts" },
              { k: "Staged ceiling lift", v: "+" + addCeil.toFixed(1) + " pts" },
            ],
            assumption: "Effects are treated as independent and additive — a deliberate simplification. Real responses interact (the same transformer queue constrains two plays); the pre-mortems flag where that coupling bites.",
          }} />
        </div>
      </div>
    </div>
  );
}

/* ---- Ranked queue row -------------------------------------------------- */
function QueueRow({ p, rank, prio, r, selected, isStaged, onSelect, onStage }) {
  const b = p.urgency >= 0.85 ? "critical" : p.urgency >= 0.7 ? "high" : "moderate";
  return (
    <div className={`act-row band-${b} ${selected ? "sel" : ""}`} onClick={() => onSelect(p.id)}>
      <div className="act-rank mono">{String(rank).padStart(2, "0")}</div>
      <div className="act-row-body">
        <div className="act-row-top">
          <span className="act-row-title">{p.title}</span>
        </div>
        <div className="act-row-addr">{p.addresses}</div>
        <div className="act-row-stats">
          <span className="act-row-tier">{r.tier.name.replace(/Tier (\d) · /, "T$1 · ")}</span>
          <span className="mono act-stat-pts">+{r.pts.toFixed(1)}</span>
          <span className="mono">{ACT.fmtAED(r.cost)}</span>
          <span className="mono">{ACT.fmtDays(r.days)}</span>
          <span className="act-prio" title="Priority score">
            <span className="act-prio-bar"><span style={{ width: prio.score + "%" }}></span></span>
            <span className="mono">{prio.score}</span>
          </span>
        </div>
      </div>
      <button className={`act-stage ${isStaged ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onStage(p.id); }}
        title={isStaged ? "Staged — click to remove" : "Stage this response"}>
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
        return (
          <button key={t.id} className={`act-tier ${on ? "on" : ""}`} onClick={() => onPick(i)}>
            <div className="act-tier-head">
              <span className="act-tier-name">{t.name}</span>
              {t.recommended && <span className="act-tier-rec">recommended start</span>}
              <span className={`act-eff ${t.kind === "live" ? "live" : "ceiling"}`} style={{ marginLeft: "auto" }}
                title={t.kind === "live" ? "Improves today's score (Live Stress)" : t.kind === "ceiling" ? "Improves the long-term score (Structural ceiling)" : "Improves both today's score and the long-term ceiling"}>
                {t.kind === "live" ? "LIVE" : t.kind === "ceiling" ? "CEILING" : "LIVE+CEILING"}
              </span>
            </div>
            <div className="act-tier-del">{t.deliverable}</div>
            <div className="act-tier-stats">
              <span className="mono">{ACT.fmtAED(t.cost)}</span>
              <span className="mono">{ACT.fmtDays(t.days)}</span>
              <span className="mono act-stat-pts">+{pts.toFixed(1)} pts</span>
              {t.local != null && <span className="mono">{t.local}% localized</span>}
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
  const isCeil = t.ceilPts >= t.livePts;
  const after = isCeil
    ? { base: ceilBase, val: +(ceilBase + r.ceil).toFixed(1), lbl: "Structural ceiling" }
    : { base: liveBase, val: +Math.min(ceilBase, liveBase + r.live).toFixed(1), lbl: "Live stress" };
  return (
    <div className="act-cb">
      <div className="act-cb-grid">
        <div className="kpi"><span className="kpi-v mono">{ACT.fmtAED(r.cost)}</span><span className="kpi-l">Cost
          <Fx payload={{
            kicker: "Fiscal cost", title: "Where this number comes from",
            text: t.costBasis,
            formula: "Anchored to the named precedent / unit economics — not derived from an abstract curve.",
            inputs: [
              { k: "Scope", v: t.name },
              { k: "Vehicle", v: t.vehicle },
              { k: "Total", v: ACT.fmtAED(t.cost) },
            ],
            assumption: "Figures anchored to a real comparable say so; figures marked 'modelled' have no direct comparable and are planning envelopes, not quotes.",
          }} /></span></div>
        <div className="kpi"><span className="kpi-v mono">{ACT.fmtDays(r.days)}</span><span className="kpi-l">Time to effect
          <Fx payload={{
            kicker: "Time to effect", title: "Why it takes this long",
            text: t.timeBasis,
            formula: "Set by the physical clock — procurement queues, construction, qualification — not by funding speed.",
            inputs: [
              { k: "Scope", v: t.name },
              { k: "Physical clock", v: ACT.fmtDays(t.days) },
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
    </div>
  );
}

/* ---- The implementation brief ------------------------------------------ */
function Brief({ p }) {
  return (
    <div className="act-brief">
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
                <span className="act-input-name">{inp.name}</span>
                <span className="act-input-note">{inp.note}</span>
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
        <span className="act-prec-kicker">REAL-WORLD PRECEDENT</span>
        <SourceTag src={pr.flag === "sourced" ? "curated" : "assumption"} />
      </div>
      <div className="act-prec-title">{pr.title}</div>
      <ul className="act-prec-facts">
        {pr.facts.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </div>
  );
}

/* ---- Pre-mortem -------------------------------------------------------- */
function Premortem({ p }) {
  return (
    <div className="act-pm">
      <div className="act-pm-lead">
        <Icon name="alert" size={15} style={{ color: "var(--high)" }} />
        <span>Assume this response has <b>already failed</b>. Here is how — and what keeps it alive.</span>
      </div>
      {p.premortem.map((f, i) => {
        const b = LK_BAND[f.likelihood] || "moderate";
        return (
          <div className="act-fail" key={i}>
            <div className="act-fail-head">
              <span className="act-fail-n mono">F{i + 1}</span>
              <span className="act-fail-mode">{f.mode}</span>
              <span className={`tag-band band-${b}`} style={{ marginLeft: "auto" }}><span></span>{f.likelihood}</span>
            </div>
            <div className="act-fail-grid">
              <div className="act-fail-cell">
                <span className="act-fail-k">Leading indicator{f.tracked && <span className="act-tracked" title="Already tracked by the system">tracked</span>}</span>
                <span className="act-fail-v">{f.indicator}</span>
              </div>
              <div className="act-fail-cell">
                <span className="act-fail-k">Mitigation</span>
                <span className="act-fail-v">{f.mitigation}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Detail panel ------------------------------------------------------ */
function PlayDetail({ p, r, onPickTier, isStaged, onStage }) {
  return (
    <div className="stack">
      <Panel title={p.title} icon="shield">
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.65, margin: "0 0 14px" }}>{p.thesis}</p>
        <Precedent p={p} />
      </Panel>

      <Panel title="The decision — how far to go" icon="fx" label="EACH TIER IS A COMPLETE, REAL PLAN ON ITS OWN">
        <TierSelector p={p} tierIndex={r.tierIndex} onPick={onPickTier} />
        <div className="divider"></div>
        <TierReadout p={p} r={r} />
        <button className={`btn ${isStaged ? "" : "primary"}`} style={{ marginTop: 16 }} onClick={() => onStage(p.id)}>
          <Icon name={isStaged ? "check" : "play"} size={15} />{isStaged ? "Staged in the national plan — remove" : "Stage this scope"}
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
function ActView() {
  const [states, setStates] = useState({});            // id → { tier: index }
  const [staged, setStaged] = useState(() => new Set());
  const [selId, setSelId] = useState(ACT.PLAYS[0].id);

  const set = (id, patch) => setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const evalById = (id) => ACT.evalPlay(ACT.PLAYS.find((p) => p.id === id), states[id]);
  const onStage = (id) => setStaged((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const evals = useMemo(() => ACT.PLAYS.map((p) => ({ p, r: ACT.evalPlay(p, states[p.id]) })), [states]);
  const prio = useMemo(() => {
    const ps = ACT.priorities(evals);
    const m = {}; ps.forEach((x) => (m[x.id] = x));
    return m;
  }, [evals]);
  const ranked = useMemo(() => evals.slice().sort((a, b) => prio[b.p.id].score - prio[a.p.id].score), [evals, prio]);

  const sel = ACT.PLAYS.find((p) => p.id === selId);
  const selR = evalById(selId);

  return (
    <div className="view fade-in">
      <div className="view-head">
        <div className="view-title">Response &amp; pre-mortem</div>
        <div className="view-sub">
          Where the loop closes. Each response is a concrete plan — what gets built, where, with which technology and
          partners — anchored to a real project that has already been done, with its actual cost and timeline. You make
          one decision per response: <b>how far to go</b>. And every plan honestly states how it could fail.
        </div>
      </div>

      <Posture staged={staged} evalById={evalById} />

      <div className="grid cols-2" style={{ gridTemplateColumns: "minmax(360px, 0.95fr) 1.45fr", alignItems: "start", marginTop: 16 }}>
        <div className="stack act-left">
        <Panel title="National response queue" icon="ops" label={ACT.PLAYS.length + " RESPONSES · RANKED BY PRIORITY"}
          right={<span className="helper" style={{ marginLeft: "auto" }}>Change a scope → the queue reranks</span>}>
          <div className="act-queue">
            {ranked.map(({ p, r }, i) => (
              <QueueRow key={p.id} p={p} rank={i + 1} prio={prio[p.id]} r={r}
                selected={selId === p.id} isStaged={staged.has(p.id)}
                onSelect={setSelId} onStage={onStage} />
            ))}
          </div>
          <div className="helper" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            Priority blends <b>impact</b> (points gained), <b>urgency</b> (how acute the problem is), <b>speed</b> and
            <b> value for money</b> (points per AED bn) — at whichever scope you've chosen for each response.
          </div>
        </Panel>
        <TagLegend />
        <PremortemNote />
        </div>

        <PlayDetail p={sel} r={selR} onPickTier={(i) => set(selId, { tier: i })}
          isStaged={staged.has(selId)} onStage={onStage} />
      </div>
    </div>
  );
}

Object.assign(window, { ActView });
