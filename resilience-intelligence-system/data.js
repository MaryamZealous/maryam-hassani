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
      cap: { at: 72, label: "frontier ~72", lead: "100 is a phantom ceiling", body: "No trade economy reaches it. The marked ≈72 frontier is a stated goalpost (an assumption, not a computed value): the realistic ceiling for an open, import-dependent economy. It anchors the axis only, no score is derived from it. This is also the ceiling Live Resilience recovers toward." },
      explain: "Structural Resilience: how well the system copes on a calm day, before today's events. Following the vulnerability-vs-resilience logic used for small, open, import-dependent economies, it sets the country's capacity (what it can absorb, how fast it recovers, its ability to adapt) against its exposure (the most-exposed sector). It moves over months as buffers, sovereign depth and structural builds change, and is independent of today's events. It is also the ceiling the live score recovers toward. On the 0–100 axis, 100 = total self-sufficiency (no trade economy reaches it); ≈72 marks a realistic frontier.",
      // NOTE: value/prev are seeds only — computeSpine() overwrites value (and
      // recomputes prev to preserve the displayed 30-day delta) from the
      // dependency data, and replaces `inputs` with the computed decomposition.
      // The literals below are illustrative of the shape, not the live numbers.
      inputs: [
        { k: "Exposure, most-exposed sector", v: "most-exposed sector score (weak link)", src: "curated" },
        { k: "Capacity", v: "Absorb · Recover · Adapt → blend", src: "curated" },
        { k: "Anchored result", v: "0.60 × most-exposed + 0.40 × capacity" },
      ],
      assumption: "Capacity blends Absorb, Recover and Adapt equally: buffers vs a 90-day benchmark, sovereign firepower plus how easily inputs re-source, and sectors with a credible structural plan. The 0.60 anchor weight and 90-day benchmark are editable.",
    },
    live: {
      value: 47.0, prev: 44.5,
      name: "Live Resilience",
      tag: "Daily · below the ceiling",
      horizon: "24h",
      formula: "Structural ceiling  −  today's active load (live)",
      // cap + inputs[0] below are seeds; computeSpine() overwrites them with the
      // computed ceiling so the displayed ceiling always equals Structural.
      cap: { at: 55, label: "ceiling = baseline", lead: "Tracking toward your baseline", body: "Live sits below the structural ceiling by the size of today's active load. As that load clears, it climbs back to full strength." },
      explain: "How resilient the system is to today's conditions, the structural ceiling minus the active load from what's happening now, not a free-floating number. On a calm day it sits at the ceiling; live pressure lowers it. The gap between this and the ceiling is the headline signal: a wide gap shows where to focus today, a narrow gap means the country is operating close to its fundamentals.",
      inputs: [
        { k: "Structural ceiling", v: "the day's maximum", src: "curated" },
        { k: "Maritime throughput", v: "Hormuz / Red Sea / Suez transit calls vs each strait's 12-month norm (IMF PortWatch)", src: "ais" },
        { k: "Trade-route news", v: "above-normal closure / conflict coverage on the sea routes", src: "gdelt" },
        { k: "Partner-supply news", v: "adverse coverage of a single- or few-source partner (Qatar gas, US export-control policy, Kazakhstan uranium, China, India, Brazil/Argentina feed grain), negative-sentiment gated", src: "gdelt" },
        { k: "Energy-market stress", v: "Brent and the Brent-linked LNG replacement cost above their stress marks", src: "yfinance" },
        { k: "Sea state", v: "wave height above 1.2 m on the chokepoint approaches impairs transit", src: "meteo" },
        { k: "Counterpart / sanctions", v: "rise in total SDN entities since session baseline (OpenSanctions mirror)", src: "ofac" },
        { k: "Live = ceiling − active load", v: "recomputed every refresh from the live drivers", src: "curated" },
      ],
      assumption: "Each drag term is capped so no single feed can swamp the score, and the total floors at 25 — only stress-test scenarios can go lower. Maritime disruption is measured via vessel throughput, which already reflects rerouting as tension rises, so the Hormuz and Red Sea events shown elsewhere are the cause, not a second scoring input.",
    },
  };

  // ---- 7 sectors -----------------------------------------------------------
  // Sector scores, topRisk / topDRI and precursor counts are all COMPUTED by
  // computeSpine() from the precursor data below — they are NOT set here. The
  // only editable inputs are the display name and the plain note. Displayed
  // 24h/30d trends come from stored score-snapshot history (see initTrends
  // in live.js); with no old-enough history the UI shows a dash.
  const sectors = [
    { id: "energy", name: "Energy",
      note: "Power and desalination share one gas envelope, so they move together under load. The acute risk is single-counterpart gas concentration and a contract→oil-linked price flip, not a Hormuz crude story, since crude bypasses via Fujairah and Dolphin is a fixed pipeline. The clean-energy buildout trades some gas-reliance for China-concentrated processing risk." },
    { id: "water", name: "Water",
      note: "The main constraint is reorder time against buffers, not overnight single-source failure. The thin-buffer dosing chemicals bite fastest." },
    { id: "defense", name: "Defense",
      note: "The main risk is US export-control licensing on advanced chips, not Taiwanese supply. That access has kept easing since late 2025, most recently a 10 Jul 2026 US upgrade of the UAE's export status." },
    { id: "food", name: "Food",
      note: "Grain reserves are deep and diversified; the real anchor is animal feed. Domestic eggs, poultry, dairy and fish all run on imported feed with only weeks of stock, so protein self-sufficiency sits one step down the chain from an import." },
    { id: "logistics", name: "Logistics",
      note: "~60% of imports land at Jebel Ali (est.), inside the strait, so Hormuz container-exposure is the dominant variable, partly offset by air-cargo prioritization and the Fujairah crude bypass." },
    { id: "finance", name: "Finance",
      note: "The imports here are financial rails, not goods: foreign-controlled and sanctions-exposed. The UAE's exceptional sovereign-wealth depth is the offsetting strength, but it sits in coping capacity, not here." },
    { id: "health", name: "Health",
      note: "The exposure is concentration, not depth: active pharmaceutical ingredients (APIs) run ~65% through India (est.), and device buffers stay thin even where vaccine stock is deep." },
  ];

  // ---- Critical imports (precursors) --------------------------------------
  const precursors = [
    { id: "leu", name: "LEU fuel", sector: "energy", source: "Kazakhstan (uranium) → KEPCO NF, Korea", buffer: 540, cfac: { ess: 0.90, svc: 0.85, imm: 0.30, brd: 0.55 },
      dims: { concentration: 88, substitutability: 48, route: 24, counterpart: 16 }, hormuz: false, dolphin: false,
      note: "Long-lead nuclear fuel for Barakah. Kazakh uranium is only the first link in the chain, conversion and enrichment happen abroad, and KEPCO NF (Korea) fabricates the finished assemblies. No near-term alternative chain, but an enormous buffer." },
    { id: "chips", name: "Leading-edge chips", sector: "defense", source: "Taiwan", newsPartner: "us", buffer: 90, cfac: { ess: 0.80, svc: 0.80, imm: 0.60, brd: 0.50 },
      dims: { concentration: 92, substitutability: 88, route: 24, counterpart: 38 }, hormuz: false, dolphin: false,
      note: "Advanced chips are made almost entirely in Taiwan, but the real risk is US export-control licensing, not a Taiwan supply halt, and those controls keep loosening. In Nov 2025 the US approved G42 to import advanced Nvidia chips, and on 10 Jul 2026 the Commerce Department said it would upgrade the UAE's export status: license-free access to advanced computing items under the May 2025 AI Cooperation framework, plus easier transfers of military equipment, satellites and drone technology. Feeds EDGE Group's guided-systems lines.",
      evidence: [{ label: "The National, 10 Jul 2026", url: "https://www.thenationalnews.com/future/technology/2026/07/10/uae-export-status-us/" }] },
    { id: "ro", name: "RO membranes", sector: "water", source: "Japan / US / Korea", buffer: 75, cfac: { ess: 1.00, svc: 0.90, imm: 0.60, brd: 0.85 },
      dims: { concentration: 64, substitutability: 64, route: 52, counterpart: 40 }, hormuz: false, dolphin: false,
      note: "Competitive but concentrated field: DuPont (US), Toray & Nitto (Japan), LG (Korea) hold ~58% between the top three. Gulf desalination already runs largely on Toray membranes, and regional production is localizing (LG Chem–Alkhorayef, Saudi, 2026). The binding risk is the ~120-day reorder lead-time vs a 75-day buffer, not single-source failure." },
    { id: "erd", name: "Energy-recovery devices", sector: "water", source: "US (Energy Recovery Inc.)", buffer: 270, cfac: { ess: 0.90, svc: 0.70, imm: 0.30, brd: 0.80 },
      dims: { concentration: 80, substitutability: 68, route: 16, counterpart: 32 }, hormuz: false, dolphin: false,
      note: "Pressure-exchangers that recycle energy from desalination brine, cutting plant power use by up to ~60%. Without them desalination still runs, just at much higher energy cost. One US supplier (Energy Recovery Inc.) dominates, with Flowserve and Danfoss as partial alternatives, so concentration is high. But the units last for years and are only replaced for new plants or major repairs, so a supply cut is felt slowly, not overnight." },
    { id: "waterchem", name: "Desalination dosing chemicals", sector: "water", source: "US / EU / regional", buffer: 30, cfac: { ess: 0.95, svc: 0.85, imm: 0.90, brd: 0.70 },
      dims: { concentration: 72, substitutability: 64, route: 44, counterpart: 28 }, hormuz: true, dolphin: false,
      note: "The continuous chemical feed every desalination train depends on: antiscalants injected into RO feed-water to stop membrane scaling, chlorine / sodium hypochlorite for disinfection, coagulants (ferric chloride) and pH adjusters (sulphuric acid, caustic soda). Specialty antiscalants come from a handful of qualified suppliers (Nalco/Ecolab, BASF, Avista) and can't be swapped without re-validation. Short shelf lives cap how much can be stockpiled, so the buffer is genuinely thin, and without dosing, RO membranes foul and scale within days, not months. A high-consequence, thin-buffer water input that is easy to overlook next to the hardware." },
    { id: "gas", name: "Piped gas (Dolphin)", sector: "energy", source: "Qatar", buffer: 30, cfac: { ess: 1.00, svc: 1.00, imm: 1.00, brd: 1.00 },
      dims: { concentration: 92, substitutability: 72, route: 8, counterpart: 72 }, hormuz: false, dolphin: true,
      note: "25% of gas for power and water; contract runs to 2032. The real exposure is on the gas side, not a shipping chokepoint: Dolphin is a fixed subsea pipeline from Qatar, so it does not pass through Hormuz. The risk is single-supplier concentration (one neighbor, one pipeline) and price, if Dolphin stops, replacement gas is oil-linked LNG at ~12.5% of Brent (~$12), roughly 8× the fixed ~$1.50/MMBtu contract price. This is the highest-consequence input in the model." },
    { id: "api", name: "Active pharmaceutical ingredients (APIs)", sector: "health", source: "India", buffer: 60, cfac: { ess: 0.90, svc: 0.75, imm: 0.70, brd: 0.60 },
      dims: { concentration: 84, substitutability: 64, route: 40, counterpart: 32 }, hormuz: true, dolphin: false,
      note: "~65% sourced from India (analyst est.). Hospital pharmacology depends on uninterrupted flow." },
    { id: "potash", name: "Potash (fertilizer)", sector: "food", source: "Canada / Russia", buffer: 120, cfac: { ess: 0.50, svc: 0.55, imm: 0.20, brd: 0.30 },
      dims: { concentration: 56, substitutability: 36, route: 36, counterpart: 24 }, hormuz: false, dolphin: false,
      note: "Potassium fertilizer input for domestic agriculture. Reasonably diversified." },
    { id: "vaccines", name: "Vaccines", sector: "health", source: "US / EU", buffer: 180, cfac: { ess: 0.80, svc: 0.60, imm: 0.40, brd: 0.55 },
      dims: { concentration: 48, substitutability: 32, route: 28, counterpart: 16 }, hormuz: false, dolphin: false,
      note: "Deep 180-day cold-chain buffer from diversified Western suppliers." },
    { id: "devices", name: "Medical devices", sector: "health", source: "China", buffer: 45, cfac: { ess: 0.75, svc: 0.60, imm: 0.60, brd: 0.50 },
      dims: { concentration: 72, substitutability: 56, route: 40, counterpart: 28 }, hormuz: true, dolphin: false,
      note: "~40% from China (est.) with a thin 45-day buffer. Counterpart risk rising." },
    { id: "transformers", name: "Grid transformers", sector: "energy", source: "South Korea / EU", buffer: 240, cfac: { ess: 0.90, svc: 0.60, imm: 0.50, brd: 0.70 },
      dims: { concentration: 60, substitutability: 52, route: 32, counterpart: 20 }, hormuz: false, dolphin: false,
      note: "Long-lead high-voltage transformers. Failure cascades to desalination." },
    { id: "turbines", name: "Turbine hot-section & large pumps", sector: "energy", source: "US / EU / Japan (GE · Siemens · Mitsubishi)", buffer: 120, cfac: { ess: 0.95, svc: 0.85, imm: 0.55, brd: 0.80 },
      dims: { concentration: 88, substitutability: 88, route: 32, counterpart: 40 }, hormuz: false, dolphin: false,
      note: "The rotating equipment the power-and-water fleet runs on: gas-turbine hot-section parts (blades, vanes, combustors) and the large desalination and cooling pumps. Three makers (GE, Siemens, Mitsubishi) hold almost the entire qualified field, parts are proprietary and can't be cross-fitted, and lead times run 12–24 months. Spare parts and backup units cushion a single failure, but a fleet-wide overhaul or an export-control cut-off would take both power and desalination offline, not just raise costs, a deep structural exposure for a combined power-and-water utility." },
    { id: "solarpv", name: "Solar PV modules", sector: "energy", source: "China (polysilicon → module)", buffer: 180, cfac: { ess: 0.55, svc: 0.45, imm: 0.20, brd: 0.55 },
      dims: { concentration: 88, substitutability: 56, route: 32, counterpart: 32 }, hormuz: true, dolphin: false,
      note: "The UAE's clean-energy pivot (Mohammed bin Rashid & Al Dhafra solar parks, Masdar, Net Zero 2050) runs on PV modules whose upstream (polysilicon, wafers, cells) is ~80%+ concentrated in China. A sun-rich desert state, yet the panels that harvest the sun are a China-processing dependency. A supply cut would delay new capacity rather than darken existing plants, so this is a forward-looking build-out risk, not an immediate one." },
    { id: "libattery", name: "Battery storage cells", sector: "energy", source: "China (Li-ion cells)", buffer: 150, cfac: { ess: 0.50, svc: 0.40, imm: 0.25, brd: 0.50 },
      dims: { concentration: 96, substitutability: 60, route: 32, counterpart: 44 }, hormuz: true, dolphin: false,
      note: "Grid-scale storage is what lets the solar build-out keep supplying after dark; Masdar's record 24/7 solar-plus-storage projects are gigawatt-hour scale. Lithium-ion cells and their refined lithium, graphite and cathode inputs are heavily concentrated in China. As it decarbonizes, the UAE swaps some gas dependence for battery-supply dependence. Like solar, a cut delays new storage rather than stopping what's already built, but the exposure grows with every project added." },
    { id: "copper", name: "Copper (cathode / rod)", sector: "energy", source: "Chile / Zambia → traded", buffer: 90, cfac: { ess: 0.70, svc: 0.55, imm: 0.40, brd: 0.65 },
      dims: { concentration: 56, substitutability: 48, route: 36, counterpart: 20 }, hormuz: false, dolphin: false,
      note: "The bottleneck metal of electrification: every solar farm, battery, EV charger and grid upgrade is copper-hungry. The UAE mines none; refined cathode and rod feed Ducab's cabling and the federal grid expansion. More diversified than the China-processed inputs (globally traded, multiple sources), so route and counterpart risk are lower, but the structural warning stands: demand outruns new supply over the decade ahead." },
    { id: "wheat", name: "Wheat", sector: "food", source: "Russia / Australia", buffer: 150, cfac: { ess: 0.70, svc: 0.50, imm: 0.30, brd: 0.60 },
      dims: { concentration: 52, substitutability: 28, route: 36, counterpart: 20 }, hormuz: false, dolphin: false,
      note: "Strategic reserves plus diversified sourcing keep this comfortable." },
    { id: "feed", name: "Animal feed & fodder", sector: "food", source: "Brazil / Argentina / US / Spain", buffer: 45, cfac: { ess: 0.65, svc: 0.75, imm: 0.65, brd: 0.50 },
      dims: { concentration: 60, substitutability: 40, route: 36, counterpart: 20 }, hormuz: false, dolphin: false,
      note: "The hidden import under every domestic protein line: soybean meal and corn for poultry and aquaculture, alfalfa and hay for dairy. The UAE's real self-sufficiency in eggs, chicken, milk and farmed fish rides on this continuous feed flow, local production that looks like independence but sits one step down the chain from an import. Feed mills hold weeks of working stock, not months, so a feed disruption reaches domestic protein output faster than a wheat shock reaches bread." },
    { id: "gps", name: "Timing / GNSS modules", sector: "defense", source: "United States", buffer: 90, cfac: { ess: 0.75, svc: 0.70, imm: 0.80, brd: 0.50 },
      dims: { concentration: 68, substitutability: 52, route: 44, counterpart: 24 }, hormuz: false, dolphin: false,
      note: "Precision-timing modules. Vulnerable to GPS-jamming spikes in the Gulf." },
    { id: "avparts", name: "Aviation spares", sector: "logistics", source: "US / EU", buffer: 60, cfac: { ess: 0.65, svc: 0.60, imm: 0.60, brd: 0.50 },
      dims: { concentration: 56, substitutability: 48, route: 44, counterpart: 24 }, hormuz: false, dolphin: false,
      note: "Keeps air-bridge capacity alive when sea routes degrade." },
    { id: "container", name: "Containerised imports (Hormuz)", sector: "logistics", source: "Asia via Hormuz", buffer: 45, cfac: { ess: 0.80, svc: 0.80, imm: 0.70, brd: 0.85 },
      dims: { concentration: 44, substitutability: 52, route: 72, counterpart: 12 }, hormuz: true, dolphin: false,
      note: "The bulk of containerised consumer & industrial goods arrive at Jebel Ali, which sits inside the Gulf, so they are Hormuz-locked. Fujairah (on the Gulf of Oman, outside the strait) is a partial bypass but a fraction of Jebel Ali's box capacity, which is why route exposure dominates this line." },
    { id: "golddore", name: "Gold doré", sector: "finance", source: "Africa (various)", buffer: 30, cfac: { ess: 0.20, svc: 0.30, imm: 0.25, brd: 0.15 },
      dims: { concentration: 32, substitutability: 24, route: 20, counterpart: 12 }, hormuz: false, dolphin: false,
      note: "Refining feedstock for Dubai's gold trade. Low national-consequence weight, the bottom of the scale." },
    { id: "usdclearing", name: "USD clearing access", sector: "finance", source: "US correspondent banks", buffer: 21, cfac: { ess: 0.90, svc: 0.85, imm: 0.85, brd: 0.90 },
      dims: { concentration: 56, substitutability: 60, route: 4, counterpart: 40 }, hormuz: false, dolphin: false,
      note: "Correspondent-banking access to dollar settlement, the rail under most cross-border trade. Counterpart-driven: the UAE sat on the FATF 'gray list' Mar 2022–Feb 2024 (removed since, no longer listed), a documented reminder that this access is a live permission, not a stockpile. The dirham's USD peg deepens the dependence; CIPS/euro rails are only partial substitutes, hence high substitution difficulty." },
    { id: "swift", name: "Cross-border messaging (SWIFT)", sector: "finance", source: "SWIFT (Belgium)", buffer: 30, cfac: { ess: 0.65, svc: 0.60, imm: 0.70, brd: 0.65 },
      dims: { concentration: 48, substitutability: 44, route: 4, counterpart: 36 }, hormuz: false, dolphin: false,
      note: "Foreign-controlled financial messaging that instructs the settlement above. Distinct mechanism from clearing, messaging, not money, and sanctions-exposed, as 2022 SWIFT disconnections elsewhere showed. Domestic and regional alternatives exist but at reduced reach." },
  ];

  // ---- Chokepoints ---------------------------------------------------------
  const chokepoints = [
    { id: "hormuz", name: "Strait of Hormuz", vessels: 6, baseline: 113, band: "critical",
      drop: 95, lat: 26.57, lng: 56.25, spark: [110,104,96,68,40,18,9,6], note: "Carries ~20% of seaborne oil. UAE crude exports bypass via the Habshan–Fujairah pipeline (1.5–1.8 mb/d, outside the strait), so Fujairah holds up even when the strait is stressed. LNG exports and most Jebel Ali container imports stay exposed." },
    { id: "redsea", name: "Red Sea / Bab-el-Mandeb", vessels: 35, baseline: 42, band: "moderate",
      drop: 17, lat: 12.6, lng: 43.3, spark: [44,43,41,39,38,36,35,35], note: "The Houthi missile/drone threat keeps transits below their 12-month norm; many carriers still route the long way around the Cape of Good Hope." },
    { id: "suez", name: "Suez Canal", vessels: 40, baseline: 47, band: "moderate",
      drop: 15, lat: 30.0, lng: 32.55, spark: [47,46,44,43,42,41,40,40], note: "Tracks the Red Sea situation closely, diverted traffic and any recovery both show up here first." },
  ];

  // ---- Active shocks -------------------------------------------------------
  const shocks = [
    { id: "hormuz", name: "Hormuz tension", short: "Hormuz", sector: "logistics", impact: -20, band: "high",
      src: "acled", when: "ongoing", note: "Gulf naval tension is the most-cited driver behind the strait's depressed transits. Because it is the cause of the throughput drop shown on the chokepoint card, its effect reaches the score through that measured IMF PortWatch vessel data, the severity figure here is context, not a second deduction. The Fujairah pipeline and air cargo blunt the crude-export hit.",
      evidence: [{ label: "IMF PortWatch", url: "https://portwatch.imf.org/datasets/42132aa4e2fc4d41bdaf9a445f688931_0/about" }, { label: "EIA chokepoints", url: "https://www.eia.gov/international/analysis/special-topics/World_Oil_Transit_Chokepoints" }, { label: "Live vessel traffic", url: "https://www.marinetraffic.com/en/ais/home/centerx:56.5/centery:26.5/zoom:8" }] },
    { id: "redsea", name: "Red Sea Houthi activity", short: "Red Sea", sector: "logistics", impact: -8, band: "moderate",
      src: "acled", when: "ongoing", note: "The Houthi drone and missile threat that pushed carriers off the route, the cause of the Red Sea transit drop. Its effect reaches the score through the measured throughput data; the severity figure here is shown for context.",
      evidence: [{ label: "IMF PortWatch", url: "https://portwatch.imf.org/datasets/42132aa4e2fc4d41bdaf9a445f688931_0/about" }, { label: "ReliefWeb: Yemen", url: "https://reliefweb.int/country/yem" }] },
  ];
  const convergence = { concurrent: 2, band: "high",
    note: "Two concurrent maritime events, Hormuz and the Red Sea. Both reach the score through the measured throughput drop they cause, so the load is the drop in vessel transits, nothing added on top. Per-event severity figures are shown for context only." };

  // ---- Buffer-day provenance ----------------------------------------------
  // The buffer figures are CURATED estimates, not a live inventory feed. Tag
  // each: "stated" = reflects reported policy / public figure; "est" = analyst
  // order-of-magnitude judgement. Surfaced in the Critical imports list and the
  // dependency drawer so a hardcoded day-count never implies false precision.
  const BUFFER_PROV = {
    leu:       { t: "stated", n: "ENEC holds multiple Barakah fuel reloads, long-lead nuclear fuel stockpile (reported)." },
    wheat:     { t: "stated", n: "UAE strategic grain reserve, reported national-stockpile policy." },
    feed:      { t: "est", n: "Feed mills hold weeks of working stock, bulk silo capacity, not a strategic reserve." },
    waterchem: { t: "est", n: "Plant dosing-chemical stock is only weeks of continuous use, short shelf lives cap how much can be held." },
    turbines:  { t: "est", n: "Critical-spares inventory plus one spare unit beyond what the fleet needs to run; high-value hot-section parts are stocked sparingly against 12–24-month lead times." },
    chips:     { t: "est", n: "Estimate, access is export-license-gated, not a physical stock; the buffer stands in for licensing latency." },
    ro:        { t: "est", n: "Estimate set against the ~120-day reorder lead-time, not a measured warehouse count." },
    erd:       { t: "est", n: "Estimate, durable installed capital; a supply cut bites over rebuild cycles, not days." },
    gas:       { t: "est", n: "Nominal, Dolphin is piped, not stored; the figure stands in for switchover latency to LNG, not a tank level." },
    api:       { t: "est", n: "Analyst estimate of hospital/distributor working stock." },
    potash:    { t: "est", n: "Analyst estimate, diversified sourcing, seasonal." },
    vaccines:  { t: "est", n: "Cold-chain reserve estimate from diversified Western suppliers." },
    devices:   { t: "est", n: "Analyst estimate, thin working stock." },
    transformers: { t: "est", n: "Estimate reflecting long-lead spares, not a measured count." },
    solarpv:   { t: "est", n: "Buildout estimate, affects new capacity, not running plants." },
    libattery: { t: "est", n: "Buildout estimate, installed-capital dynamics." },
    copper:    { t: "est", n: "Analyst estimate, globally traded, multiple sources." },
    gps:       { t: "est", n: "Analyst estimate of module working stock." },
    avparts:   { t: "est", n: "Analyst estimate of aviation-spares pipeline." },
    container: { t: "est", n: "Analyst estimate, flow-through goods, little standing buffer." },
    golddore:  { t: "est", n: "Analyst estimate, refining feedstock, low national consequence." },
    usdclearing: { t: "est", n: "Nominal, dollar-clearing is a live permission, not a stockpile; the day-count is a notional grace period." },
    swift:     { t: "est", n: "Nominal, messaging access is a permission, not a stockpile." },
  };
  precursors.forEach((p) => { p.bufferProv = BUFFER_PROV[p.id] || { t: "est", n: "Analyst estimate." }; });

  // ---- Leading indicators --------------------------------------------------
  const indicators = [
    { id: "brent", name: "Brent crude", value: "$93.09", unit: "/ barrel", delta: 4, dir: "up", hidden: true,
      status: "moderate", src: "yfinance", spark: [84,86,85,88,90,91,92,93], note: "Live oil price, kept as the input to the gas replacement basis. Not shown as a standalone indicator: the UAE is a net exporter, so a Brent rise doesn't lower resilience, and its market-stress effect already feeds the Live score via Today's gap." },
    { id: "gasbasis", name: "Gas, replacement basis", value: "$12.0", unit: "/ MMBtu marginal", delta: 0, dir: "flat",
      status: "moderate", src: "derived", twoState: true, spark: [11.3,11.6,11.4,11.8,12.1,11.9,12.0,12.0],
      short: "what replacement LNG would cost if Dolphin failed, oil-linked at ~12.5% of Brent, ≈8× the ~$1.50 contract floor",
      note: "Contracted Dolphin gas sits at a fixed ~$1.50/MMBtu floor; replacement LNG is oil-linked at ~12.5% of Brent (≈8× today), a price-basis flip, not a volume gap. Open ƒ for the full basis." },
    { id: "conflict", name: "Conflict intensity", unit: "coverage vs each state's norm", delta: 0, dir: "flat",
      status: "moderate", src: "acled", spark: [1.0,0.95,1.05,1.0,0.9,1.1,1.0,1.0], valueText: "—", statusText: "",
      short: "live conflict-news coverage on the counterpart states behind exposed dependencies, each vs its own baseline",
      note: "Conflict-coded news coverage on the states behind the UAE's exposed dependencies (Iran, Yemen, Sudan, Russia), from GDELT. Each is measured against its own 30-day baseline, so a spike reads the same whether a state is high- or low-volume in normal times. Rising coverage is an early warning of counterpart risk, it does not feed the Live score; it flags pressure building before it reaches supply.", bars: true, states: [],
      fx: { kicker: "Leading indicator · live (GDELT)", title: "Conflict intensity: tracked counterpart states",
        text: "GDELT's 30-day conflict-coded article volume for each state behind an exposed UAE dependency, measured against that state's own normal level. The headline shows the most-elevated state right now. Rising coverage leads counterpart risk, it warns before a disruption reaches physical supply. It is context only, and never enters the Live Resilience score.",
        formula: "Intensity  =  coverage(30d) ÷ that state's baseline − 1     ·     headline = most-elevated state",
        inputs: [
          { k: "Source", v: "GDELT DOC 2.0 · Iran / Yemen / Sudan / Russia conflict coverage", src: "acled" },
          { k: "Baseline", v: "each state's own 30-day norm, spikes stay comparable across states" },
          { k: "Role", v: "forward-looking counterpart-risk context, not a Live-score driver" },
        ],
        assumption: "Per-state baselines are editable estimates. Coverage is a proxy for intensity, noisier than verified event data, but genuinely live." } },
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
      trigger: "No active stress, the calm-day reference state.", watch: [],
      deltas: { energy:0, water:0, defense:0, food:0, logistics:0, finance:0, health:0 }, overall: 0 },
    { id: "hormuz", name: "Hormuz closure", sub: "Strait transits collapse to near-zero", severity: 3,
      trigger: "A naval incident, mining, or blockade collapses transits through the Strait of Hormuz.",
      watch: [{ k:"choke", id:"hormuz" }, { k:"news", id:"hormuz" }, { k:"acled", c:"Iran" }],
      deltas: { energy:-6, water:-9, defense:-4, food:-3, logistics:-35, finance:0, health:-5 }, overall: -22 },
    { id: "chips", name: "Silicon access cut", sub: "US export controls restrict advanced-silicon access (what-if)", severity: 1,
      trigger: "A reversal of current policy: a new US export-control tranche restricts the UAE's access to advanced silicon. Kept as a stress-test lever even though the real-world trend now runs the other way \u2014 on 10 Jul 2026 the US upgraded the UAE's export status, granting license-free access to advanced computing items.",
      watch: [{ k:"ofac" }, { k:"news", id:"general" }, { k:"note", t:"Export controls are a US Commerce/BIS regime with no direct live feed, watched here as a proxy via OFAC sanctions activity and trade-policy news." }],
      deltas: { energy:-3, water:-1, defense:-15, food:0, logistics:-2, finance:0, health:-2 }, overall: -12 },
    { id: "dolphin", name: "Dolphin pressure", sub: "Gas reprices from contract to oil-linked LNG", severity: 2,
      trigger: "Qatar curtails Dolphin pipeline gas, by political dispute or technical outage. The replacement is sea-borne LNG at ~$12/MMBtu, roughly 8× the fixed ~$1.50/MMBtu contract price. It is a price jump, not a shortage: power and desalination keep running, just on far costlier gas.",
      watch: [{ k:"market", id:"gasbasis" }, { k:"market", id:"brent" }, { k:"news", id:"general" }, { k:"note", t:"Pipeline flow is not publicly metered live, the gas replacement basis (Brent-linked) and regional news are the leading proxies." }],
      deltas: { energy:-12, water:-10, defense:-2, food:-1, logistics:-3, finance:0, health:-3 }, overall: -16 },
    { id: "combined", name: "Combined", sub: "Hormuz + Dolphin together", severity: 4,
      trigger: "Hormuz closure and Dolphin curtailment strike together: sea routes choke containerized imports while the lost Dolphin gas is replaced by oil-linked LNG that must itself arrive by sea.",
      watch: [{ k:"choke", id:"hormuz" }, { k:"market", id:"gasbasis" }, { k:"news", id:"hormuz" }, { k:"acled", c:"Iran" }],
      // Compounded element-wise: each sector takes the worse of the two shocks
      // plus 0.6x the lesser (overlapping corridors compound), so Combined is
      // never milder than either component anywhere. Energy & water (both gas-
      // and sea-fed) are hit hardest.
      deltas: { energy:-15.6, water:-15.4, defense:-5.2, food:-3.6, logistics:-36.8, finance:0, health:-6.8 }, overall: -28.0 },
    { id: "redsea", name: "Red Sea persistent", sub: "Sustained Bab-el-Mandeb disruption", severity: 2,
      trigger: "Sustained Houthi attacks keep Bab-el-Mandeb effectively closed.",
      watch: [{ k:"choke", id:"redsea" }, { k:"news", id:"redsea" }, { k:"acled", c:"Yemen" }],
      deltas: { energy:-2, water:-1, defense:-2, food:-4, logistics:-14, finance:0, health:-2 }, overall: -9 },
    { id: "max", name: "Combined Maximum", sub: "Hand-built worst case (stress-test ceiling)", severity: 5,
      trigger: "Every modeled shock at once at extreme severity, a deliberately built worst case. Its sector hits are set by judgement, not scaled from the other scenarios, and it is a ceiling test, not a forecast.",
      watch: [{ k:"choke", id:"hormuz" }, { k:"choke", id:"redsea" }, { k:"news", id:"general" }, { k:"acled", c:"Iran" }],
      deltas: { energy:-22, water:-31, defense:-30, food:-12, logistics:-48, finance:-2, health:-14 }, overall: -58 },
  ];
  // Scenario OVERALL is COMPUTED from the seven sector deltas with the same
  // non-compensatory anchoring as the structural score — never hand-set. The
  // literals above are seeds only; this overwrites them.
  //   overall = 0.60 × worst-hit sector delta + 0.40 × mean sector delta
  scenarios.forEach((s) => {
    const ds = Object.values(s.deltas);
    const worst = Math.min(...ds);
    const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
    s.overall = +(0.60 * worst + 0.40 * mean).toFixed(1);
  });

  // ---- Cascade graph (for the signature animation) -------------------------
  // Layered: trigger -> precursor -> asset -> sector -> overall
  const cascade = {
    timeline: [0, 15, 30, 45, 60, 75, 90, 120, 150],
    todayDay: 150, // the real Hormuz closure's actual elapsed duration, for comparison
    nodes: [
      { id: "trigger", layer: 0, label: "Hormuz closure", kind: "trigger", day: 0, band: "critical",
        detail: "Naval incident closes the strait. Transit calls fall from a ~110/day norm to single digits within 48 hours." },

      { id: "waterchem", layer: 1, label: "Dosing chemicals", kind: "precursor", day: 0, band: "high",
        mitigatedDay: 0, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: rerouted via Fujairah (outside the strait) and an alternate qualified supplier inside the first two weeks, the buffer is topped up before it binds.",
        detail: "The fastest-biting water precursor. Antiscalants, chlorine and coagulants are bulk imports that land at Jebel Ali, inside the Gulf, so genuinely Hormuz-locked, and can't be air-freighted at volume. With the thinnest buffer in the water chain (~30 days), they draw down first the moment resupply shipping stops." },
      { id: "ro", layer: 1, label: "RO membranes", kind: "precursor", day: 0, band: "moderate",
        mitigatedDay: 0, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: already reroutable via Fujairah or air-freight given its high value and low shipping volume, that route absorbs the loss with little visible strain.",
        detail: "A deeper ~75-day buffer, and, being high-value and low-volume, membranes can partly reroute via Fujairah (outside the strait) or air-freight, so they degrade later and more softly than the bulk chemicals. Still a high-consequence input: desalination feeds nearly all potable water." },
      { id: "gas", layer: 1, label: "Sea-borne LNG", kind: "precursor", day: 0, band: "moderate",
        mitigatedDay: 0, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: Dolphin's steady base flow plus accepting the oil-linked replacement cost covers the lost balancing margin, a cost hit, not a supply gap.",
        detail: "This is NOT the Dolphin pipeline. Dolphin is piped from Qatar, does not transit Hormuz, and keeps flowing through a closure, so its VOLUME is unaffected, which is why it is not the direct hit here. What a Hormuz closure actually blocks is the sea-borne LNG the grid uses to balance peaks (imported via Jebel Ali, inside the Gulf). That lost balancing margin is the gas-side Hormuz exposure, and the replacement molecule is oil-linked (~12.5% of Brent, ≈8× the contract floor), so it also carries a price-BASIS flip. Cushioned by Dolphin's steady base flow." },

      { id: "taweelah", layer: 2, label: "Taweelah desalination", kind: "asset", day: 30, band: "high",
        mitigatedDay: 120, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: the reorder point is reached on schedule, but rerouted stock arrives before consumables run out, output tapers, but doesn't stop.",
        detail: "Dosing-chemical stock reaches its reorder threshold first, with membrane spares following. Output begins to taper as the plant runs down its consumables." },
      { id: "grid", layer: 2, label: "Power grid", kind: "asset", day: 60, band: "high",
        mitigatedDay: 120, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: the oil-linked replacement gas and Dolphin's base flow keep the grid balanced, at higher cost rather than lower supply.",
        detail: "Gas balancing tightens; desalination and grid share the same gas envelope, so they move together under load." },

      { id: "water", layer: 3, label: "Water", kind: "sector", day: 30, band: "critical",
        mitigatedDay: 150, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: rerouted procurement plus the 90-day federal strategic reserve hold Water at moderate strain rather than critical. This is the path that matches an actual multi-month closure with limited visible effect.",
        detail: "Desalination is the spine of water supply. Day-to-day demand is met from operational storage; the 90-day federal strategic reserve then covers essential supply, at a reduced rate: a deep safety net rather than full-demand cover." },
      { id: "energy", layer: 3, label: "Energy", kind: "sector", day: 60, band: "high",
        mitigatedDay: 120, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: the grid absorbs the balancing loss as a cost increase, not an outage.",
        detail: "Gas-for-power and gas-for-water draw on the same envelope. The grid de-rates to keep desalination supplied." },
      { id: "food", layer: 3, label: "Food", kind: "sector", day: 60, band: "moderate",
        mitigatedDay: 150, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: with Water and Energy holding at moderate strain, cold-chain and irrigation are barely disturbed.",
        detail: "Cold-chain and irrigation depend on water + power, following the water signal by ~30 days." },

      { id: "overall", layer: 4, label: "Live Resilience", kind: "overall", day: 90, band: "critical",
        mitigatedDay: 150, mitigatedBand: "moderate",
        mitigationNote: "Mitigated: with those responses staged, Live Resilience dips but does not collapse, consistent with a real closure running months with limited visible effect.",
        detail: "The national headline reading falls as the shock propagates. Non-compensatory aggregation: with Water under load, Live Resilience stays anchored to the most-exposed sector regardless of strong sectors elsewhere." },
    ],
    edges: [
      ["trigger","waterchem"], ["trigger","ro"], ["trigger","gas"],
      ["waterchem","taweelah"], ["ro","taweelah"], ["gas","grid"], ["gas","taweelah"],
      ["taweelah","water"], ["grid","energy"], ["grid","water"],
      ["water","food"], ["water","overall"], ["energy","overall"], ["food","overall"],
    ],
  };

  // Chips cascade narrative (Dependencies deep-dive)
  const chipTimeline = [
    { day: 45, text: "EDGE Group production begins to slow", band: "moderate" },
    { day: 60, text: "Guided-systems manufacturing stalls", band: "high" },
    { day: 90, text: "Full production halt, Defense falls into the critical band", band: "critical" },
  ];

  // ---- Control layer -------------------------------------------------------
  const sovereign = [
    { name: "ADIA", aum: 1000, liquidity: "High", deployable: 350 },
    { name: "ICD", aum: 320, liquidity: "Medium", deployable: 90 },
    { name: "Mubadala", aum: 330, liquidity: "Medium", deployable: 100 },
    { name: "ADQ", aum: 199, liquidity: "Medium", deployable: 60 },
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
    { name: "Dolphin gas", partner: "Qatar", expiry: "2032", status: "Active", urgent: false, url: "https://www.dolphinenergy.com/", urlNote: "Dolphin Energy, the venture operating the Qatar–UAE pipeline; contract terms are reported, not published" },
    { name: "123 Agreement", partner: "United States", expiry: "Indefinite", status: "Active", urgent: false, url: "https://2009-2017.state.gov/r/pa/prs/ps/2009/05/123746.htm", urlNote: "US State Dept, the 2009 US–UAE civil-nuclear 123 Agreement announcement" },
    { name: "CEPA transit", partner: "India", expiry: "2027", status: "Active", urgent: true, url: "https://www.moet.gov.ae/en/cepa_india", urlNote: "UAE Ministry of Economy, official UAE–India CEPA page with the agreement text" },
    { name: "Defense framework", partner: "France", expiry: "2029", status: "Active", urgent: false, url: "https://gulfnews.com/uae/uae-and-france-sign-new-defense-cooperation-agreement-1.500546551", urlNote: "Gulf News, the May 2026 UAE–France defense cooperation agreement, building on the 1995/2009 accords" },
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
    note: "The UAE operates 90-day strategic desalinated-water reserves, Abu Dhabi's Liwa Strategic Water Reserve (the world's largest desalinated-water aquifer store) and DEWA's Aquifer Storage & Recovery in Dubai (the world's largest potable ASR). These cover essential supply for up to 90 days, with day-to-day demand met from operational storage, a deep safety net behind normal operations.",
    evidence: [
      { label: "Abu Dhabi, Gulf News", url: "https://gulfnews.com/uae/environment/abu-dhabi-completes-worlds-largest-desalinated-water-reserve-1.2157536" },
      { label: "Dubai, DEWA", url: "https://www.dewa.gov.ae/en/about-us/media-publications/latest-news/2022/03/dewa-completes-construction-of-the-first-stage-of-the-asr-project" },
    ],
  };
  const health = {
    apis: "60-day buffer · India ~65% source (est.)",
    vaccines: "180-day buffer · US / EU",
    devices: "45-day buffer · China ~40% (est.)",
    beds: "14,000 hospital beds",
    threshold: "Critical shortage threshold: 21 days (ICU consumables)",
  };
  // Legacy illustrative validation table — superseded by the shared server-side
  // episode log (see MaturityRow). Kept exported for backwards compatibility.
  const scnOverall = (id) => { const s = scenarios.find((x) => x.id === id); return s ? s.overall : null; };
  const validation = [
    { event: "Hormuz escalation", predicted: scnOverall("hormuz"), actual: null, accuracy: "UNTESTED" },
    { event: "Chip embargo", predicted: scnOverall("chips"), actual: null, accuracy: "UNTESTED" },
    { event: "Red Sea Houthi", predicted: scnOverall("redsea"), actual: null, accuracy: "UNTESTED" },
  ];
  const roadmap = [
    { part: "Dependencies mapped", pct: 80 },
    { part: "SWF buffer model", pct: 100 },
    { part: "Cascade engine", pct: 95 },
    { part: "Live data feeds", pct: 90 },
    { part: "Control layer", pct: 90 },
    { part: "Multi-scenario", pct: 100 },
    { part: "Sector responses", pct: 90 },
    { part: "Feed polling & recompute", pct: 85 },
    { part: "Calibration & tuning", pct: 55 },
  ];

  // ---- Data sources / freshness -------------------------------------------
  const sources = {
    live:     { label: "Live feeds", full: "Six live public feeds, five move the Live score (PortWatch, Open-Meteo, Google News, Markets, OFAC); GDELT conflict coverage powers counterpart-risk context", endpoint: "see individual feeds", url: "https://portwatch.imf.org/", cadence: "continuous", fresh: "live", kind: "live" },
    acled:    { label: "GDELT", full: "Conflict-event coverage from GDELT DOC 2.0, 30-day conflict-coded article volume per tracked country (Iran, Yemen, Sudan, Russia), used as a live conflict-intensity signal behind counterpart risk", endpoint: "GDELT DOC 2.0 · Iran / Yemen / Sudan / Russia conflict coverage", url: "https://www.gdeltproject.org/", cadence: "5 min", fresh: "connecting…", kind: "live" },
    ais:      { label: "PortWatch", full: "IMF PortWatch · daily chokepoint transit calls (satellite AIS, ~90k ships)", endpoint: "services9.arcgis.com · Daily_Chokepoints_Data · transit calls vs 12-month norm", url: "https://portwatch.imf.org/", cadence: "weekly (Tue)", fresh: "connecting…", kind: "live" },
    yfinance: { label: "Markets", full: "Oil price, Brent (yfinance)", endpoint: "Yahoo Finance · BZ=F", url: "https://finance.yahoo.com/quote/BZ=F", cadence: "5 min", fresh: "connecting…", kind: "live" },
    ofac:     { label: "OFAC", full: "US Treasury SDN sanctions list (OpenSanctions mirror)", endpoint: "data.opensanctions.org · us_ofac_sdn · total entity count (no delta)", url: "https://www.opensanctions.org/datasets/us_ofac_sdn/", cadence: "6 h", fresh: "connecting…", kind: "live" },
    meteo:    { label: "Open-Meteo", full: "Marine & weather (Open-Meteo, live)", endpoint: "marine-api.open-meteo.com · wave height · wind · temperature", url: "https://open-meteo.com/", cadence: "10 min", fresh: "connecting…", kind: "live" },
    gdelt:    { label: "Google News", full: "Supply & trade-route news monitor (Google News RSS, live · GDELT fallback)", endpoint: "news.google.com/rss · closure, conflict & partner-supply coverage · GDELT fallback", url: "https://news.google.com/", cadence: "6 min", fresh: "connecting…", kind: "live" },
    curated:  { label: "Curated", full: "Hand-curated public-source CSV", endpoint: "versioned CSV · public reporting", url: "", cadence: "manual", fresh: "reviewed", kind: "curated" },
    derived:  { label: "Live · derived", full: "Computed live from the Brent market feed via a curated oil-link basis, the ~$1.50/MMBtu floor and ~12.5%-of-Brent slope are reported estimates; the value moves with Brent every tick", endpoint: "live Brent × curated oil-link basis", url: "https://finance.yahoo.com/quote/BZ=F", cadence: "5 min", fresh: "live", kind: "live" },
    assumption:{ label: "Assumption", full: "Explicit modeling assumption", endpoint: "stated in assumptions ledger", url: "", cadence: "—", fresh: "stated", kind: "assumption" },
  };

  // ---- Assets (for map) ----------------------------------------------------
  const assets = [
    { id: "jebelali", name: "Jebel Ali Port", lat: 25.0, lng: 55.06, weight: 1.0, kind: "port", note: "The single gateway most imported goods pass through, roughly 60% (est.), and the regional re-export hub, so a disruption here reaches nearly every sector." },
    { id: "barakah", name: "Barakah Nuclear", lat: 23.97, lng: 52.23, weight: 0.9, kind: "energy", note: "Nuclear baseload, about a quarter of national electricity, running on imported low-enriched uranium with a deep fuel buffer." },
    { id: "taweelah", name: "Taweelah Desalination", lat: 24.78, lng: 54.7, weight: 0.95, kind: "water", note: "One of the world's largest reverse-osmosis plants; its output rides on a continuous supply of imported membranes and dosing chemicals." },
    { id: "fujairah", name: "Fujairah Terminal", lat: 25.17, lng: 56.33, weight: 0.85, kind: "port", note: "The east-coast crude-export terminal that ships oil to Asia without entering the Strait of Hormuz, the country's strategic chokepoint bypass." },
    { id: "ruwais", name: "Ruwais Refinery", lat: 24.11, lng: 52.73, weight: 0.8, kind: "energy", note: "The downstream complex that turns crude and gas into fuels, petrochemicals and the fertilizer the UAE exports." },
    { id: "dubaiwater", name: "Dubai water network", lat: 25.2, lng: 55.27, weight: 0.7, kind: "water", note: "A municipal network with only thin operational storage, cushioned by the 90-day federal strategic reserve behind it." },
    { id: "portrashid", name: "Port Rashid", lat: 25.32, lng: 55.33, weight: 0.4, kind: "port", note: "Dubai's original port, now cruise and heritage, its cargo role long since consolidated into Jebel Ali, so its resilience weight is low." },
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

    // 0.5 · DEPENDENCY RISK INDEX — recomputed from the four dimensions (each
    //     scored 0–100, like every other score in the model), with ROUTE
    //     up-weighted (a contested-chokepoint shipment is a higher-severity,
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
          DRI_W.route            * d.route
        + DRI_W.concentration    * d.concentration
        + DRI_W.substitutability * d.substitutability
        + DRI_W.counterpart      * d.counterpart;
      const bufferFrag = (1 - Math.min(p.buffer / BUF_HORIZON, 1)) * 100;
      p.driStruct = round1(structFrag);
      p.driBuffer = round1(bufferFrag);
      p.bufHorizon = BUF_HORIZON;
      p.dri = Math.round(DRI_STRUCT_W * structFrag + DRI_BUFFER_W * bufferFrag);
    });

    // 1 · SECTOR RESILIENCE = 100 − (0.6 × anchor DRI + 0.4 × consequence-
    //     weighted mean DRI). Non-compensatory within the sector, mirroring the
    //     national 60/40 anchor. The anchor import is selected by DRI ×
    //     consequence — the most fragile import that MATTERS — so a fragile but
    //     nationally trivial import can never seize the anchor; its raw DRI is
    //     then used so the score stays on the 0–100 fragility scale.
    sectors.forEach((s) => {
      const ps = precursors.filter((p) => p.sector === s.id);
      const cw = ps.reduce((a, p) => a + p.consequence, 0) || 1;
      const wmean = ps.reduce((a, p) => a + p.dri * p.consequence, 0) / cw;
      const worst = ps.reduce((a, b) => (b.dri * b.consequence > a.dri * a.consequence ? b : a), ps[0]);
      const wdri = 0.6 * worst.dri + 0.4 * wmean;
      s.score = round1(100 - wdri);
      s.topRisk = worst.name;
      s.topDRI = worst.dri;
      s.topSel = round1(worst.dri * worst.consequence);
      s.precursors = ps.length;
      s.wdri = round1(wdri);
      s.wmean = round1(wmean);
      s.anchorW = 0.6;
    });

    // 2 · COPING CAPACITY — Absorb · Recover · Adapt, each 0–100.
    const BENCH = 90; // days of cover earning full Absorb credit
    const aw = precursors.reduce((a, p) => a + p.consequence * Math.min(p.buffer / BENCH, 1), 0);
    const cw = precursors.reduce((a, p) => a + p.consequence, 0);
    const absorb = Math.round((aw / cw) * 100);

    // FINANCIAL FIREPOWER — computed from the Control layer's sovereign table,
    // not hand-set. Each fund's DEPLOYABLE capital is discounted by a liquidity
    // factor (High 1.0 / Medium 0.6 / Low 0.3 — how fast it can actually move),
    // then set against a stated stress benchmark: $750bn ≈ 18 months of the
    // national import bill (est.), the scale of a worst-case crisis year.
    const LIQ_W = { High: 1.0, Medium: 0.6, Low: 0.3 };
    const FIN_BENCH = 750; // $bn · editable goalpost
    const deployW = sovereign.reduce((a, f) => a + f.deployable * (LIQ_W[f.liquidity] || 0.3), 0);
    const FINANCIAL = Math.round(100 * Math.min(deployW / FIN_BENCH, 1));
    // Re-sourcing ease: consequence-weighted mean substitutability — the imports
    // that matter most dominate, consistent with every other roll-up in the model.
    const meanSub = precursors.reduce((a, p) => a + p.dims.substitutability * p.consequence, 0) / cw;
    const subPenalty = Math.round(meanSub);
    const resourcing = Math.round(100 - meanSub);
    const recover = Math.round(0.5 * FINANCIAL + 0.5 * resourcing);

    // ADAPT — computed from the substance of the response catalog, not its mere
    // existence. Per sector with a play: DEPTH = the ceiling points its deepest
    // tier would add (2.5 pts = full credit) × SPEED = how fast the first
    // structural effect lands (≤24 months = full credit), blended 0.6/0.4.
    // Sectors are weighted by their imports' total consequence; a sector with
    // no structural play scores 0 (all seven currently have one). PLAN_FACTS
    // mirrors actions.js →
    // ACT.PLAYS (deepest-tier ceilPts · days of the first ceiling-raising tier)
    // — kept here as an explicit documented input so the spine stays
    // self-contained; update it if the catalog changes.
    const PLAN_FACTS = {
      water:     { ceil: 2.6, days: 660 },   // RO membranes play · T3 · T2 first structural
      energy:    { ceil: 2.8, days: 540 },   // solar-for-water play · T3 · T1 first structural
      logistics: { ceil: 2.4, days: 1100 },  // Fujairah bypass · T3 · T2 first structural
      health:    { ceil: 2.2, days: 900 },   // pharma localization · T3 · T2 first structural
      finance:   { ceil: 0.5, days: 365 },   // emergency fund · T3 (mostly a live tool)
      defense:   { ceil: 2.6, days: 1100 },  // chips ladder · T3 · T2 first structural
      food:      { ceil: 1.6, days: 720 },   // indoor-farming play · T3 · T2 first structural
    };
    const ADAPT_DEPTH_FULL = 2.5, ADAPT_SPEED_FULL = 730;
    let adNum = 0, adDen = 0; const adaptDetail = [];
    sectors.forEach((s) => {
      const w = precursors.filter((p) => p.sector === s.id).reduce((a, p) => a + p.consequence, 0);
      const f = PLAN_FACTS[s.id];
      const depth = f ? Math.min(f.ceil / ADAPT_DEPTH_FULL, 1) : 0;
      const speed = f ? Math.min(ADAPT_SPEED_FULL / f.days, 1) : 0;
      const sa = f ? 0.6 * depth + 0.4 * speed : 0;
      adNum += w * sa; adDen += w;
      adaptDetail.push({ id: s.id, name: s.name, w: round2(w), depth: round2(depth), speed: round2(speed), score: round2(sa) });
    });
    const adapt = Math.round(100 * adNum / adDen);
    const PLAN_SECTORS = Object.keys(PLAN_FACTS);

    const blend = Math.round((absorb + recover + adapt) / 3);
    capacity = { absorb, recover, adapt, blend, resourcing, financial: FINANCIAL,
      finDeployW: Math.round(deployW), finBench: FIN_BENCH, adaptDetail,
      subPenalty, planCount: PLAN_SECTORS.length, planSectors: PLAN_SECTORS, sectorCount: sectors.length };

    // 3 · STRUCTURAL RESILIENCE = 0.60 × most-exposed sector + 0.40 × capacity
    //     (non-compensatory weakest-link anchor).
    const exposed = sectors.reduce((a, b) => (b.score < a.score ? b : a));
    const ANCHOR = 0.60;
    const sdelta = headline.structural.value - headline.structural.prev;
    headline.structural.value = round1(ANCHOR * exposed.score + (1 - ANCHOR) * blend);
    headline.structural.prev = round1(headline.structural.value - sdelta);
    headline.structural.exposedSector = { name: exposed.name, score: exposed.score };
    headline.structural.anchor = ANCHOR;
    headline.structural.inputs = [
      { k: "Exposure, most-exposed sector", v: exposed.name + " · " + exposed.score.toFixed(1) + " (weak link)", src: "curated" },
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
    headline.live.cap.body = "Live sits below the structural ceiling (" + ceil.toFixed(1) + ") by the size of today's active load. As that load clears, it climbs back to full strength.";
    headline.live.inputs[0] = { k: "Structural ceiling", v: ceil.toFixed(1) + ", the day's maximum", src: "curated" };

    // 6 · UNCERTAINTY — how sensitive each score is to its editable
    //     assumptions. We re-evaluate the whole spine with each key assumption
    //     nudged to the high and low ends of a plausible range, take how far the
    //     score moves, and turn the largest swings into a ± range. Makes the
    //     model's uncertainty explicit instead of
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
        const wmean2 = ps.reduce((a, p) => a + clampN(p.dri + o.driJ, 0, 100) * cons[p.id], 0) / cwt;
        const anchorP2 = ps.reduce((a, b) => (clampN(b.dri + o.driJ, 0, 100) * cons[b.id] > clampN(a.dri + o.driJ, 0, 100) * cons[a.id] ? b : a), ps[0]);
        const worst2 = clampN(anchorP2.dri + o.driJ, 0, 100);
        sScore[s.id] = 100 - (0.6 * worst2 + 0.4 * wmean2);
      });
      const cwAll = precursors.reduce((a, p) => a + cons[p.id], 0);
      const aw = precursors.reduce((a, p) => a + cons[p.id] * Math.min(p.buffer / o.bench, 1), 0);
      const absorb = (aw / cwAll) * 100;
      const meanSub2 = precursors.reduce((a, p) => a + p.dims.substitutability * cons[p.id], 0) / cwAll;
      const resourcing2 = 100 - meanSub2;
      const recover2 = 0.5 * o.fin + 0.5 * resourcing2;
      const adapt2 = adapt; // plan depth × speed, independent of the nudged axes
      const blend2 = (absorb + recover2 + adapt2) / 3;
      const exposed2 = Math.min(...Object.values(sScore));
      const structural = o.anchor * exposed2 + (1 - o.anchor) * blend2;
      return { structural, sScore };
    }
    const DEF = { anchor: 0.60, bench: 90, fin: FINANCIAL, essW: 0.40, driJ: 0 };
    const AXES = [
      { k: "Exposure-anchor weight (0.60)",   lo: { anchor: 0.50 }, hi: { anchor: 0.70 } },
      { k: "Absorb benchmark (90 days)",      lo: { bench: 120 },   hi: { bench: 60 } },
      { k: "Sovereign-firepower score (" + FINANCIAL + ")", lo: { fin: FINANCIAL - 10 }, hi: { fin: FINANCIAL + 10 } },
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
      { k: "Live-load measurement (six drag terms)", d: round1(LIVE_LOAD_SD) },
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
