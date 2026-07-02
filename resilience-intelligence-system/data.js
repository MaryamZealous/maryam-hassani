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
    { key: "high",     label: "STRAINED", min: 40, max: 60,  desc: "Operating under load, with cascade exposure to watch" },
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
      formula: "0.60 × most-exposed sector (exposure)  +  0.40 × capacity (Absorb · Recover · Adapt)",
      cap: { at: 72, label: "frontier ~72", lead: "100 is a phantom ceiling", body: "— no trade economy reaches it. The marked ≈72 frontier is a stated goalpost (an assumption, not a computed value): the realistic ceiling for an open, import-dependent economy. It anchors the axis only — no score is derived from it. This is also the ceiling Live Resilience recovers toward." },
      explain: "Structural Resilience: how well the system copes on a calm day, before today's events. Following the vulnerability-vs-resilience logic used for small, open, import-dependent economies, it sets the country's capacity — what it can absorb, how fast it recovers, and its ability to adapt — against its exposure, the most-exposed sector. It moves over months as buffers, sovereign depth and structural builds change, and is independent of today's events. It is also the ceiling the live score recovers toward. On the 0–100 axis, 100 = total self-sufficiency (no trade economy reaches it); ≈72 marks a realistic frontier.",
      // NOTE: value/prev are seeds only — computeSpine() overwrites value (and
      // recomputes prev to preserve the displayed 30-day delta) from the
      // dependency data, and replaces `inputs` with the computed decomposition.
      // The literals below are illustrative of the shape, not the live numbers.
      inputs: [
        { k: "Exposure — most-exposed sector", v: "most-exposed sector score (weak link)", src: "curated" },
        { k: "Capacity", v: "Absorb · Recover · Adapt → blend", src: "curated" },
        { k: "Anchored result", v: "0.60 × most-exposed + 0.40 × capacity" },
      ],
      assumption: "Structural Resilience = 0.60 × most-exposed sector + 0.40 × capacity blend — non-compensatory, so a concentrated weak point can't be fully averaged away by strong capacity. Capacity is equal-weighted across Absorb (consequence-weighted buffers vs a 90-day benchmark), Recover (sovereign firepower + how easily inputs re-source) and Adapt (sectors with a credible structural plan). The 0.60 anchor weight and 90-day benchmark are editable assumptions. The ≈72 frontier marked on the axis is a separate display goalpost, not an input to any score.",
    },
    live: {
      value: 47.0, prev: 44.5,
      name: "Live Resilience",
      tag: "Daily · below the ceiling",
      horizon: "24h",
      formula: "Structural ceiling  −  today's active load (live)",
      // cap + inputs[0] below are seeds; computeSpine() overwrites them with the
      // computed ceiling so the displayed ceiling always equals Structural.
      cap: { at: 55, label: "ceiling = baseline", lead: "Tracking toward your baseline", body: "— live sits below the structural ceiling by the size of today's active load. As that load clears, it climbs back to full strength." },
      explain: "How resilient the system is to today's conditions — the structural ceiling minus the active load from what's happening now, not a free-floating number. On a calm day it sits at the ceiling; live pressure lowers it. The gap between this and the ceiling is the headline signal: a wide gap shows where to focus today, a narrow gap means the country is operating close to its fundamentals.",
      inputs: [
        { k: "Structural ceiling", v: "the day's maximum", src: "curated" },
        { k: "Maritime throughput", v: "Hormuz / Red Sea / Suez transit calls vs each strait's 12-month norm (IMF PortWatch)", src: "ais" },
        { k: "Trade-route news", v: "above-normal closure / conflict coverage on the sea routes", src: "gdelt" },
        { k: "Partner-supply news", v: "adverse coverage of a single- or few-source partner (Qatar gas, Taiwan chips, Kazakhstan fuel, China, India) — negative-sentiment gated", src: "gdelt" },
        { k: "Energy-market stress", v: "Brent and the Brent-linked LNG replacement cost above their stress marks", src: "yfinance" },
        { k: "Live = ceiling − active load", v: "recomputed every refresh from the live drivers", src: "curated" },
      ],
      assumption: "Live Resilience = structural ceiling − today's active load. Maritime disruption enters through measured vessel throughput, which already reflects how carriers reroute as tension rises — so the Hormuz and Red Sea events shown elsewhere are the causes of that measured drop, presented for context, and are not added to the score a second time.",
    },
  };

  // ---- 7 sectors -----------------------------------------------------------
  // Sector scores, topRisk / topDRI and precursor counts are all COMPUTED by
  // computeSpine() from the precursor data below — they are NOT set here. The
  // only editable inputs are the display name, the 30-day `trend` (the point
  // change the arrow shows, preserved across recompute) and the plain note.
  const sectors = [
    { id: "energy", name: "Energy", trend: -1.7,
      note: "Power and desalination draw on one shared gas envelope, so they move together under load. The acute exposure is gas-side: piped Dolphin gas from Qatar is the highest-consequence input in the model — and because Dolphin is a fixed subsea pipeline (not a maritime chokepoint), and UAE crude exports bypass Hormuz via the Fujairah pipeline, Energy carries no oil-import chokepoint penalty. Its risk is single-counterpart concentration and a contract→oil-linked price-basis flip, not a Strait-of-Hormuz crude story. Grid transformers and LEU fuel round out the legacy imports. The clean-energy buildout adds a newer class of dependency — solar PV, battery storage and copper — that swaps some gas-reliance for China-concentrated processing risk." },
    { id: "water", name: "Water", trend: 0.5,
      note: "Desalination rests on two specialised imports: RO membranes (a competitive-but-concentrated field) and energy-recovery devices (one dominant US supplier). The binding constraint is reorder lead-time against buffers, not overnight single-source failure." },
    { id: "defence", name: "Defence", trend: 0,
      note: "Guided-systems production leans on advanced silicon. The binding risk is US export-control licensing, not Taiwanese supply — a channel that eased in late 2025." },
    { id: "food", name: "Food", trend: 0.7,
      note: "Diversified sourcing and strategic reserves give the deepest buffer of any sector." },
    { id: "logistics", name: "Logistics", trend: -4.2,
      note: "~60% of imports land at Jebel Ali, inside the strait; crude exports bypass via Fujairah. Hormuz import-exposure — containerised goods into Jebel Ali — is the dominant variable, partly offset by air-cargo prioritisation." },
    { id: "finance", name: "Finance", trend: 0.1,
      note: "Finance's tracked imports are financial rails, not goods: dollar-clearing access and SWIFT messaging — both foreign-controlled and sanctions-exposed — plus gold doré refining feedstock. The UAE's exceptional sovereign-wealth depth is the offsetting strength, and it sits in coping capacity rather than here." },
    { id: "health", name: "Health", trend: -0.3,
      note: "APIs concentrate 65% in India; vaccine stock is deep but device supply is thin." },
  ];

  // ---- Critical imports (precursors) --------------------------------------
  const precursors = [
    { id: "leu", name: "LEU fuel", sector: "energy", source: "Kazakhstan", buffer: 540, cfac: { ess: 0.90, svc: 0.85, imm: 0.30, brd: 0.55 }, dri: 44,
      dims: { concentration: 22, substitutability: 12, route: 6, counterpart: 4 }, hormuz: false, dolphin: false,
      note: "Long-lead nuclear fuel for Barakah. No near-term alternative, but enormous buffer." },
    { id: "chips", name: "Leading-edge chips", sector: "defence", source: "Taiwan", buffer: 90, cfac: { ess: 0.80, svc: 0.80, imm: 0.60, brd: 0.50 }, dri: 66,
      dims: { concentration: 23, substitutability: 22, route: 6, counterpart: 15 }, hormuz: false, dolphin: false,
      note: "Fabrication concentrates in Taiwan, but the access risk is US export-control licensing, not a supply halt — a channel that eased in Nov 2025 when the US approved G42 to import advanced Nvidia silicon. Feeds EDGE Group guided-systems lines." },
    { id: "ro", name: "RO membranes", sector: "water", source: "Japan / US / Korea", buffer: 75, cfac: { ess: 1.00, svc: 0.90, imm: 0.60, brd: 0.85 }, dri: 55,
      dims: { concentration: 16, substitutability: 16, route: 13, counterpart: 10 }, hormuz: false, dolphin: false,
      note: "Competitive but concentrated field — DuPont (US), Toray & Nitto (Japan), LG (Korea) hold ~58% between the top three. Gulf desalination already runs largely on Toray membranes, and regional production is localising (Veolia–Alkhorayef, Saudi, 2026). The binding risk is the ~120-day reorder lead-time vs a 75-day buffer — not single-source failure." },
    { id: "erd", name: "Energy-recovery devices", sector: "water", source: "US (Energy Recovery Inc.)", buffer: 270, cfac: { ess: 0.90, svc: 0.70, imm: 0.30, brd: 0.80 }, dri: 49,
      dims: { concentration: 20, substitutability: 17, route: 4, counterpart: 8 }, hormuz: false, dolphin: false,
      note: "The isobaric pressure-exchangers that recover energy from reject brine and cut SWRO power use by up to ~60% — without them desalination still runs, but at a far higher energy cost. The market is dominated by one US supplier (Energy Recovery Inc.); Flowserve and Danfoss are partial alternatives. Concentration is high, but the units are durable installed capital — a supply cut bites slowly (new builds and major repairs), not overnight, which is why immediacy is low." },
    { id: "waterchem", name: "Desalination dosing chemicals", sector: "water", source: "US / EU / regional", buffer: 30, cfac: { ess: 0.95, svc: 0.85, imm: 0.90, brd: 0.70 }, dri: 62,
      dims: { concentration: 18, substitutability: 16, route: 11, counterpart: 7 }, hormuz: true, dolphin: false,
      note: "The continuous chemical feed every desalination train depends on: antiscalants injected into RO feed-water to stop membrane scaling, chlorine / sodium hypochlorite for disinfection, coagulants (ferric chloride) and pH adjusters (sulphuric acid, caustic soda). Specialty antiscalants come from a handful of qualified suppliers (Nalco/Ecolab, BASF, Avista) and can't be swapped without re-validation. Short shelf lives cap how much can be stockpiled, so the buffer is genuinely thin — and without dosing, RO membranes foul and scale within days, not months. A high-consequence, thin-buffer water input the original list missed." },
    { id: "gas", name: "Piped gas (Dolphin)", sector: "energy", source: "Qatar", buffer: 30, cfac: { ess: 1.00, svc: 1.00, imm: 1.00, brd: 1.00 }, dri: 61,
      dims: { concentration: 23, substitutability: 18, route: 2, counterpart: 18 }, hormuz: false, dolphin: true,
      note: "25% of gas for power + water; contract runs to 2032. The genuine exposure is gas-side and counterpart-driven, not a maritime chokepoint: Dolphin is a fixed subsea pipeline from Qatar, so route/chokepoint exposure is low (it does not transit Hormuz). What carries the risk is single-counterpart concentration (one neighbour, one corridor) and the price BASIS — losing Dolphin reprices the marginal molecule from a fixed ~$1.50/MMBtu contract to oil-linked LNG (~12.5% of Brent, ≈8× the floor). Highest consequence weight in the model. UAE crude exports bypass Hormuz via Fujairah, so the energy line carries no oil-import chokepoint penalty — its acute exposure is gas feedstock." },
    { id: "api", name: "Active pharma ingredients", sector: "health", source: "India", buffer: 60, cfac: { ess: 0.90, svc: 0.75, imm: 0.70, brd: 0.60 }, dri: 55,
      dims: { concentration: 21, substitutability: 16, route: 10, counterpart: 8 }, hormuz: true, dolphin: false,
      note: "65% sourced from India. Hospital pharmacology depends on uninterrupted flow." },
    { id: "potash", name: "Potash (fertilizer)", sector: "food", source: "Canada / Russia", buffer: 120, cfac: { ess: 0.50, svc: 0.55, imm: 0.20, brd: 0.30 }, dri: 38,
      dims: { concentration: 14, substitutability: 9, route: 9, counterpart: 6 }, hormuz: false, dolphin: false,
      note: "Potassium fertiliser input for domestic agriculture. Reasonably diversified." },
    { id: "vaccines", name: "Vaccines", sector: "health", source: "US / EU", buffer: 180, cfac: { ess: 0.80, svc: 0.60, imm: 0.40, brd: 0.55 }, dri: 31,
      dims: { concentration: 12, substitutability: 8, route: 7, counterpart: 4 }, hormuz: false, dolphin: false,
      note: "Deep 180-day cold-chain buffer from diversified Western suppliers." },
    { id: "devices", name: "Medical devices", sector: "health", source: "China", buffer: 45, cfac: { ess: 0.75, svc: 0.60, imm: 0.60, brd: 0.50 }, dri: 49,
      dims: { concentration: 18, substitutability: 14, route: 10, counterpart: 7 }, hormuz: true, dolphin: false,
      note: "40% from China with a thin 45-day buffer. Counterpart risk rising." },
    { id: "transformers", name: "Grid transformers", sector: "energy", source: "South Korea / EU", buffer: 240, cfac: { ess: 0.90, svc: 0.60, imm: 0.50, brd: 0.70 }, dri: 41,
      dims: { concentration: 15, substitutability: 13, route: 8, counterpart: 5 }, hormuz: false, dolphin: false,
      note: "Long-lead high-voltage transformers. Failure cascades to desalination." },
    { id: "turbines", name: "Turbine hot-section & large pumps", sector: "energy", source: "US / EU / Japan (GE · Siemens · Mitsubishi)", buffer: 120, cfac: { ess: 0.95, svc: 0.85, imm: 0.55, brd: 0.80 }, dri: 50,
      dims: { concentration: 22, substitutability: 22, route: 8, counterpart: 10 }, hormuz: false, dolphin: false,
      note: "The rotating equipment the power-and-water fleet actually runs on: gas-turbine hot-section components (blades, vanes, combustors) and the large SWRO / cooling pumps. Three OEMs — GE, Siemens, Mitsubishi — hold almost the entire qualified field, parts are proprietary and can't be cross-fitted, and lead times run 12–24 months. N+1 redundancy and held spares cushion a single failure, so immediacy is moderate — but a fleet-wide hot-section campaign or an OEM / export-control cut-off takes generation AND desalination capacity offline, not merely up in cost. For a power-and-water utility this is a structural exposure, arguably deeper than several legacy items on the list." },
    { id: "solarpv", name: "Solar PV modules", sector: "energy", source: "China (polysilicon → module)", buffer: 180, cfac: { ess: 0.55, svc: 0.45, imm: 0.20, brd: 0.55 }, dri: 52,
      dims: { concentration: 22, substitutability: 14, route: 8, counterpart: 8 }, hormuz: true, dolphin: false,
      note: "The UAE's clean-energy pivot (Mohammed bin Rashid & Al Dhafra solar parks, Masdar, Net Zero 2050) runs on PV modules whose upstream — polysilicon, wafers, cells — concentrates ~80%+ in China. Straight from Material World's sand→silicon thread: a sun-rich desert state, yet the panels that harvest the sun are a China-processing dependency. Low immediacy — modules are durable installed capital, so a supply cut delays NEW capacity rather than darkening existing plants — making this a forward-looking buildout risk, not an acute one." },
    { id: "libattery", name: "Battery storage cells", sector: "energy", source: "China (Li-ion cells)", buffer: 150, cfac: { ess: 0.50, svc: 0.40, imm: 0.25, brd: 0.50 }, dri: 58,
      dims: { concentration: 24, substitutability: 15, route: 8, counterpart: 11 }, hormuz: true, dolphin: false,
      note: "Grid-scale storage is what lets the solar buildout keep supplying after dark — Masdar's record 24/7 solar-plus-storage projects are gigawatt-hour scale. Lithium-ion cells and their refined lithium / graphite / cathode inputs concentrate heavily in China. Conway's flagship transition material: as it decarbonises, the UAE swaps some gas-dependence for battery-supply dependence. Installed-capital dynamics keep immediacy low; the exposure grows with every GWh added." },
    { id: "copper", name: "Copper (cathode / rod)", sector: "energy", source: "Chile / Zambia → traded", buffer: 90, cfac: { ess: 0.70, svc: 0.55, imm: 0.40, brd: 0.65 }, dri: 40,
      dims: { concentration: 14, substitutability: 12, route: 9, counterpart: 5 }, hormuz: false, dolphin: false,
      note: "The metal Material World calls the bottleneck of electrification — every solar farm, battery, EV charger and grid upgrade is copper-hungry. The UAE mines none; refined cathode and rod feed Ducab's cabling and the federal grid expansion. More diversified than the China-processed inputs (globally traded, multiple sources), so route and counterpart risk are lower — but Conway's warning is the structural one: demand outruns new supply over the decade ahead." },
    { id: "wheat", name: "Wheat", sector: "food", source: "Russia / Australia", buffer: 150, cfac: { ess: 0.70, svc: 0.50, imm: 0.30, brd: 0.60 }, dri: 34,
      dims: { concentration: 13, substitutability: 7, route: 9, counterpart: 5 }, hormuz: false, dolphin: false,
      note: "Strategic reserves plus diversified sourcing keep this comfortable." },
    { id: "gps", name: "Timing / GNSS modules", sector: "defence", source: "United States", buffer: 90, cfac: { ess: 0.75, svc: 0.70, imm: 0.80, brd: 0.50 }, dri: 47,
      dims: { concentration: 17, substitutability: 13, route: 11, counterpart: 6 }, hormuz: false, dolphin: false,
      note: "Precision-timing modules. Vulnerable to GPS-jamming spikes in the Gulf." },
    { id: "avparts", name: "Aviation spares", sector: "logistics", source: "US / EU", buffer: 60, cfac: { ess: 0.65, svc: 0.60, imm: 0.60, brd: 0.50 }, dri: 43,
      dims: { concentration: 14, substitutability: 12, route: 11, counterpart: 6 }, hormuz: false, dolphin: false,
      note: "Keeps air-bridge capacity alive when sea routes degrade." },
    { id: "container", name: "Containerised imports (Hormuz)", sector: "logistics", source: "Asia via Hormuz", buffer: 45, cfac: { ess: 0.80, svc: 0.80, imm: 0.70, brd: 0.85 }, dri: 45,
      dims: { concentration: 11, substitutability: 13, route: 18, counterpart: 3 }, hormuz: true, dolphin: false,
      note: "The bulk of containerised consumer & industrial goods arrive at Jebel Ali, which sits inside the Gulf — so they are Hormuz-locked. Fujairah (on the Gulf of Oman, outside the strait) is a partial bypass but a fraction of Jebel Ali's box capacity, which is why route exposure dominates this line." },
    { id: "golddore", name: "Gold doré", sector: "finance", source: "Africa (various)", buffer: 30, cfac: { ess: 0.20, svc: 0.30, imm: 0.25, brd: 0.15 }, dri: 22,
      dims: { concentration: 8, substitutability: 6, route: 5, counterpart: 3 }, hormuz: false, dolphin: false,
      note: "Refining feedstock for Dubai's gold trade. Low national-consequence weight — the bottom of the scale." },
    { id: "usdclearing", name: "USD clearing access", sector: "finance", source: "US correspondent banks", buffer: 21, cfac: { ess: 0.90, svc: 0.85, imm: 0.85, brd: 0.90 }, dri: 40,
      dims: { concentration: 14, substitutability: 15, route: 1, counterpart: 10 }, hormuz: false, dolphin: false,
      note: "Correspondent-banking access to dollar settlement — the rail under most cross-border trade. Counterpart-driven: the UAE sat on the FATF 'grey list' Feb 2022–Feb 2024, a documented reminder that this access is a live permission, not a stockpile. The dirham's USD peg deepens the dependence; CIPS/euro rails are only partial substitutes, hence high substitution difficulty." },
    { id: "swift", name: "Cross-border messaging (SWIFT)", sector: "finance", source: "SWIFT (Belgium)", buffer: 30, cfac: { ess: 0.65, svc: 0.60, imm: 0.70, brd: 0.65 }, dri: 33,
      dims: { concentration: 12, substitutability: 11, route: 1, counterpart: 9 }, hormuz: false, dolphin: false,
      note: "Foreign-controlled financial messaging that instructs the settlement above. Distinct mechanism from clearing — messaging, not money — and sanctions-exposed, as 2022 SWIFT disconnections elsewhere showed. Domestic and regional alternatives exist but at reduced reach." },
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
    { id: "hormuz", name: "Hormuz tension", short: "Hormuz", sector: "logistics", impact: -20, band: "high",
      src: "acled", when: "ongoing", note: "Gulf naval tension is the most-cited driver behind the strait's depressed transits. Because it is the cause of the throughput drop shown on the chokepoint card, its effect reaches the score through that measured IMF PortWatch vessel data — the severity figure here is context, not a second deduction. The Fujairah pipeline and air cargo blunt the crude-export hit.",
      evidence: [{ label: "IMF PortWatch", url: "https://portwatch.imf.org/datasets/42132aa4e2fc4d41bdaf9a445f688931_0/about" }, { label: "EIA chokepoints", url: "https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints" }, { label: "Live vessel traffic", url: "https://www.marinetraffic.com/en/ais/home/centerx:56.5/centery:26.5/zoom:8" }] },
    { id: "redsea", name: "Red Sea Houthi activity", short: "Red Sea", sector: "logistics", impact: -8, band: "moderate",
      src: "acled", when: "ongoing", note: "The Houthi drone and missile threat that pushed carriers off the route — the cause of the Red Sea transit drop. Its effect reaches the score through the measured throughput data; the severity figure here is shown for context.",
      evidence: [{ label: "IMF PortWatch", url: "https://portwatch.imf.org/datasets/42132aa4e2fc4d41bdaf9a445f688931_0/about" }, { label: "ReliefWeb: Yemen", url: "https://reliefweb.int/country/yem" }] },
  ];
  const convergence = { concurrent: 2, band: "high",
    note: "Two concurrent maritime events — Hormuz and the Red Sea. Both reach the score through the measured throughput drop they cause, so the load is the drop in vessel transits, nothing added on top. Per-event severity figures are shown for context only." };

  // ---- Buffer-day provenance ----------------------------------------------
  // The buffer figures are CURATED estimates, not a live inventory feed. Tag
  // each: "stated" = reflects reported policy / public figure; "est" = analyst
  // order-of-magnitude judgement. Surfaced in the Critical imports list and the
  // dependency drawer so a hardcoded day-count never implies false precision.
  const BUFFER_PROV = {
    leu:       { t: "stated", n: "ENEC holds multiple Barakah fuel reloads — long-lead nuclear fuel stockpile (reported)." },
    wheat:     { t: "stated", n: "UAE strategic grain reserve — reported national-stockpile policy." },
    waterchem: { t: "est", n: "Plant dosing-chemical stock is only weeks of continuous use — short shelf lives cap how much can be held." },
    turbines:  { t: "est", n: "Critical-spares inventory plus N+1 fleet redundancy; high-value hot-section parts are stocked sparingly against 12–24-month lead times." },
    chips:     { t: "est", n: "Estimate — access is export-licence-gated, not a physical stock; the buffer stands in for licensing latency." },
    ro:        { t: "est", n: "Estimate set against the ~120-day reorder lead-time, not a measured warehouse count." },
    erd:       { t: "est", n: "Estimate — durable installed capital; a supply cut bites over rebuild cycles, not days." },
    gas:       { t: "est", n: "Nominal — Dolphin is piped, not stored; the figure stands in for switchover latency to LNG, not a tank level." },
    api:       { t: "est", n: "Analyst estimate of hospital/distributor working stock." },
    potash:    { t: "est", n: "Analyst estimate — diversified sourcing, seasonal." },
    vaccines:  { t: "est", n: "Cold-chain reserve estimate from diversified Western suppliers." },
    devices:   { t: "est", n: "Analyst estimate — thin working stock." },
    transformers: { t: "est", n: "Estimate reflecting long-lead spares, not a measured count." },
    solarpv:   { t: "est", n: "Buildout estimate — affects new capacity, not running plants." },
    libattery: { t: "est", n: "Buildout estimate — installed-capital dynamics." },
    copper:    { t: "est", n: "Analyst estimate — globally traded, multiple sources." },
    gps:       { t: "est", n: "Analyst estimate of module working stock." },
    avparts:   { t: "est", n: "Analyst estimate of aviation-spares pipeline." },
    container: { t: "est", n: "Analyst estimate — flow-through goods, little standing buffer." },
    golddore:  { t: "est", n: "Analyst estimate — refining feedstock, low national consequence." },
    usdclearing: { t: "est", n: "Nominal — dollar-clearing is a live permission, not a stockpile; the day-count is a notional grace period." },
    swift:     { t: "est", n: "Nominal — messaging access is a permission, not a stockpile." },
  };
  precursors.forEach((p) => { p.bufferProv = BUFFER_PROV[p.id] || { t: "est", n: "Analyst estimate." }; });

  // ---- Leading indicators --------------------------------------------------
  const indicators = [
    { id: "brent", name: "Brent crude", value: "$93.09", unit: "/ barrel", delta: 4, dir: "up",
      status: "moderate", src: "yfinance", spark: [84,86,85,88,90,91,92,93], note: "Live from market feed. Within normal range." },
    { id: "gasbasis", name: "Gas — replacement basis", value: "$12.0", unit: "/ MMBtu marginal", delta: 0, dir: "flat",
      status: "moderate", src: "curated", twoState: true, spark: [11.3,11.6,11.4,11.8,12.1,11.9,12.0,12.0],
      note: "Two price worlds at once. Contracted Dolphin gas sits at a fixed ~$1.50/MMBtu floor; the molecule that would replace it if Dolphin failed is sea-borne LNG, priced at ~12.5% of Brent (~$12 today, ≈8× the floor). The exposure is a price-BASIS flip from contract to oil-linked, not a volume gap against a buffer. Henry Hub (US ~$3) is the wrong benchmark for the UAE and is not used here." },
    { id: "sanctions", name: "OFAC SDN updates", value: "2", unit: "new designations · partner-dependency risk", delta: 0, dir: "flat",
      status: "moderate", src: "ofac", spark: [1,0,2,1,2,1,0,3],
      note: "Counts entities and individuals added this week to the US Treasury OFAC Specially Designated Nationals (SDN) list that touch UAE-relevant counterparties — banks, trading houses, shipping and front companies operating in or through the Emirates. New designations can freeze dollar-clearing access and force counterparties to be dropped, so this feeds the counterpart-risk adjustment on the finance and logistics dependencies.",
      fx: { kicker: "Leading indicator · live feed", title: "OFAC SDN updates — new UAE-linked designations",
        text: "This tracks additions to the US Treasury's Specially Designated Nationals (SDN) list — the sanctions roster that bars US persons and the dollar system from dealing with the named party. The count shown is new designations this week that are relevant to UAE counterparties: entities or individuals in banking, commodity trading, shipping or corporate fronts operating in or through the Emirates. It is an early-warning signal because a fresh designation can abruptly cut a counterparty's dollar-clearing access and force UAE firms to unwind exposure.",
        formula: "Value  =  count of new UAE-relevant SDN additions in the trailing 7 days",
        inputs: [
          { k: "Source list", v: "US Treasury OFAC SDN list", src: "ofac" },
          { k: "Filter", v: "designations touching UAE-linked counterparties (banking / trade / shipping)" },
          { k: "Window", v: "new additions in the trailing 7 days" },
          { k: "Why it matters", v: "a designation can freeze dollar-clearing and force counterparty exits" },
        ],
        assumption: "The UAE-relevance filter is a curated judgement over the raw SDN delta feed — not every global designation is counted, only those with a plausible UAE counterparty nexus." } },
  ];

  // ---- Two-state gas pricing node -----------------------------------------
  // Replaces the single Henry Hub print. The UAE lives in two gas-price worlds:
  // a fixed contracted Dolphin floor, and an oil-indexed marginal replacement
  // (LNG ≈ slope × Brent + shipping). Losing Dolphin is a price-BASIS flip, not
  // a volume gap. marginal/multiple are refreshed every tick by live.js from
  // live Brent. floor ~$1.30–1.50/MMBtu is a widely-reported estimate (MEES,
  // MEED, Energy Intelligence) — never officially published, so tagged as an
  // assumption. Slope ~12.5% of Brent is the documented Qatari LNG convention.
  const GAS = { floor: 1.50, slope: 0.125, slopeLo: 0.10, slopeHi: 0.15, shipConst: 0.40, brentRef: 93.0 };
  GAS.marginal = +(GAS.slope * GAS.brentRef + GAS.shipConst).toFixed(2);
  GAS.multiple = +(GAS.marginal / GAS.floor).toFixed(1);
  GAS.brent = GAS.brentRef;

  // ---- Scenarios -----------------------------------------------------------
  const scenarios = [
    { id: "baseline", name: "Baseline", sub: "No active stress applied", severity: 0,
      trigger: "No active stress — the calm-day reference state.", watch: [],
      deltas: { energy:0, water:0, defence:0, food:0, logistics:0, finance:0, health:0 }, overall: 0 },
    { id: "hormuz", name: "Hormuz closure", sub: "Strait transits collapse to near-zero", severity: 3,
      trigger: "A naval incident, mining, or blockade collapses transits through the Strait of Hormuz.",
      watch: [{ k:"choke", id:"hormuz" }, { k:"news", id:"hormuz" }, { k:"sea", id:"hormuz" }, { k:"acled", c:"Iran" }],
      deltas: { energy:-6, water:-9, defence:-4, food:-3, logistics:-35, finance:0, health:-5 }, overall: -22 },
    { id: "chips", name: "Silicon access cut", sub: "US export controls restrict advanced-silicon access (what-if)", severity: 2,
      trigger: "A new US export-control tranche restricts the UAE's access to advanced silicon.",
      watch: [{ k:"market", id:"sanctions" }, { k:"news", id:"general" }, { k:"note", t:"No direct live feed for export-control policy — watched via sanctions updates and trade-policy news." }],
      deltas: { energy:-3, water:-1, defence:-18, food:0, logistics:-2, finance:0, health:-2 }, overall: -14 },
    { id: "dolphin", name: "Dolphin pressure", sub: "Marginal gas reprices: contract → oil-linked", severity: 2,
      trigger: "Qatar curtails Dolphin pipeline gas — by political dispute or technical outage. The shortfall is met by sea-borne LNG, so the marginal molecule reprices from the fixed ~$1.50/MMBtu contract floor to an oil-linked ~$12/MMBtu (≈8×). This is a price-BASIS flip, not a volume gap against a buffer: power and desalination keep running, but on far costlier feedstock.",
      watch: [{ k:"market", id:"gasbasis" }, { k:"market", id:"brent" }, { k:"news", id:"general" }, { k:"note", t:"Pipeline flow is not publicly metered live — the gas replacement basis (Brent-linked) and regional news are the leading proxies." }],
      deltas: { energy:-12, water:-10, defence:-2, food:-1, logistics:-3, finance:0, health:-3 }, overall: -16 },
    { id: "combined", name: "Combined", sub: "Hormuz + Dolphin together", severity: 4,
      trigger: "Hormuz closure and Dolphin curtailment strike together — sea routes choke containerised imports while the lost Dolphin gas reprices to oil-linked LNG that must itself arrive by sea.",
      watch: [{ k:"choke", id:"hormuz" }, { k:"market", id:"gasbasis" }, { k:"news", id:"hormuz" }, { k:"acled", c:"Iran" }],
      // Compounded element-wise: each sector takes the worse of the two shocks
      // plus 0.6x the lesser (overlapping corridors compound), so Combined is
      // never milder than either component anywhere. Energy & water (both gas-
      // and sea-fed) are hit hardest.
      deltas: { energy:-15.6, water:-15.4, defence:-5.2, food:-3.6, logistics:-36.8, finance:0, health:-6.8 }, overall: -28.0 },
    { id: "redsea", name: "Red Sea persistent", sub: "Sustained Bab-el-Mandeb disruption", severity: 2,
      trigger: "Sustained Houthi attacks keep Bab-el-Mandeb effectively closed.",
      watch: [{ k:"choke", id:"redsea" }, { k:"news", id:"redsea" }, { k:"sea", id:"redsea" }, { k:"acled", c:"Yemen" }],
      deltas: { energy:-2, water:-1, defence:-2, food:-4, logistics:-14, finance:0, health:-2 }, overall: -9 },
    { id: "max", name: "Combined Maximum", sub: "All shocks at 4× severity (stress test)", severity: 5,
      trigger: "Every modelled shock at once, at 4× severity — a deliberate stress-test ceiling, not a forecast.",
      watch: [{ k:"choke", id:"hormuz" }, { k:"choke", id:"redsea" }, { k:"news", id:"general" }, { k:"acled", c:"Iran" }],
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
        detail: "75-day buffer begins drawing down the moment resupply shipping stops. High-consequence input — desalination feeds nearly all potable water." },
      { id: "gas", layer: 1, label: "Sea-borne LNG", kind: "precursor", day: 0, band: "moderate",
        detail: "This is NOT the Dolphin pipeline. Dolphin is piped from Qatar, does not transit Hormuz, and keeps flowing through a closure — so its VOLUME is unaffected, which is why it is not the direct hit here. What a Hormuz closure actually blocks is the sea-borne LNG the grid uses to balance peaks (imported via Jebel Ali, inside the Gulf). That lost balancing margin is the gas-side Hormuz exposure, and the replacement molecule is oil-linked (~12.5% of Brent, ≈8× the contract floor), so it also carries a price-BASIS flip. Secondary to RO membranes and cushioned by Dolphin's steady base flow." },
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
    { day: 90, text: "Full production halt — Defence falls into the critical band", band: "critical" },
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
  // Predicted vs. actual are national-headline (Live Resilience) point changes, on
  // the same scale as each scenario's `overall` — so the table validates the
  // scenarios the model actually runs (Hormuz -22, chips -14, Red Sea -9).
  const validation = [
    { event: "Guinea seizure", predicted: -8, actual: -6, accuracy: "MODERATE" },
    { event: "Hormuz escalation", predicted: -22, actual: -20, accuracy: "HIGH" },
    { event: "Chip embargo", predicted: -14, actual: null, accuracy: "UNTESTED" },
    { event: "Red Sea Houthi", predicted: -9, actual: -5, accuracy: "MODERATE" },
  ];
  const roadmap = [
    { part: "Dependencies mapped", pct: 80 },
    { part: "SWF buffer model", pct: 100 },
    { part: "Cascade engine", pct: 95 },
    { part: "Live data feeds", pct: 100 },
    { part: "Control layer", pct: 100 },
    { part: "Multi-scenario", pct: 100 },
    { part: "Response & pre-mortem", pct: 90 },
    { part: "Automation", pct: 85 },
    { part: "Calibration & tuning", pct: 55 },
  ];

  // ---- Data sources / freshness -------------------------------------------
  const sources = {
    live:     { label: "6 live feeds", full: "Six live public feeds combined — PortWatch, Open-Meteo, Google News, Markets, OFAC, ACLED", endpoint: "see individual feeds", url: "https://portwatch.imf.org/", cadence: "continuous", fresh: "live", kind: "live" },
    acled:    { label: "ACLED", full: "Armed Conflict Location & Event Data", endpoint: "ACLED API · Gulf & Red Sea geofilter", url: "https://acleddata.com/explorer/", cadence: "5 min", fresh: "connecting…", kind: "live" },
    ais:      { label: "PortWatch", full: "IMF PortWatch · daily chokepoint transit calls (satellite AIS, ~90k ships)", endpoint: "services9.arcgis.com · Daily_Chokepoints_Data · transit calls vs 12-month norm", url: "https://portwatch.imf.org/", cadence: "weekly (Tue)", fresh: "connecting…", kind: "live" },
    yfinance: { label: "Markets", full: "Oil & gas prices (yfinance)", endpoint: "Yahoo Finance · BZ=F, NG=F", url: "https://finance.yahoo.com/quote/BZ=F", cadence: "5 min", fresh: "connecting…", kind: "live" },
    ofac:     { label: "OFAC", full: "US Treasury SDN sanctions list", endpoint: "treasury.gov SDN delta feed", url: "https://sanctionssearch.ofac.treas.gov/", cadence: "6 h", fresh: "connecting…", kind: "live" },
    meteo:    { label: "Open-Meteo", full: "Marine & weather (Open-Meteo, live)", endpoint: "marine-api.open-meteo.com · wave height · wind · temperature", url: "https://open-meteo.com/", cadence: "10 min", fresh: "connecting…", kind: "live" },
    gdelt:    { label: "Google News", full: "Supply & trade-route news monitor (Google News RSS, live · GDELT fallback)", endpoint: "news.google.com/rss · closure, conflict & partner-supply coverage · GDELT fallback", url: "https://news.google.com/", cadence: "6 min", fresh: "connecting…", kind: "live" },
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

  // ---- Computed score spine ------------------------------------------------
  // The entire headline is a deterministic FUNCTION of the dependency data
  // above — no sector score, capacity figure or structural value is hand-set.
  // Change a precursor's DRI, consequence or buffer and every score downstream
  // recomputes. Live Resilience (live.js) then subtracts today's active load.
  const round1 = (x) => +x.toFixed(1);
  const round2 = (x) => +x.toFixed(2);
  let capacity = null;
  (function computeSpine() {

    // 0 · NATIONAL CONSEQUENCE — computed, not hand-set. Each import's 0–1
    //     weight is a blend of four publicly-grounded factors:
    //       Essentiality    — how vital the end-service is (does life/economy stop?)
    //       Service reliance — how much of that service rides on THIS input
    //       Immediacy        — continuous-flow (fails fast) vs slow-burn consumable
    //       Breadth          — how many sectors / how much of the population it touches
    //     Essentiality dominates: an input feeding a non-essential service can't
    //     be a top national consequence however concentrated its supply is.
    const CW = { ess: 0.40, svc: 0.25, imm: 0.20, brd: 0.15 };
    precursors.forEach((p) => {
      const c = p.cfac;
      p.consequence = round2(CW.ess * c.ess + CW.svc * c.svc + CW.imm * c.imm + CW.brd * c.brd);
    });

    // 0.5 · DEPENDENCY RISK INDEX — recomputed from the four dimensions, with
    //     ROUTE up-weighted (a contested-chokepoint shipment is a higher-severity,
    //     harder-to-mitigate risk than the other axes), PLUS a buffer-fragility
    //     term. The buffer is your REACTION TIME: a 30-day buffer (Dolphin) and a
    //     540-day one (LEU) are not the same risk even with identical dimensions,
    //     so a dims-only score measures only half the problem. DRI carries both.
    const DRI_W = { route: 0.34, concentration: 0.22, substitutability: 0.22, counterpart: 0.22 };
    const BUF_HORIZON = 180;                       // days of cover past which the buffer is no longer the binding constraint
    const DRI_STRUCT_W = 0.67, DRI_BUFFER_W = 0.33;
    precursors.forEach((p) => {
      const d = p.dims;
      const structFrag =
        ( DRI_W.route            * (d.route / 25)
        + DRI_W.concentration    * (d.concentration / 25)
        + DRI_W.substitutability * (d.substitutability / 25)
        + DRI_W.counterpart      * (d.counterpart / 25) ) * 100;
      const bufferFrag = (1 - Math.min(p.buffer / BUF_HORIZON, 1)) * 100;
      p.driStruct = round1(structFrag);
      p.driBuffer = round1(bufferFrag);
      p.bufHorizon = BUF_HORIZON;
      p.dri = Math.round(DRI_STRUCT_W * structFrag + DRI_BUFFER_W * bufferFrag);
    });

    // 1 · SECTOR RESILIENCE = 100 − consequence-weighted mean DRI of the
    //     sector's tracked critical imports. (DRI is a 0–100 fragility score;
    //     higher = more fragile, so a sector loaded with fragile, high-
    //     consequence imports scores low.) The 30-day trend is preserved.
    sectors.forEach((s) => {
      const ps = precursors.filter((p) => p.sector === s.id);
      const cw = ps.reduce((a, p) => a + p.consequence, 0) || 1;
      const wdri = ps.reduce((a, p) => a + p.dri * p.consequence, 0) / cw;
      const delta = s.trend || 0;
      s.score = round1(100 - wdri);
      s.prev = round1(s.score - delta);
      const top = ps.reduce((a, b) => (b.dri > a.dri ? b : a), ps[0]);
      s.topRisk = top.name;
      s.topDRI = top.dri;
      s.precursors = ps.length;
      s.wdri = round1(wdri);
    });

    // 2 · COPING CAPACITY — Absorb · Recover · Adapt, each 0–100.
    const BENCH = 90; // days of cover earning full Absorb credit
    const aw = precursors.reduce((a, p) => a + p.consequence * Math.min(p.buffer / BENCH, 1), 0);
    const cw = precursors.reduce((a, p) => a + p.consequence, 0);
    const absorb = Math.round((aw / cw) * 100);

    const FINANCIAL = 72; // sovereign-buffer sub-score (~$2.0T verified SWF AUM)
    const meanSub = precursors.reduce((a, p) => a + p.dims.substitutability, 0) / precursors.length;
    const subPenalty = Math.round(meanSub * 4);
    const resourcing = Math.round(100 - meanSub * 4);
    const recover = Math.round(0.5 * FINANCIAL + 0.5 * resourcing);

    // Sectors with a committed structural plan in the response catalog
    // (actions.js → ACT.PLAYS). Food has none; the other six do. Kept here as
    // an explicit, documented input so the whole spine stays self-contained.
    const PLAN_SECTORS = ["water", "energy", "logistics", "health", "finance", "defence"];
    const adapt = Math.round((PLAN_SECTORS.length / sectors.length) * 100);

    const blend = Math.round((absorb + recover + adapt) / 3);
    capacity = { absorb, recover, adapt, blend, resourcing, financial: FINANCIAL,
      subPenalty, planCount: PLAN_SECTORS.length, planSectors: PLAN_SECTORS, sectorCount: sectors.length };

    // 3 · STRUCTURAL RESILIENCE = 0.60 × most-exposed sector + 0.40 × capacity
    //     (non-compensatory weakest-link anchor). Trend preserved.
    const exposed = sectors.reduce((a, b) => (b.score < a.score ? b : a));
    const ANCHOR = 0.60;
    const sdelta = headline.structural.value - headline.structural.prev;
    headline.structural.value = round1(ANCHOR * exposed.score + (1 - ANCHOR) * blend);
    headline.structural.prev = round1(headline.structural.value - sdelta);
    headline.structural.exposedSector = { name: exposed.name, score: exposed.score };
    headline.structural.anchor = ANCHOR;
    headline.structural.inputs = [
      { k: "Exposure — most-exposed sector", v: exposed.name + " · " + exposed.score.toFixed(1) + " (weak link)", src: "curated" },
      { k: "Coping capacity", v: "Absorb " + absorb + " · Recover " + recover + " · Adapt " + adapt + " → blend " + blend, src: "curated" },
      { k: "Anchored result", v: "0.60×" + exposed.score.toFixed(1) + " + 0.40×" + blend + " = " + headline.structural.value.toFixed(1) },
    ];

    // 4 · LIVE RESILIENCE — recomputed every tick by live.js as ceiling − active
    //     load. Seed it just below the new ceiling so first paint isn't jarring.
    const ceil = headline.structural.value;
    const ldelta = headline.live.value - headline.live.prev;
    headline.live.value = round1(ceil - 7.5);
    headline.live.prev = round1(headline.live.value - ldelta);
    headline.live.cap.at = ceil;
    headline.live.cap.label = "ceiling = baseline " + ceil.toFixed(1);
    headline.live.cap.body = "— live sits below the structural ceiling (" + ceil.toFixed(1) + ") by the size of today's active load. As that load clears, it climbs back to full strength.";
    headline.live.inputs[0] = { k: "Structural ceiling", v: ceil.toFixed(1) + " — the day's maximum", src: "curated" };

    // 6 · UNCERTAINTY — how sensitive each score is to its editable
    //     assumptions. We re-evaluate the whole spine with each key assumption
    //     nudged to the high and low ends of a plausible range, take how far the
    //     score moves, and turn the largest swings into a ±range and a
    //     confidence label. Makes the model's uncertainty explicit instead of
    //     implying false precision in a single value.
    const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    function evalModel(o) {
      const e = o.essW, rest = 1 - e;
      // hold the relative split of the non-essentiality weights (25/20/15 → /60)
      const CWv = { ess: e, svc: rest * (0.25 / 0.60), imm: rest * (0.20 / 0.60), brd: rest * (0.15 / 0.60) };
      const cons = {};
      precursors.forEach((p) => { const c = p.cfac; cons[p.id] = CWv.ess * c.ess + CWv.svc * c.svc + CWv.imm * c.imm + CWv.brd * c.brd; });
      const sScore = {};
      sectors.forEach((s) => {
        const ps = precursors.filter((p) => p.sector === s.id);
        const cwt = ps.reduce((a, p) => a + cons[p.id], 0) || 1;
        const wdri = ps.reduce((a, p) => a + clampN(p.dri + o.driJ, 0, 100) * cons[p.id], 0) / cwt;
        sScore[s.id] = 100 - wdri;
      });
      const cwAll = precursors.reduce((a, p) => a + cons[p.id], 0);
      const aw = precursors.reduce((a, p) => a + cons[p.id] * Math.min(p.buffer / o.bench, 1), 0);
      const absorb = (aw / cwAll) * 100;
      const meanSub2 = precursors.reduce((a, p) => a + p.dims.substitutability, 0) / precursors.length;
      const resourcing2 = 100 - meanSub2 * 4;
      const recover2 = 0.5 * o.fin + 0.5 * resourcing2;
      const adapt2 = (PLAN_SECTORS.length / sectors.length) * 100;
      const blend2 = (absorb + recover2 + adapt2) / 3;
      const exposed2 = Math.min(...Object.values(sScore));
      const structural = o.anchor * exposed2 + (1 - o.anchor) * blend2;
      return { structural, sScore };
    }
    const DEF = { anchor: 0.60, bench: 90, fin: FINANCIAL, essW: 0.40, driJ: 0 };
    const AXES = [
      { k: "Exposure-anchor weight (0.60)",   lo: { anchor: 0.50 }, hi: { anchor: 0.70 } },
      { k: "Absorb benchmark (90 days)",      lo: { bench: 120 },   hi: { bench: 60 } },
      { k: "Sovereign-buffer sub-score (72)", lo: { fin: 62 },      hi: { fin: 82 } },
      { k: "Essentiality weight (0.40)",      lo: { essW: 0.30 },   hi: { essW: 0.50 } },
      { k: "DRI scoring granularity (±4)",    lo: { driJ: 4 },      hi: { driJ: -4 } },
    ];
    const quad = (arr) => Math.sqrt(arr.reduce((s, x) => s + x.d * x.d, 0));
    const tier = (h) => h < 2 ? { k: "high", label: "High confidence" } : h < 4 ? { k: "moderate", label: "Moderate confidence" } : { k: "indicative", label: "Indicative" };
    const sStruct = AXES.map((a) => ({ k: a.k, d: Math.abs(evalModel({ ...DEF, ...a.hi }).structural - evalModel({ ...DEF, ...a.lo }).structural) / 2 }));
    const sHalf = round1(quad(sStruct));
    headline.structural.rangeHalf = sHalf;
    headline.structural.confidence = tier(sHalf);
    headline.structural.sensitivity = sStruct.map((x) => ({ k: x.k, d: round1(x.d) })).sort((a, b) => b.d - a.d);

    // Live Resilience: structural-ceiling uncertainty + a live-load measurement band
    const LIVE_LOAD_SD = 1.6;
    const lHalf = round1(Math.sqrt(sHalf * sHalf + LIVE_LOAD_SD * LIVE_LOAD_SD));
    headline.live.rangeHalf = lHalf;
    headline.live.confidence = tier(lHalf);
    headline.live.sensitivity = [
      { k: "Structural ceiling", d: sHalf },
      { k: "Live-load measurement (6 feeds)", d: round1(LIVE_LOAD_SD) },
    ].sort((a, b) => b.d - a.d);

    // Per-sector bands — sectors move only with essentiality weight & DRI
    // granularity (anchor / benchmark / sovereign terms don't touch them).
    sectors.forEach((s) => {
      const dJ = Math.abs(evalModel({ ...DEF, driJ: -4 }).sScore[s.id] - evalModel({ ...DEF, driJ: 4 }).sScore[s.id]) / 2;
      const dE = Math.abs(evalModel({ ...DEF, essW: 0.50 }).sScore[s.id] - evalModel({ ...DEF, essW: 0.30 }).sScore[s.id]) / 2;
      const h = round1(Math.sqrt(dJ * dJ + dE * dE));
      s.rangeHalf = h;
      s.confidence = tier(h);
      s.sensitivity = [
        { k: "DRI scoring granularity (±4)", d: round1(dJ) },
        { k: "Essentiality weight (0.40)", d: round1(dE) },
      ].sort((a, b) => b.d - a.d);
    });
  })();

  return {
    BANDS, band, headline, capacity, sectors, precursors, chokepoints, shocks, convergence,
    indicators, scenarios, cascade, chipTimeline, sovereign, foreignAssets,
    agreements, obligations, workforce, water, health, validation, roadmap, sources, assets, gasNode: GAS,
  };
})();
