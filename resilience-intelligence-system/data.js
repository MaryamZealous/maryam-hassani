/* ============================================================================
   UAE National Resilience Intelligence System — Illustrative dataset
   All figures sourced from the design package (DESIGN_DOCUMENT.md et al.).
   This is an ILLUSTRATIVE model: numbers are public/curated samples and
   transparent assumptions, NOT an operational classified assessment.
   ========================================================================== */
window.RD = (function () {
  // ---- Semantic bands (higher score = more resilient) ----------------------
  const BANDS = [
    { key: "critical", label: "CRITICAL", min: 0,  max: 40,  desc: "Acute load across several sectors" },
    { key: "high",     label: "HIGH RISK",min: 40, max: 60,  desc: "Operating under load, with cascade exposure to watch" },
    { key: "moderate", label: "MODERATE", min: 60, max: 75,  desc: "Stable, absorbing active load" },
    { key: "good",     label: "GOOD",     min: 75, max: 90,  desc: "Strong foundations" },
    { key: "strong",   label: "STRONG",   min: 90, max: 100, desc: "Highly resilient" },
  ];
  function band(score) {
    for (const b of BANDS) if (score >= b.min && score < b.max) return b;
    return BANDS[BANDS.length - 1];
  }

  // ---- Headline scores -----------------------------------------------------
  const headline = {
    structural: {
      value: 54.5, prev: 54.8,
      name: "Structural Resilience",
      tag: "Baseline · the ceiling",
      horizon: "30d",
      formula: "0.58 × Sector readiness  +  0.24 × Sovereign buffer  +  0.18 × Supply depth",
      cap: { at: 72, label: "frontier ~72", lead: "100 is a phantom ceiling", body: "— no trade economy reaches it; the realistic frontier is ≈72 (marked). This score is also the CEILING for Live Stress — live strength tracks up to your fundamentals." },
      explain: "The slow-moving baseline — your fair-weather structural capacity, exposure NET of the capacity to absorb and adapt. It is the CEILING the live score recovers toward: live strength climbs back to what your fundamentals allow as conditions settle. It moves over months as dependencies, sovereign buffers and supply diversity change, and is independent of today's events. The 0–100 axis is anchored to reality: 100 = total self-sufficiency no trade economy achieves; realistic frontier ≈72.",
      inputs: [
        { k: "Sector readiness (58%)", v: "weak-anchored blend → 48.6", src: "curated" },
        { k: "Sovereign buffer (24%)", v: "~$2.0T across UAE SWFs → 72", src: "curated" },
        { k: "Supply depth (18%)", v: "source diversity across 14 precursors → 50", src: "curated" },
      ],
      assumption: "This is now the BASELINE/CEILING in a baseline-and-deviation model: Live Stress = this value − today's active load, tracking up to it. Sovereign buffer was lifted from 66 to 72 after correcting UAE sovereign wealth from a modelled $1.4T to a verified ~$2.0T (ADIA ~$1.1T + ICD $429B + Mubadala $358B). Readiness stays non-compensatory by blend: 0.60 × most-exposed sector (Defence 40.1) + 0.40 × mean (61.3).",
    },
    live: {
      value: 47.0, prev: 44.5,
      name: "Live Stress Resilience",
      tag: "Daily · capped by baseline",
      horizon: "24h",
      formula: "Structural ceiling  −  today's active load (live)",
      cap: { at: 54.5, label: "ceiling = baseline 54.5", lead: "Tracking toward your baseline", body: "— live resilience tracks toward the structural ceiling (54.5). It sits below it by the size of today's active load. As that load clears, live recovers TOWARD the ceiling, climbing back to full strength." },
      explain: "How resilient the system is to the conditions happening RIGHT NOW — expressed as a DEVIATION below the structural ceiling, not a free-floating number. On a calm day it would sit AT the ceiling (54.5); live load lowers it. Maritime disruption is counted ONCE, through measured vessel throughput — which already embeds escalation, since carriers reroute in response to it. The gap between this and the ceiling is the real headline signal: a wide gap shows where to focus today; a narrow gap means operating close to your fundamentals.",
      inputs: [
        { k: "Structural ceiling", v: "54.5 — the day's maximum", src: "curated" },
        { k: "Maritime throughput", v: "Hormuz / Red Sea / Suez transit calls vs each strait's 12-month norm (IMF PortWatch) — embeds escalation", src: "ais" },
        { k: "Non-maritime shocks", v: "residual Guinea/EGA bauxite load (settled May 2026, easing; not in vessel counts)", src: "acled" },
        { k: "Live = ceiling − active load", v: "recomputed every refresh from the live drivers", src: "curated" },
      ],
      assumption: "Maritime disruption is counted ONCE — via measured vessel throughput, which already embeds escalation (carriers reroute because of it). The maritime events in the convergence panel are the CAUSES of that throughput drop, shown for context, not added a second time. Only non-maritime shocks (e.g. Guinea) add a separate severity term. Escalation's one distinct residual effect — threat to the Fujairah bypass itself — is treated structurally, not as additive live drag.",
    },
  };

  // ---- 7 sectors -----------------------------------------------------------
  const sectors = [
    { id: "energy", name: "Energy", score: 58.3, prev: 60.0,
      topRisk: "Piped gas (Dolphin)", topDRI: 61, precursors: 3,
      note: "Power and desalination draw on one shared gas envelope, so they move together under load. Piped Dolphin gas from Qatar is the highest-consequence input in the model; grid transformers and LEU fuel round out the sector's tracked precursors." },
    { id: "water", name: "Water", score: 45.0, prev: 44.5,
      topRisk: "RO membranes", topDRI: 55, precursors: 2,
      note: "Desalination runs on RO membranes from a competitive-but-concentrated supplier field. Source diversity is better than once assumed; the binding constraint is reorder lead-time (~120 days) against the 75-day buffer." },
    { id: "defence", name: "Defence", score: 40.1, prev: 40.1,
      topRisk: "Leading-edge chips", topDRI: 66, precursors: 4,
      note: "Guided-systems production leans on advanced silicon. The binding risk is US export-control licensing, not Taiwanese supply — a channel that eased in late 2025." },
    { id: "food", name: "Food", score: 73.5, prev: 72.8,
      topRisk: "Potash (fertilizer)", topDRI: 38, precursors: 3,
      note: "Diversified sourcing and strategic reserves give the deepest buffer of any sector." },
    { id: "logistics", name: "Logistics", score: 67.0, prev: 71.2,
      topRisk: "Hormuz transit", topDRI: 58, precursors: 4,
      note: "60% of imports route through Jebel Ali (inside the strait); crude exports bypass via Fujairah. Hormuz import-exposure is the dominant variable, partly offset by air-cargo prioritisation." },
    { id: "finance", name: "Finance", score: 81.5, prev: 81.4,
      topRisk: "Counterpart sanctions", topDRI: 22, precursors: 1,
      note: "Sovereign wealth depth gives an exceptional shock-absorption buffer." },
    { id: "health", name: "Health", score: 64.0, prev: 64.3,
      topRisk: "Active pharma ingredients", topDRI: 55, precursors: 3,
      note: "APIs concentrate 65% in India; vaccine stock is deep but device supply is thin." },
  ];

  // ---- 14 precursors (critical imports) -----------------------------------
  const precursors = [
    { id: "leu", name: "LEU fuel", sector: "energy", source: "Kazakhstan", buffer: 540, consequence: 0.80, dri: 44,
      dims: { concentration: 22, substitutability: 12, route: 6, counterpart: 4 }, hormuz: false, dolphin: false,
      note: "Long-lead nuclear fuel for Barakah. No near-term alternative, but enormous buffer." },
    { id: "chips", name: "Leading-edge chips", sector: "defence", source: "Taiwan", buffer: 90, consequence: 0.85, dri: 66,
      dims: { concentration: 24, substitutability: 24, route: 22, counterpart: 16 }, hormuz: false, dolphin: false,
      note: "Fabrication concentrates in Taiwan, but the access risk is US export-control licensing, not a supply halt — a channel that EASED in Nov 2025 when the US approved G42 to import advanced Nvidia silicon. Feeds EDGE Group guided-systems lines." },
    { id: "ro", name: "RO membranes", sector: "water", source: "Japan / US / Korea", buffer: 75, consequence: 0.90, dri: 55,
      dims: { concentration: 16, substitutability: 16, route: 13, counterpart: 10 }, hormuz: false, dolphin: false,
      note: "Competitive but concentrated field — DuPont (US), Toray & Nitto (Japan), LG (Korea) hold ~58% between the top three. Gulf desalination already runs largely on Toray membranes, and regional production is localising (Veolia–Alkhorayef, Saudi, 2026). The binding risk is the ~120-day reorder lead-time vs a 75-day buffer — not single-source failure." },
    { id: "gas", name: "Piped gas (Dolphin)", sector: "energy", source: "Qatar", buffer: 30, consequence: 1.00, dri: 61,
      dims: { concentration: 23, substitutability: 18, route: 8, counterpart: 12 }, hormuz: false, dolphin: true,
      note: "25% of gas for power + water. Contract runs to 2032. Highest consequence weight in the model." },
    { id: "api", name: "Active pharma ingredients", sector: "health", source: "India", buffer: 60, consequence: 0.85, dri: 55,
      dims: { concentration: 21, substitutability: 16, route: 10, counterpart: 8 }, hormuz: true, dolphin: false,
      note: "65% sourced from India. Hospital pharmacology depends on uninterrupted flow." },
    { id: "potash", name: "Potash (fertilizer)", sector: "food", source: "Canada / Russia", buffer: 120, consequence: 0.55, dri: 38,
      dims: { concentration: 14, substitutability: 9, route: 9, counterpart: 6 }, hormuz: false, dolphin: false,
      note: "Potassium fertiliser input for domestic agriculture. Reasonably diversified." },
    { id: "vaccines", name: "Vaccines", sector: "health", source: "US / EU", buffer: 180, consequence: 0.70, dri: 31,
      dims: { concentration: 12, substitutability: 8, route: 7, counterpart: 4 }, hormuz: false, dolphin: false,
      note: "Deep 180-day cold-chain buffer from diversified Western suppliers." },
    { id: "devices", name: "Medical devices", sector: "health", source: "China", buffer: 45, consequence: 0.65, dri: 49,
      dims: { concentration: 18, substitutability: 14, route: 10, counterpart: 7 }, hormuz: true, dolphin: false,
      note: "40% from China with a thin 45-day buffer. Counterpart risk rising." },
    { id: "transformers", name: "Grid transformers", sector: "energy", source: "South Korea / EU", buffer: 240, consequence: 0.75, dri: 41,
      dims: { concentration: 15, substitutability: 13, route: 8, counterpart: 5 }, hormuz: false, dolphin: false,
      note: "Long-lead high-voltage transformers. Failure cascades to desalination." },
    { id: "wheat", name: "Wheat", sector: "food", source: "Russia / Australia", buffer: 150, consequence: 0.60, dri: 34,
      dims: { concentration: 13, substitutability: 7, route: 9, counterpart: 5 }, hormuz: false, dolphin: false,
      note: "Strategic reserves plus diversified sourcing keep this comfortable." },
    { id: "gps", name: "Timing / GNSS modules", sector: "defence", source: "United States", buffer: 90, consequence: 0.70, dri: 47,
      dims: { concentration: 17, substitutability: 13, route: 11, counterpart: 6 }, hormuz: false, dolphin: false,
      note: "Precision-timing modules. Vulnerable to GPS-jamming spikes in the Gulf." },
    { id: "avparts", name: "Aviation spares", sector: "logistics", source: "US / EU", buffer: 60, consequence: 0.65, dri: 43,
      dims: { concentration: 14, substitutability: 12, route: 11, counterpart: 6 }, hormuz: false, dolphin: false,
      note: "Keeps air-bridge capacity alive when sea routes degrade." },
    { id: "ammonia", name: "Ammonia / urea", sector: "food", source: "Domestic / GCC", buffer: 200, consequence: 0.45, dri: 27,
      dims: { concentration: 9, substitutability: 7, route: 6, counterpart: 5 }, hormuz: false, dolphin: false,
      note: "Largely domestic. One of the lowest-risk inputs tracked." },
    { id: "golddore", name: "Gold doré", sector: "finance", source: "Africa (various)", buffer: 30, consequence: 0.20, dri: 22,
      dims: { concentration: 8, substitutability: 6, route: 5, counterpart: 3 }, hormuz: false, dolphin: false,
      note: "Refining feedstock. Low national-consequence weight — included to show the bottom of the scale." },
  ];

  // ---- Chokepoints ---------------------------------------------------------
  const chokepoints = [
    { id: "hormuz", name: "Strait of Hormuz", vessels: 6, baseline: 113, band: "critical",
      drop: 95, lat: 26.57, lng: 56.25, spark: [110,104,96,68,40,18,9,6], note: "Carries ~20% of seaborne oil. UAE crude exports bypass via the Habshan–Fujairah pipeline (1.5–1.8 mb/d, outside the strait), so Fujairah holds up even when the strait is stressed. LNG exports and most Jebel Ali container imports stay exposed." },
    { id: "redsea", name: "Red Sea / Bab-el-Mandeb", vessels: 35, baseline: 42, band: "moderate",
      drop: 17, lat: 12.6, lng: 43.3, spark: [44,43,41,39,38,36,35,35], note: "The Houthi missile/drone threat keeps transits below their 12-month norm; many carriers still route the long way around the Cape of Good Hope." },
    { id: "suez", name: "Suez Canal", vessels: 40, baseline: 47, band: "moderate",
      drop: 15, lat: 30.0, lng: 32.55, spark: [47,46,44,43,42,41,40,40], note: "Tracks the Red Sea situation closely — diverted traffic and any recovery both show up here first." },
  ];

  // ---- Active shocks -------------------------------------------------------
  const shocks = [
    { id: "guinea", name: "Guinea bauxite supply (EGA)", short: "Guinea", sector: "energy", impact: -4, band: "moderate",
      src: "acled", when: "easing · settled 6 May 2026", track: "Auto-tracked via ACLED + news feed — severity re-rated as the settlement implements; will re-escalate automatically if CBG–EGA shipments stall again.",
      note: "Guinea's 2024 revocation of EGA's GAC concession halted bauxite feedstock to its Al Taweelah refinery in Abu Dhabi. Largely resolved: EGA secured alternative supply from Australia, Ghana and Brazil (>70% of volume) and signed a May 2026 settlement renewing CBG–EGA contracts. Residual drag only.",
      evidence: [{ label: "The National", url: "https://www.thenationalnews.com/business/2026/05/06/ega-settles-disputes-with-guinea-over-bauxite-mine-project/" }, { label: "Aluminium Journal", url: "https://www.aluminium-journal.com/ega-guinea-agreement-bauxite-mining" }] },
    { id: "hormuz", name: "Hormuz tension", short: "Hormuz", sector: "logistics", impact: -20, band: "high",
      src: "acled", when: "ongoing", note: "Gulf naval tension is the most-cited driver behind the strait's depressed transits. Because it is the CAUSE of the throughput collapse shown on the chokepoint card, its effect is counted ONCE there — via measured IMF PortWatch vessel data — not added again here. Shown for context; the Fujairah pipeline and air cargo blunt the crude-export hit.",
      evidence: [{ label: "IMF PortWatch", url: "https://portwatch.imf.org/datasets/42132aa4e2fc4d41bdaf9a445f688931_0/about" }, { label: "EIA chokepoints", url: "https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints" }, { label: "Live vessel traffic", url: "https://www.marinetraffic.com/en/ais/home/centerx:56.5/centery:26.5/zoom:8" }] },
    { id: "redsea", name: "Red Sea Houthi activity", short: "Red Sea", sector: "logistics", impact: -8, band: "moderate",
      src: "acled", when: "ongoing", note: "The Houthi drone/missile threat that pushed carriers off the route — the CAUSE of the Red Sea transit drop, counted once via measured throughput, not re-added. Shown for context.",
      evidence: [{ label: "IMF PortWatch", url: "https://portwatch.imf.org/datasets/42132aa4e2fc4d41bdaf9a445f688931_0/about" }, { label: "ReliefWeb: Yemen", url: "https://reliefweb.int/country/yem" }] },
  ];
  const convergence = { concurrent: 3, combined: -52, band: "high",
    note: "Two live maritime events (Hormuz, Red Sea) plus the easing Guinea/EGA bauxite dispute. The maritime events are the CAUSES of the chokepoint throughput drops and are counted once there — not re-added; only Guinea (non-maritime) adds a separate, now-residual severity term. The −52 below is gross event severity shown for context, NOT the live-drag input. Hypothetical events (e.g. advanced-silicon access) live only in Scenarios." };

  // ---- Leading indicators --------------------------------------------------
  const indicators = [
    { id: "dolphin", name: "Dolphin gas flow", value: "85", unit: "% of contract", delta: -2, dir: "flat",
      status: "moderate", src: "curated", spark: [88,87,88,86,87,85,86,85], note: "Within normal contractual band." },
    { id: "romembrane", name: "RO membrane stock", value: "47", unit: "of 75 days", delta: -1, dir: "down",
      status: "high", src: "curated", spark: [75,68,62,57,53,50,48,47], note: "Drawing down; reorder lead-time is the watch item." },
    { id: "gpsjam", name: "GPS jamming events", value: "12", unit: "this week", delta: 50, dir: "up",
      status: "high", src: "acled", spark: [4,5,6,5,8,9,11,12], note: "Elevated interference across the lower Gulf." },
    { id: "brent", name: "Brent crude", value: "$93.09", unit: "/ barrel", delta: 4, dir: "up",
      status: "moderate", src: "yfinance", spark: [84,86,85,88,90,91,92,93], note: "Live from market feed. Within normal range." },
    { id: "natgas", name: "Natural gas", value: "$3.23", unit: "/ MMBTU", delta: 1, dir: "flat",
      status: "good", src: "yfinance", spark: [3.1,3.2,3.15,3.18,3.22,3.2,3.21,3.23], note: "Stable. Live market feed." },
    { id: "sanctions", name: "OFAC SDN updates", value: "3", unit: "new this week", delta: 0, dir: "flat",
      status: "moderate", src: "ofac", spark: [1,0,2,1,2,1,0,3], note: "Feeds counterpart-risk adjustment." },
  ];

  // ---- Scenarios -----------------------------------------------------------
  const scenarios = [
    { id: "baseline", name: "Baseline", sub: "No active stress applied", severity: 0,
      deltas: { energy:0, water:0, defence:0, food:0, logistics:0, finance:0, health:0 }, overall: 0 },
    { id: "hormuz", name: "Hormuz closure", sub: "Strait transits collapse to near-zero", severity: 3,
      deltas: { energy:-6, water:-9, defence:-4, food:-3, logistics:-35, finance:0, health:-5 }, overall: -22 },
    { id: "chips", name: "Silicon access cut", sub: "US export controls restrict advanced-silicon access (what-if)", severity: 2,
      deltas: { energy:-3, water:-1, defence:-18, food:0, logistics:-2, finance:0, health:-2 }, overall: -14 },
    { id: "dolphin", name: "Dolphin pressure", sub: "Qatar pipeline gas constrained", severity: 2,
      deltas: { energy:-12, water:-10, defence:-2, food:-1, logistics:-3, finance:0, health:-3 }, overall: -16 },
    { id: "combined", name: "Combined", sub: "Hormuz + Dolphin together", severity: 4,
      deltas: { energy:-7.0, water:-14.6, defence:-6.2, food:-3.4, logistics:-35.0, finance:0.1, health:0.0 }, overall: -36.2 },
    { id: "redsea", name: "Red Sea persistent", sub: "Sustained Bab-el-Mandeb disruption", severity: 2,
      deltas: { energy:-2, water:-1, defence:-2, food:-4, logistics:-14, finance:0, health:-2 }, overall: -9 },
    { id: "max", name: "Combined Maximum", sub: "All shocks at 4× severity (stress test)", severity: 5,
      deltas: { energy:-22, water:-31, defence:-30, food:-12, logistics:-48, finance:-2, health:-14 }, overall: -58 },
  ];

  // ---- Cascade graph (for the signature animation) -------------------------
  // Layered: trigger -> precursor -> asset -> sector -> overall
  const cascade = {
    timeline: [0, 15, 30, 45, 60, 75, 90],
    nodes: [
      { id: "trigger", layer: 0, label: "Hormuz closure", kind: "trigger", day: 0, band: "critical",
        detail: "Naval incident closes the strait. Transit calls fall from a ~110/day norm to single digits within 48 hours." },

      { id: "ro", layer: 1, label: "RO membranes", kind: "precursor", day: 0, band: "high",
        detail: "75-day buffer begins drawing down the moment resupply shipping stops. Consequence weight 0.90." },
      { id: "gas", layer: 1, label: "Piped gas", kind: "precursor", day: 0, band: "high",
        detail: "Dolphin flow is pipeline-fed, but LNG top-ups that balance the grid are sea-borne. Consequence 1.00." },
      { id: "chips", layer: 1, label: "Leading-edge chips", kind: "precursor", day: 15, band: "moderate",
        detail: "90-day buffer; not routed through Hormuz, so it degrades later and only if the shock widens." },

      { id: "taweelah", layer: 2, label: "Taweelah desalination", kind: "asset", day: 45, band: "high",
        detail: "Membrane stock reaches its reorder-threshold line. Output begins to taper as spares draw down." },
      { id: "grid", layer: 2, label: "Power grid", kind: "asset", day: 60, band: "high",
        detail: "Gas balancing tightens; desalination and grid share the same gas envelope, so they move together under load." },

      { id: "water", layer: 3, label: "Water", kind: "sector", day: 45, band: "critical",
        detail: "Desalination is the spine of water supply. Day-to-day demand is met from operational storage; the 90-day federal strategic reserve then covers essential supply, at a reduced rate — a deep safety net rather than full-demand cover." },
      { id: "energy", layer: 3, label: "Energy", kind: "sector", day: 60, band: "high",
        detail: "Gas-for-power and gas-for-water draw on the same envelope. The grid de-rates to keep desalination supplied." },
      { id: "food", layer: 3, label: "Food", kind: "sector", day: 75, band: "moderate",
        detail: "Cold-chain and irrigation depend on water + power, following the water signal by ~30 days." },

      { id: "overall", layer: 4, label: "National score", kind: "overall", day: 90, band: "critical",
        detail: "Non-compensatory aggregation: with Water under load, the overall score stays anchored to it regardless of strong sectors." },
    ],
    edges: [
      ["trigger","ro"], ["trigger","gas"], ["trigger","chips"],
      ["ro","taweelah"], ["gas","grid"], ["gas","taweelah"],
      ["taweelah","water"], ["grid","energy"], ["grid","water"],
      ["water","food"], ["water","overall"], ["energy","overall"], ["food","overall"],
    ],
  };

  // Chips cascade narrative (Dependencies deep-dive)
  const chipTimeline = [
    { day: 45, text: "EDGE Group production begins to slow", band: "moderate" },
    { day: 60, text: "Guided-systems manufacturing stalls", band: "high" },
    { day: 90, text: "Full production halt — Defence DRI +35", band: "critical" },
  ];

  // ---- Threat actors -------------------------------------------------------
  const actors = [
    { id: "iran", name: "Iran", confidence: 70, vector: "Military posturing in the Gulf", band: "critical" },
    { id: "houthi", name: "Houthis", confidence: 40, vector: "Autonomous attacks on shipping", band: "high" },
    { id: "cyber", name: "Cyber actors", confidence: 30, vector: "Coordinated infrastructure intrusion", band: "high" },
    { id: "china", name: "China", confidence: 20, vector: "Technology / export leverage", band: "moderate" },
    { id: "russia", name: "Russia", confidence: 15, vector: "Geopolitical opportunism", band: "moderate" },
    { id: "climate", name: "Climate", confidence: 25, vector: "Heat / desalination demand spikes", band: "moderate" },
  ];

  // ---- Control layer -------------------------------------------------------
  const sovereign = [
    { name: "ADIA", aum: 1000, liquidity: "High", deployable: 350 },
    { name: "ICD", aum: 320, liquidity: "Medium", deployable: 90 },
    { name: "Mubadala", aum: 280, liquidity: "Medium", deployable: 100 },
    { name: "L'IMAD / ADQ", aum: 199, liquidity: "Medium", deployable: 60 },
    { name: "Dubai Holding", aum: 130, liquidity: "Low", deployable: 25 },
    { name: "EIA", aum: 87, liquidity: "High", deployable: 40 },
    { name: "RAK Investment", aum: 12, liquidity: "Low", deployable: 3 },
  ];
  const foreignAssets = [
    { name: "GlobalFoundries", country: "United States", host: "Low", eff: 0.95 },
    { name: "Milrem Robotics", country: "Estonia", host: "Medium", eff: 0.70 },
    { name: "DP World terminals", country: "Multiple", host: "Medium", eff: 0.75 },
    { name: "Masdar projects", country: "Multiple", host: "Low", eff: 0.88 },
    { name: "Fertiglobe", country: "Egypt / NL", host: "Medium", eff: 0.72 },
  ];
  const agreements = [
    { name: "Dolphin gas", partner: "Qatar", expiry: "2032", status: "Active", urgent: false },
    { name: "123 Agreement", partner: "United States", expiry: "Indefinite", status: "Active", urgent: false },
    { name: "CEPA transit", partner: "India", expiry: "2027", status: "Active", urgent: true },
    { name: "Defence framework", partner: "France", expiry: "2029", status: "Active", urgent: false },
    { name: "Food corridor", partner: "Sudan", expiry: "2026", status: "At risk", urgent: true },
  ];
  const obligations = [
    "Enrichment ban (IAEA safeguards)",
    "Technology alignment (US export controls)",
    "End-user controls (arms sanctions regime)",
    "CEPA transit rights (regional)",
  ];
  const workforce = [
    { skill: "Power-grid operators", origin: "India 65% · Egypt 20%", risk: "HIGH" },
    { skill: "Desalination technicians", origin: "India 50% · Pakistan 25%", risk: "HIGH" },
    { skill: "Hospital staff", origin: "India 45% · Philippines 30%", risk: "MEDIUM" },
    { skill: "Port / logistics crews", origin: "India 40% · Bangladesh 30%", risk: "MEDIUM" },
    { skill: "Aviation maintenance", origin: "EU 35% · India 30%", risk: "MEDIUM" },
    { skill: "Nuclear operations", origin: "S. Korea 40% · domestic 35%", risk: "LOW" },
  ];

  // ---- Operationalize ------------------------------------------------------
  // National strategic water reserve — consolidated federal figure. Abu Dhabi
  // (Liwa) and Dubai (DEWA ASR) operate 90-day desalinated-water reserves, among
  // the largest in the world. Reported as one federal essential-supply duration;
  // not broken out per emirate.
  const water = {
    days: 90,
    label: "National strategic water reserve",
    note: "The UAE operates 90-day strategic desalinated-water reserves — Abu Dhabi's Liwa Strategic Water Reserve (the world's largest desalinated-water aquifer store) and DEWA's Aquifer Storage & Recovery in Dubai (the world's largest potable ASR). These cover essential supply for up to 90 days, with day-to-day demand met from operational storage — a deep safety net behind normal operations.",
    evidence: [
      { label: "Abu Dhabi — Gulf News", url: "https://gulfnews.com/uae/environment/abu-dhabi-completes-worlds-largest-desalinated-water-reserve-1.2157536" },
      { label: "Dubai — DEWA", url: "https://www.dewa.gov.ae/en/about-us/media-publications/latest-news/2022/03/dewa-completes-construction-of-the-first-stage-of-the-asr-project" },
    ],
  };
  const health = {
    apis: "60-day buffer · India 65% source",
    vaccines: "180-day buffer · US / EU",
    devices: "45-day buffer · China 40%",
    beds: "14,000 hospital beds",
    threshold: "Critical shortage threshold: 21 days (ICU consumables)",
  };
  const validation = [
    { event: "Guinea seizure", predicted: -8, actual: -6, accuracy: "MODERATE" },
    { event: "Hormuz escalation", predicted: -40, actual: -40, accuracy: "HIGH" },
    { event: "Chip embargo", predicted: -18, actual: null, accuracy: "UNTESTED" },
    { event: "Red Sea Houthi", predicted: -8, actual: -5, accuracy: "MODERATE" },
  ];
  const roadmap = [
    { part: "Dependencies mapped", pct: 70 },
    { part: "SWF buffer model", pct: 100 },
    { part: "Cascade engine", pct: 95 },
    { part: "Live data feeds", pct: 100 },
    { part: "Control layer", pct: 100 },
    { part: "Multi-scenario", pct: 100 },
    { part: "Response & pre-mortem", pct: 90 },
    { part: "Automation", pct: 85 },
    { part: "Calibration & tuning", pct: 30 },
  ];

  // ---- Data sources / freshness -------------------------------------------
  const sources = {
    acled:    { label: "ACLED", full: "Armed Conflict Location & Event Data", endpoint: "ACLED API · Gulf & Red Sea geofilter", url: "https://acleddata.com/explorer/", cadence: "5 min", fresh: "2 min ago", kind: "live" },
    ais:      { label: "PortWatch", full: "IMF PortWatch · daily chokepoint transit calls (satellite AIS, ~90k ships)", endpoint: "services9.arcgis.com · Daily_Chokepoints_Data · transit calls vs 12-month norm", url: "https://portwatch.imf.org/", cadence: "weekly (Tue)", fresh: "live", kind: "live" },
    yfinance: { label: "Markets", full: "Oil & gas prices (yfinance)", endpoint: "Yahoo Finance · BZ=F, NG=F", url: "https://finance.yahoo.com/quote/BZ=F", cadence: "5 min", fresh: "1 min ago", kind: "live" },
    ofac:     { label: "OFAC", full: "US Treasury SDN sanctions list", endpoint: "treasury.gov SDN delta feed", url: "https://sanctionssearch.ofac.treas.gov/", cadence: "6 h", fresh: "2 h ago", kind: "live" },
    meteo:    { label: "Open-Meteo", full: "Marine & weather (Open-Meteo, live)", endpoint: "marine-api.open-meteo.com · wave height · wind · temperature", url: "https://open-meteo.com/", cadence: "10 min", fresh: "live", kind: "live" },
    gdelt:    { label: "GDELT", full: "Global news monitor (GDELT, live)", endpoint: "api.gdeltproject.org · trade-route, closure & conflict news · 15-min", url: "https://www.gdeltproject.org/", cadence: "15 min", fresh: "live", kind: "live" },
    curated:  { label: "Curated", full: "Hand-curated public-source CSV", endpoint: "versioned CSV · public reporting", url: "", cadence: "manual", fresh: "reviewed", kind: "curated" },
    assumption:{ label: "Assumption", full: "Explicit modelling assumption", endpoint: "stated in assumptions ledger", url: "", cadence: "—", fresh: "stated", kind: "assumption" },
  };

  // ---- Assets (for map) ----------------------------------------------------
  const assets = [
    { id: "jebelali", name: "Jebel Ali Port", lat: 25.0, lng: 55.06, weight: 1.0, kind: "port", note: "60% of national imports" },
    { id: "barakah", name: "Barakah Nuclear", lat: 23.97, lng: 52.23, weight: 0.9, kind: "energy", note: "5.6 GW baseload" },
    { id: "taweelah", name: "Taweelah Desalination", lat: 24.78, lng: 54.7, weight: 0.95, kind: "water", note: "World's largest RO plant" },
    { id: "fujairah", name: "Fujairah Terminal", lat: 25.17, lng: 56.33, weight: 0.85, kind: "port", note: "Off-Gulf oil export bypass" },
    { id: "ruwais", name: "Ruwais Refinery", lat: 24.11, lng: 52.73, weight: 0.8, kind: "energy", note: "Downstream hub" },
    { id: "dubaiwater", name: "Dubai water network", lat: 25.2, lng: 55.27, weight: 0.7, kind: "water", note: "Thin operational surface storage, backed by the 90-day federal strategic reserve" },
    { id: "portrashid", name: "Port Rashid", lat: 25.32, lng: 55.33, weight: 0.4, kind: "port", note: "Dubai's original port — now cruise & heritage; cargo long since consolidated into Jebel Ali" },
  ];

  return {
    BANDS, band, headline, sectors, precursors, chokepoints, shocks, convergence,
    indicators, scenarios, cascade, chipTimeline, actors, sovereign, foreignAssets,
    agreements, obligations, workforce, water, health, validation, roadmap, sources, assets,
  };
})();
