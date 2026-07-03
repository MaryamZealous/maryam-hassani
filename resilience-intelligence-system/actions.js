/* ============================================================================
   ACT layer — grounded implementation briefs + pre-mortem engine.
   Closes the loop: SENSE → SIMULATE → **ACT** → LEARN.

   Each play is an implementation brief a decision-maker could commission:
   WHAT gets built, WHERE (a named site with a rationale), with WHICH
   technology and inputs (and what stays imported — the honest residual),
   with WHICH partners, anchored to a REAL precedent project and its actual
   cost and timeline.

   Copy is written for a non-expert reader: every technical term is glossed
   in plain words the first time it appears.

   The lever is a SCOPE DECISION between real tiers. Effects tie back into
   the system's baseline-and-deviation core:
     · livePts → recovers LIVE RESILIENCE (improves today's score)
     · ceilPts → raises the STRUCTURAL ceiling (improves the long-term score)

   Sourcing honesty: precedent.flag = "sourced" (researched, real figures)
   or "knowledge" (well-established program, figures may need refinement).
   Costs marked "modelled" have no direct comparable and say so.
   AED throughout, ~AED 3.67 / USD.
   ========================================================================== */
window.ACT = (function () {

  const PLAYS = [

    /* ---- 1 · WATER — RO membranes ---------------------------------------- */
    {
      id: "ro-membrane",
      title: "Water filters — hold a reserve, then make them here",
      sector: "water", window: 0.80,
      addresses: "Filter stock lasts 75 days — but a new order takes ~120 days to arrive",
      sponsor: { name: "EWEC + Ministry of Energy & Infrastructure", why: "EWEC procures the water and holds Taweelah's contracts — the natural commissioning owner, with the federal ministry setting the resilience mandate." },
      thesis: "Nearly all drinking water comes from desalination plants, and the filter cartridges they run on (called 'RO membranes') are 100% imported. The choice is not 'build a filter factory, yes or no' — it is how far up the supply chain to climb: hold a bigger stockpile (buys time), make the filters here (Saudi Arabia just did exactly this next door), or also make their raw chemicals here (true independence).",
      site: {
        where: "KEZAD (Khalifa Economic Zone), adjacent to Taweelah",
        why: "Taweelah, next door, hosts the world's largest desalination plant — the customer is across the road. KEZAD offers industrial land plus Khalifa Port for incoming materials, and the TA'ZIZ chemicals hub at Ruwais is the later route to making the raw chemicals (Tier 3).",
      },
      tech: {
        summary: "Each filter is a rolled-up cartridge of layered plastic sheets. The thin working layer that actually separates salt from water is created by reacting two specialty chemicals — MPD and TMC — which only a handful of factories in the world produce.",
        inputs: [
          { name: "MPD + TMC (the two specialty chemicals)", status: "imported", note: "the real bottleneck — only a few producers worldwide" },
          { name: "Polysulfone (the support plastic)", status: "imported", note: "a common industrial plastic, many suppliers" },
          { name: "Polyester backing fabric", status: "imported", note: "easy to source from several countries" },
          { name: "Raw chemical feedstocks (Tier 3)", status: "domestic", note: "from the UAE's own refineries (ADNOC / TA'ZIZ)" },
        ],
      },
      partners: [
        { name: "Toray / LG Chem / DuPont", role: "the world's main filter makers — technology + know-how transfer (Gulf desalination already runs largely on their products)" },
        { name: "EWEC · TAQA", role: "the Taweelah plant's operators — the guaranteed first customer and local partner" },
        { name: "TA'ZIZ / ADNOC", role: "the Tier-3 path: making the raw chemicals at Ruwais" },
      ],
      precedent: {
        flag: "sourced",
        title: "LG Chem × Alkhorayef — the filter factory Saudi Arabia just built (Dammam)",
        facts: [
          "US$86M joint venture announced May 2024; producing from early 2026 — about 20 months from announcement to output",
          "Sited in Dammam's industrial city; ~70% of the work done locally and 175+ jobs (reported figures)",
          "The region buys ≈ 700,000 filter elements a year (industry estimate) — easily enough demand for a second Gulf factory",
        ],
      },
      tiers: [
        {
          id: "t1", name: "Tier 1 · Stockpile filters", kind: "live",
          deliverable: "Hold 90 days' worth of spare filters in a climate-controlled store at KEZAD — and keep them fresh by using the oldest ones during routine maintenance at Taweelah and replacing them with new stock, so nothing ever expires.",
          cost: 0.35, vehicle: "SWF liquid capital",
          costBasis: "≈ AED 350m for a national 90-day filter stock plus warehousing — sized from how fast the Taweelah plant actually uses filters. Illustrative; the real price is set when the supply contract is signed.",
          days: 150, timeBasis: "~30 days to sign contracts, then ~120 days waiting in the suppliers' order queue. Paying more does not skip the queue — a contract signed in advance does.",
          livePts: 1.8, ceilPts: 0, local: 0,
          residual: "This buys time, not independence — the stock must keep rotating or it expires (~12-month shelf life), and every filter is still imported.",
          milestones: [["D0", "Standing supply contract signed with the qualified makers"], ["D30", "First order placed · climate-controlled store fitted out at KEZAD"], ["D150", "90-day national stock in place · rotation through Taweelah maintenance begins"]],
        },
        {
          id: "t2", name: "Tier 2 · Build the filter factory", kind: "mixed", recommended: true,
          deliverable: "A joint-venture filter factory and technical centre at KEZAD, copying the Saudi playbook — making complete filter cartridges for the UAE's own plants, plus export to neighbours.",
          cost: 0.70, vehicle: "Operation 300bn co-investment",
          costBasis: "Anchored to the real US$86M (≈AED 0.32bn) Saudi factory — doubled to cover a technical centre, more capacity and UAE costs.",
          days: 660, timeBasis: "~22 months — exactly what the Saudi factory took from announcement (May 2024) to production (early 2026), plus time to test the new filters at Taweelah.",
          livePts: 0.6, ceilPts: 1.4, local: 70,
          residual: "~70% made locally — but the specialty chemicals inside are still imported. The weak point moves one step up the chain, from 'finished filters' to 'chemicals'.",
          milestones: [["M0", "JV signed with a filter maker · KEZAD site allocated"], ["M6", "Construction + industrial licensing underway"], ["M14", "Production line installed · trial elements made"], ["M22", "Elements qualified at Taweelah · commercial output"]],
        },
        {
          id: "t3", name: "Tier 3 · Make the chemicals too", kind: "ceiling",
          deliverable: "Make the specialty chemicals themselves (MPD, TMC and the support plastic) at the TA'ZIZ chemicals hub in Ruwais — using the UAE's own refinery by-products as the starting material, and feeding the Tier-2 factory.",
          cost: 2.2, vehicle: "Operation 300bn + ADNOC/TA'ZIZ",
          costBasis: "Modelled — there is no directly comparable project. Specialty-chemical plants run US$200–400M each, plus the plastic production. Treat as a planning estimate, not a quote.",
          days: 1460, timeBasis: "~4 years — chemical plants need heavy licensing, safety approval and product testing. Best sequenced after Tier 2 proves the demand.",
          livePts: 0, ceilPts: 2.6, local: 95,
          residual: "Near-full independence; what remains imported are common solvents and equipment spares. The honest end-state — but the slow one.",
          milestones: [["Y0", "Feasibility + chemical licensing at TA'ZIZ, Ruwais"], ["Y2", "Plant construction"], ["Y3.5", "Product qualification with the Tier-2 factory"], ["Y4", "Local chemicals feeding local filter production"]],
        },
      ],
      premortem: [
        { mode: "The stockpile quietly expires on the shelf", likelihood: "Medium",
          indicator: "Average age of stored filters vs their ~12-month shelf life", tracked: false,
          mitigation: "Keep the stock moving: use the oldest stored filters during routine plant maintenance and replace them with new ones — so the reserve is always fresh, never a write-off." },
        { mode: "Everyone re-orders at once and the suppliers are swamped", likelihood: "High",
          indicator: "Quoted delivery times from the three big makers stretching past 120 days", tracked: true,
          trackedWhere: "Dependencies → RO membranes (the ~120-day reorder lead-time vs the 75-day buffer)",
          mitigation: "Sign a standing supply contract now that guarantees the UAE a place at the front of the queue — not a purchase order placed after the rush has already started." },
        { mode: "The factory looks local, but the risk is not", likelihood: "Medium",
          indicator: "Where the new factory buys its specialty chemicals from", tracked: false,
          mitigation: "Treat the factory as a stepping stone and keep the Tier-3 decision on the calendar — at 70% local, the weak point has moved upstream, not disappeared." },
      ],
    },

    /* ---- 2 · LOGISTICS — Fujairah import bypass --------------------------- */
    {
      id: "fujairah-bypass",
      title: "Give imports a back door — the Fujairah bypass",
      sector: "logistics", window: 0.80,
      addresses: "~60% of imports land at Jebel Ali — a port inside the Strait of Hormuz",
      sponsor: { name: "AD Ports Group + Ministry of Energy & Infrastructure", why: "AD Ports operates Fujairah Terminals and Khalifa Port; the federal ministry owns transport policy and Etihad Rail's mandate." },
      thesis: "The 2026 closure of the strait proved the point twice. Oil exports kept flowing, because oil has a pipeline to Fujairah on the open ocean — but imports have no such back door: container ships still funnel through the strait to Jebel Ali. The choice is how much of the import flow gets the same insurance the oil already enjoys.",
      site: {
        where: "Port of Fujairah + Fujairah Terminals, Gulf of Oman coast",
        why: "The only major UAE port on the open ocean, outside the strait. Already a world-class refuelling hub, with an Etihad Rail freight line running inland — so cargo can land and move without ever touching the strait. Al Maktoum airport (DWC) hosts the reserved air-cargo lane.",
      },
      tech: {
        summary: "Nothing new is invented here — this is a routing plan: pre-booked ship berths at the east-coast port, trains to carry cargo inland, and a standing air-cargo lane for the few genuinely urgent goods (medicines, computer chips).",
        inputs: [
          { name: "Container space at Fujairah port", status: "partial", note: "small today compared to Jebel Ali — the Tier-2 build fixes this" },
          { name: "Etihad Rail freight slots", status: "domestic", note: "the railway already reaches Fujairah" },
          { name: "Long-haul cargo aircraft", status: "imported", note: "contracted routes that avoid Gulf airspace entirely" },
        ],
      },
      partners: [
        { name: "AD Ports Group · Fujairah Terminals", role: "berths, cargo handling, and the east-coast expansion" },
        { name: "Etihad Rail", role: "inland transport that never touches the strait" },
        { name: "DP World", role: "re-routing the shipping network + the Jebel Ali interface" },
      ],
      precedent: {
        flag: "sourced",
        title: "ADCOP — the oil bypass that worked, then doubled",
        facts: [
          "The Habshan–Fujairah oil pipeline: 360–380 km, built for ~US$4.2bn, opened 2012 — carries ~1.5M barrels/day around the strait",
          "Battle-tested: during the 2026 closure, oil shipments from Fujairah actually ROSE (≈1.17 → 1.62M barrels/day) while the strait was shut",
          "May 2026: ADNOC fast-tracked a second, parallel pipeline to roughly double the bypass — the state doubling down on the same logic",
        ],
      },
      tiers: [
        {
          id: "t1", name: "Tier 1 · Contract the back door", kind: "live", recommended: true,
          deliverable: "Standing agreements, ready to switch on: pre-booked ship berths at Fujairah, reserved train slots inland, and a reserved air-cargo lane from Al Maktoum airport for medicines and chips — all activated by a trigger, not improvised in a crisis.",
          cost: 0.50, vehicle: "SWF liquid capital (standing contracts)",
          costBasis: "≈ AED 0.5bn a year in reservation fees plus higher handling costs than Jebel Ali. Illustrative — the carriers' actual quotes set the real price.",
          days: 90, timeBasis: "~3 months of signing contracts. Nothing is built — that is the point: the port, the railway and the airport all exist today.",
          livePts: 1.6, ceilPts: 0, local: null,
          residual: "Limited capacity: Fujairah handles a fraction of what Jebel Ali does, so this protects the critical goods only — not all trade.",
          milestones: [["D0", "Berth, rail-slot and air-lane term sheets opened"], ["D45", "Trigger protocol agreed — what activates the bypass, and who decides"], ["D90", "Standing contracts live · first activation drill run"]],
        },
        {
          id: "t2", name: "Tier 2 · Expand the east-coast port", kind: "mixed",
          deliverable: "Expand Fujairah's container terminal and add a rail-connected inland depot — so the east coast can carry a meaningful share of national imports, not just emergencies.",
          cost: 3.0, vehicle: "AD Ports + Operation 300bn",
          costBasis: "Based on what Gulf container-port expansions actually cost (US$0.8–1bn class for a major increment). Modelled at AED 3bn for the terminal, the depot and the rail works.",
          days: 1100, timeBasis: "~3 years — sea walls, cranes and rail connections take time. The oil pipeline itself took ~4 years to build.",
          livePts: 0.4, ceilPts: 1.6, local: null,
          residual: "Even expanded, the east coast supplements Jebel Ali rather than replacing it — and the ships and planes themselves remain foreign-operated.",
          milestones: [["M0", "Terminal expansion contracted (AD Ports)"], ["M12", "Quay and yard works · rail depot underway"], ["M30", "Cranes commissioned"], ["M36", "Expanded terminal + inland depot operational"]],
        },
        {
          id: "t3", name: "Tier 3 · Make it permanent policy", kind: "ceiling",
          deliverable: "A standing national rule: a fixed share of strategic imports always comes through the east coast — in good times and bad — with the warehouses and handling capacity built to match. The 'second pipeline', but for goods.",
          cost: 6.5, vehicle: "Federal infrastructure budget + AD Ports",
          costBasis: "Modelled — no comparable exists. Builds on Tier 2 plus permanent operating costs. A planning estimate.",
          days: 1800, timeBasis: "~5 years to full effect, phased in after Tier 2.",
          livePts: 0, ceilPts: 2.4, local: null,
          residual: "Routing this way costs more every year, even in calm times — that extra cost IS the insurance premium, and should be budgeted as one.",
          milestones: [["Y1", "East-coast routing share legislated · warehousing plan set"], ["Y3", "Tier-2 capacity complete"], ["Y5", "Fixed strategic-import share running through the east coast in normal times"]],
        },
      ],
      premortem: [
        { mode: "Fujairah is built for oil exports, not container imports", likelihood: "High",
          indicator: "Fujairah's container capacity vs the cargo that would need to land there", tracked: false,
          mitigation: "Until the expansion is built, send only liquids, bulk goods and rail-friendly cargo east; keep urgent container goods on the air lane rather than assuming the port can absorb Jebel Ali's traffic." },
        { mode: "The back door can be attacked too", likelihood: "Medium",
          indicator: "Drone or missile incidents near Fujairah's port and pipeline corridor", tracked: true,
          trackedWhere: "Live signals → trade-route news monitor & ACLED conflict feed",
          mitigation: "2026 showed it: debris from an intercepted drone set fire to one of Fujairah's own oil tanks. Spread out and harden the storage — the east coast avoids the strait, but not attack, so air defence must cover it too." },
        { mode: "The standing costs quietly burn through the budget", likelihood: "High",
          indicator: "Total reservation and air-freight spending vs budget", tracked: false,
          mitigation: "Keep the expensive air lane for genuinely urgent goods only (medicines, chips); everything else waits for shipping to recover. Air freight always costs many times more per tonne — it is a permanent premium, not a one-off." },
      ],
    },

    /* ---- 3 · ENERGY — solar+storage to unlink water from gas -------------- */
    {
      id: "solar-firming",
      title: "Break the water–gas link with round-the-clock solar",
      sector: "energy", window: 0.55,
      addresses: "Power stations and desalination plants both run on the same imported gas",
      sponsor: { name: "EWEC (procurer) + Masdar (developer)", why: "The exact pairing already delivering the precedent gigaproject next door — no new relationship to build." },
      thesis: "Electricity and drinking water draw on the same gas supply — so if gas is disrupted, both fail together. That is the deepest hidden link in this model. The UAE is already building the cure at world scale: a giant solar farm with batteries big enough to deliver power day and night. The choice is whether water gets a guaranteed share of it — and whether to build a second one that is water's own.",
      site: {
        where: "Abu Dhabi desert (Al Bihouth area) — alongside the Masdar solar gigaproject",
        why: "The 90 km² site, grid connections and construction crews for the current solar gigaproject are already in place — a water-dedicated addition extends a running programme instead of starting a new one. The Taweelah desalination plant is the natural customer on the same grid.",
      },
      tech: {
        summary: "A very large solar farm paired with very large batteries, so it delivers steady power around the clock — not just when the sun shines. Desalination plants are the perfect customer: they draw a constant, predictable load.",
        inputs: [
          { name: "Solar panels (Jinko / JA Solar)", status: "imported", note: "almost all made in China — itself a tracked dependency" },
          { name: "Grid-scale batteries (CATL units)", status: "imported", note: "a single supplier at the precedent project" },
          { name: "High-voltage transformers", status: "imported", note: "~240-day wait, made in Korea/EU — the bottleneck" },
          { name: "Construction + grid connection", status: "partial", note: "international builders; the UAE's own grid operator" },
        ],
      },
      partners: [
        { name: "Masdar · EWEC", role: "the developer and the grid operator — the pairing already proven on the current project" },
        { name: "CATL · Jinko · JA Solar", role: "the battery and panel suppliers already contracted next door" },
        { name: "POWERCHINA · Larsen & Toubro", role: "the construction firms building the precedent project" },
      ],
      precedent: {
        flag: "sourced",
        title: "Masdar–EWEC solar gigaproject (under construction now)",
        facts: [
          "US$6bn (≈AED 22bn): 5.2 GW of solar + 19 GWh of batteries → 1 GW of round-the-clock power; a world first at this scale",
          "Announced Jan 2025, ground broken Oct 2025, power flowing in 2027 — a real ~30-month clock, financed by lenders not the budget",
          "90 km² site, 10,000+ jobs; suppliers and builders already contracted",
        ],
      },
      tiers: [
        {
          id: "t1", name: "Tier 1 · Reserve a share for water", kind: "ceiling", recommended: true,
          deliverable: "Sign a contract guaranteeing desalination ~300MW of the new solar project's round-the-clock output from day one — with water's priority written into the grid operator's scheduling rules.",
          cost: 0.20, vehicle: "EWEC power-contract restructuring",
          costBasis: "Contract costs only — the solar farm is already being built and financed. What matters is the electricity price, which the project is targeting to be globally competitive.",
          days: 540, timeBasis: "Tied to the solar project switching on in 2027 (~18 months away). No faster path exists — the construction takes what it takes.",
          livePts: 0, ceilPts: 0.8, local: null,
          residual: "This shares out the first project, it does not add to it: every megawatt promised to water is one the grid — and the AI data centres — also wanted. Tier 2 is the real answer.",
          milestones: [["M0", "Water-priority clause negotiated with EWEC"], ["M6", "Priority written into the grid operator's scheduling rules"], ["M18", "Gigaproject switches on · water's ~300MW share flows"]],
        },
        {
          id: "t2", name: "Tier 2 · Build water its own solar", kind: "ceiling",
          deliverable: "Build water a dedicated solar-plus-battery project at half the scale of the current one — enough for ~500MW of steady power reserved for desalination plants.",
          cost: 11.0, vehicle: "Lender-financed (Masdar model) + Alterra",
          costBasis: "A direct half-size copy of the real US$6bn project under construction ≈ AED 11bn. The most solid cost estimate in this playbook — same desert, same suppliers, same builders.",
          days: 900, timeBasis: "~30 months — the same announcement-to-operation clock the current project is running, helped by crews already on site.",
          livePts: 0, ceilPts: 1.8, local: null,
          residual: "The hardware — panels, batteries, transformers — is still all imported: energy independence rises while equipment dependence stays. The transformer queue is the schedule risk.",
          milestones: [["M0", "Half-scale project tendered on the Masdar model"], ["M8", "Financing closed · panels and batteries ordered"], ["M24", "Construction complete"], ["M30", "~500MW round-the-clock reserved for desalination"]],
        },
        {
          id: "t3", name: "Tier 3 · Full independence from gas", kind: "ceiling",
          deliverable: "Tier 2, plus: buy the big grid transformers in advance, and upgrade key desalination plants so they can run on solar-plus-batteries alone — keeping water flowing even if gas and the main grid go down.",
          cost: 14.5, vehicle: "Lender-financed + Alterra + federal resilience budget",
          costBasis: "Tier 2's solid AED 11bn, plus AED 3.5bn estimated for the transformers and plant upgrades (no comparable project exists for that part).",
          days: 1460, timeBasis: "~4 years in phases: power flows at ~30 months, the plant upgrades finish after.",
          livePts: 0.2, ceilPts: 2.8, local: null,
          residual: "This is the end-state the whole idea points at: water no longer fails when gas does. But panels and batteries still come mostly from China unless paired with a local-manufacturing play.",
          milestones: [["M0", "Transformers ordered on day one (~240-day queue)"], ["M30", "Dedicated solar-plus-storage online"], ["Y4", "Key desalination plants able to run independent of gas and the main grid"]],
        },
      ],
      premortem: [
        { mode: "The sun sets — and the gas link quietly survives", likelihood: "High",
          indicator: "Hours the batteries actually cover vs when desalination needs power", tracked: false,
          mitigation: "Size the batteries to desalination's real round-the-clock needs (the current project's ratio is the reference). If the batteries are too small, gas still fills the night gap — and the link is never actually broken." },
        { mode: "The one component everyone on earth is queueing for", likelihood: "Medium",
          indicator: "Delivery times for high-voltage transformers (~240 days today, from Korea/EU)", tracked: true,
          trackedWhere: "Dependencies → grid transformers (lead-time & 240-day buffer)",
          mitigation: "Order the transformers the day the project is approved (Tier 3 does exactly this) — building solar fast runs straight into the global wait for the equipment that connects it to the grid." },
        { mode: "AI data centres outbid water for the power", likelihood: "High",
          indicator: "How the grid operator splits the new power: data centres vs desalination", tracked: false,
          mitigation: "The current project is openly marketed as powering the UAE's AI push — write water's guaranteed share into the contract now (Tier 1), or computing demand will absorb the entire first project." },
      ],
    },

    /* ---- 4 · HEALTH — API reserve & localization -------------------------- */
    {
      id: "api-localization",
      title: "Medicine ingredients — bigger reserve, then make them here",
      sector: "health", window: 0.50,
      addresses: "~65% of medicine ingredients come from India (est.) · hospitals hold ~60 days of stock",
      sponsor: { name: "Emirates Drug Establishment + Ministry of Health & Prevention", why: "The federal drug regulator sets the critical-medicines list and certifies the production lines; the ministry owns the reserve mandate." },
      thesis: "Hospitals run on imported medicine ingredients — the active chemicals inside each drug — an estimated ~65% of them from India, shipped through the strait. The UAE has already proven it can make them: a plant in Ras Al Khaimah has produced insulin's active ingredient for over a decade. The choice is how far to extend that proof: hold more stock, or start making the most critical medicines here.",
      site: {
        where: "Julphar campus, Ras Al Khaimah (expansion) + KEZAD packaging lines",
        why: "Ras Al Khaimah is home to Julphar, the region's largest generic-medicines maker — 13 UAE facilities and the Middle East's only insulin-ingredient plant. Expanding an existing certified site is faster and cheaper than starting fresh. RAK's own Saqr Port also sits outside the strait for incoming raw materials.",
      },
      tech: {
        summary: "Flexible chemical production lines that can each make several of the most-needed medicine ingredients — antibiotics, anaesthetics, insulin — plus a managed national reserve that hospitals constantly draw from and refill, so nothing sits long enough to expire.",
        inputs: [
          { name: "Raw chemicals (the starting materials)", status: "imported", note: "what ingredient-making begins with — concentrated in China and India" },
          { name: "Insulin production capability", status: "domestic", note: "the Ras Al Khaimah plant — proof it can be done here" },
          { name: "Quality certification (GMP)", status: "domestic", note: "the plant already holds European-standard certification" },
          { name: "Refrigerated storage (biologic drugs)", status: "partial", note: "needs guaranteed backup power and water to be real" },
        ],
      },
      partners: [
        { name: "Julphar", role: "the existing plant, staff and certifications — the expansion site" },
        { name: "PureHealth / M42", role: "the hospital networks — they know what is consumed and can manage the rotating reserve" },
        { name: "Pfizer · GSK · Novartis", role: "international drug makers already signing UAE manufacturing deals" },
      ],
      precedent: {
        flag: "sourced",
        title: "Julphar Diabetes — the ingredient plant that already exists",
        facts: [
          "US$150M dedicated facility (2012) producing 1,500 kg of insulin's active ingredient — about 40M vials a year; the only plant of its kind in the Middle East",
          "Julphar: the region's largest generic-medicines maker — 13 UAE facilities, European-certified, selling in 50+ countries",
          "Context: the UAE imported ~85% of its medicines as recently as 2019; Pfizer, GSK, Novartis and Roche have since signed local-manufacturing agreements",
        ],
      },
      tiers: [
        {
          id: "t1", name: "Tier 1 · Deepen the reserve", kind: "live", recommended: true,
          deliverable: "Grow the national reserve of medicine ingredients and critical drugs from 60 to 120 days — managed by the suppliers, held at hospital-network level, and constantly used and replaced so nothing expires in a warehouse.",
          cost: 0.55, vehicle: "Federal health budget + SWF",
          costBasis: "≈ AED 9m per day of national coverage (based on what hospitals actually consume) × 60 extra days. Illustrative; the management contract sets the true carrying cost.",
          days: 180, timeBasis: "~6 months: qualifying certified suppliers and completing the first stock rotation. Quality certification, not money, is what takes the time.",
          livePts: 1.6, ceilPts: 0, local: 0,
          residual: "Buys time, not independence — the 65% India concentration is untouched, and refrigerated medicines still need reliable power and water to stay usable.",
          milestones: [["M0", "Supplier-managed reserve contracted"], ["M3", "Qualified stock arriving · hospital-network storage ready"], ["M6", "120-day rotating reserve in place"]],
        },
        {
          id: "t2", name: "Tier 2 · Make critical medicines here", kind: "mixed",
          deliverable: "Expand the existing Ras Al Khaimah plant with flexible production lines covering the ~20 most critical medicine ingredients — chosen by intensive-care need — certified to European quality standards.",
          cost: 1.10, vehicle: "Operation 300bn + Julphar",
          costBasis: "Anchored to the plant's real US$150M single-medicine facility, scaled up for flexible multi-medicine lines ≈ AED 1.1bn. Expanding an existing site is genuinely cheaper — utilities, labs and certified staff are already there.",
          days: 900, timeBasis: "~30 months, including regulatory approval and stability testing — in pharmaceuticals, the paperwork clock runs longer than the construction clock.",
          livePts: 0.3, ceilPts: 1.4, local: 60,
          residual: "The raw chemicals these lines start from are still imported — as with water filters, the weak point moves a step up the chain. Choose which medicines to make by where their raw materials come from, not just how much is used.",
          milestones: [["M0", "Julphar expansion agreed · medicine list chosen by ICU need + supply risk"], ["M12", "Flexible production lines installed"], ["M24", "GMP certification + stability testing"], ["M30", "First locally-made critical ingredients"]],
        },
        {
          id: "t3", name: "Tier 3 · Full pharma campus", kind: "ceiling",
          deliverable: "A complete pharmaceutical campus — ingredient production, sterile packaging, and refrigerated biologic drugs — built with the international drug makers already signing UAE deals, turning the country from an importer into a regional supplier.",
          cost: 3.6, vehicle: "Operation 300bn + international joint ventures",
          costBasis: "Modelled — combines ingredient lines and packaging lines (US$300–500M class each). A planning estimate until the medicine list is chosen.",
          days: 1800, timeBasis: "~5 years with international-standard approvals; sequenced after Tier 2's production lines.",
          livePts: 0, ceilPts: 2.2, local: 80,
          residual: "Some raw materials stay global; the campus turns the UAE from a price-taker into a regional supplier for the medicines it covers.",
          milestones: [["Y1", "Campus master plan · international JVs signed"], ["Y3", "Ingredient + sterile packaging lines running"], ["Y5", "Refrigerated biologics capability complete"]],
        },
      ],
      premortem: [
        { mode: "The reserve expires before it is ever needed", likelihood: "Medium",
          indicator: "The reserve's expiry schedule / how much is written off each year", tracked: false,
          mitigation: "Have the suppliers manage the stock against real hospital usage, so the reserve is constantly used and refilled instead of ageing in a warehouse." },
        { mode: "The medicine fridges fail in exactly the crisis they exist for", likelihood: "Medium",
          indicator: "How many cold-storage sites have guaranteed backup power and water", tracked: false,
          mitigation: "Put the cold storage next to the solar project — vaccines and biologic drugs need power and cooling, which are the first things a cascade takes out. A reserve you cannot keep cold is not a reserve." },
        { mode: "We make the easy medicines, not the risky ones", likelihood: "High",
          indicator: "Where the raw materials for the chosen medicine list come from", tracked: false,
          mitigation: "Pick the Tier-2 medicine list by intensive-care importance and supply risk, not manufacturing convenience — making easy medicines from Chinese raw materials just rebuilds the same dependency one step upstream." },
      ],
    },

    /* ---- 5 · FINANCE — sovereign import-stabilisation facility ------------ */
    {
      id: "stabilisation",
      title: "A standing emergency fund for imports",
      sector: "finance", window: 0.35,
      addresses: "Crisis price spikes · the cost surge of emergency importing",
      sponsor: { name: "CBUAE + Ministry of Finance", why: "The 2020 precedent ran through exactly this pairing — central-bank machinery under a federal mandate." },
      thesis: "The UAE's financial depth is its fastest tool — and the state has already shown it can stand up a major financial backstop in days, not months. A pre-built emergency fund that covers crisis import costs and absorbs price spikes keeps prices stable for households through a shock, at a fraction of the damage it prevents.",
      site: {
        where: "Central Bank of the UAE + Ministry of Finance (a facility, not a building)",
        why: "The 2020 precedent ran through the central bank's existing machinery — the fastest path is the proven one: central-bank plumbing plus a federal mandate, with no new institution to set up.",
      },
      tech: {
        summary: "Not a construction project — a set of financial arrangements agreed in advance: credit lines ready to draw on (so nothing has to be sold off in a panic), automatic triggers for when the fund switches on, and built-in rules for winding it down.",
        inputs: [
          { name: "Credit lines arranged in advance", status: "domestic", note: "so assets never have to be sold at panic prices" },
          { name: "Automatic on-switch", status: "domestic", note: "tied to this system's Live Resilience score and import prices" },
          { name: "Wind-down rules", status: "domestic", note: "the discipline that stops it becoming a permanent subsidy" },
        ],
      },
      partners: [
        { name: "CBUAE", role: "the central bank — the machinery and the credit lines (proven in 2020)" },
        { name: "Ministry of Finance · ADIA/EIA", role: "the mandate and the committed capital" },
      ],
      precedent: {
        flag: "knowledge",
        title: "TESS — the UAE's own speed record (figures from general knowledge)",
        facts: [
          "March 2020: within days of the COVID shock, the central bank stood up an AED 50bn support facility — inside a package that grew to ~AED 256bn",
          "It proved the two things this plan needs: the UAE can mobilise a large backstop fast, and can run it through existing machinery with rules and an end date",
        ],
      },
      tiers: [
        {
          id: "t1", name: "Tier 1 · Stand up the fund", kind: "live", recommended: true,
          deliverable: "AED 20bn committed through pre-arranged credit lines, with automatic crisis triggers — fully documented, governed, and dormant until needed.",
          cost: 20, vehicle: "Committed (not spent) — CBUAE lines + SWF",
          costBasis: "The headline figure is a commitment, not spending — the money stays invested and is mostly recoverable. The real cost is keeping that capital on standby, which is why bigger is not better.",
          days: 21, timeBasis: "~3 weeks to document and arrange the lines — the 2020 precedent ran in days using the same machinery. The one response where moving money fast genuinely is the speed of effect.",
          livePts: 1.5, ceilPts: 0, local: null,
          residual: "A cushion, not a cure — it keeps prices stable while the physical projects fix supply. The cost is the returns the standby capital is not earning elsewhere.",
          milestones: [["D0", "Mandate issued (Ministry of Finance + CBUAE)"], ["D10", "Credit lines documented"], ["D21", "Fund dormant but armed · triggers tied to the live score and import prices"]],
        },
        {
          id: "t2", name: "Tier 2 · Add price-smoothing rules", kind: "live",
          deliverable: "Tier 1, plus automatic price-smoothing: pre-written rules for when support kicks in, how much is paid per unit, and how it winds down — passed into law before any crisis, so nothing has to be improvised under pressure.",
          cost: 30, vehicle: "Committed — CBUAE + federal budget",
          costBasis: "AED 30bn committed envelope. Same committed-not-spent logic; the pre-written rules are what cap the actual spending.",
          days: 120, timeBasis: "~4 months — designing the mechanism and getting legal pre-approval is the clock, not the money.",
          livePts: 2.0, ceilPts: 0, local: null,
          residual: "Open-ended support inflates the very prices it pays — the wind-down rules are the protection; without them this becomes the problem it guards against.",
          milestones: [["M0", "Price-smoothing rules drafted — trigger, per-unit cap, taper"], ["M2", "Legal pre-approval"], ["M4", "Rules in force · fund armed"]],
        },
        {
          id: "t3", name: "Tier 3 · Make it permanent law", kind: "mixed",
          deliverable: "A permanent fund written into federal law, sized to how often shocks have actually hit historically, with a usage charge so businesses keep buying their own insurance too.",
          cost: 40, vehicle: "Committed — federal fiscal framework",
          costBasis: "AED 40bn standing envelope, estimated. Making it permanent turns a crisis tool into part of the structure — hence the points to the long-term score.",
          days: 365, timeBasis: "~12 months to pass through the federal fiscal framework.",
          livePts: 2.0, ceilPts: 0.5, local: null,
          residual: "The permanent risk is complacency: a standing backstop tempts companies to stop insuring themselves — unless using it costs something.",
          milestones: [["M0", "Draft law prepared"], ["M8", "Passage through the federal fiscal framework"], ["M12", "Permanent facility live, with a usage charge"]],
        },
      ],
      premortem: [
        { mode: "'Available' money is not the same as cash", likelihood: "High",
          indicator: "How much is genuinely liquid; the loss taken when drawing it down fast", tracked: false,
          mitigation: "Fund it through credit lines arranged in advance, never by selling assets — selling fast in a crisis means selling cheap, and headline figures always overstate what is truly available within a week." },
        { mode: "The fund props up the very prices it is paying", likelihood: "Medium",
          indicator: "Whether import prices rise in step with the support being paid out", tracked: false,
          mitigation: "Time-limit and taper the support, and cap it per unit — open-ended subsidies push up the prices they cover and hand the bill straight back to the fund." },
        { mode: "Idle billions, and bad habits", likelihood: "Medium",
          indicator: "How often the fund is actually drawn on vs its size", tracked: false,
          mitigation: "Size it to how often shocks really happen, not to the absolute worst case — and charge for using it, so companies keep hedging their own risks." },
      ],
    },

    /* ---- 6 · DEFENCE/TECH — compute under the open window ------------------ */
    {
      id: "compute-localisation",
      title: "Computer chips — stock up while the door is open",
      sector: "defence", window: 0.92,
      addresses: "Advanced chips depend on a US export licence — which policy could revoke",
      sponsor: { name: "Mubadala + AIATC (AI & Advanced Technology Council)", why: "Mubadala owns GlobalFoundries and the realistic build path; AIATC owns the licence relationship the stockpile depends on." },
      thesis: "The hard limit on advanced chips is not money — it is US export licences: a door that is open today under the UAE–US AI agreement, and which a policy change in Washington could shut faster than any factory can be built. So the honest plan runs two clocks at once: buy chips now while the door is open (months), and build what is realistically buildable here (years) — knowing the most advanced chips will never be made locally.",
      site: {
        where: "Stockpile: G42/Khazna secure facilities, Abu Dhabi · Build: KEZAD chip campus",
        why: "Khazna's data centres already hold and run top-end chips under the current licences; KEZAD has the industrial base for an assembly-and-test campus near the talent pool. The planned Stargate UAE campus anchors the demand locally.",
      },
      tech: {
        summary: "Two separate layers. One: a national reserve of top-end AI chips — bought, not built — under today's licences. Two: local chip 'finishing' (assembling, testing and packaging chips), and eventually a factory for older-generation chips. Only three companies on earth can make the most advanced chips — any plan that pretends the UAE will be the fourth will fail.",
        inputs: [
          { name: "Top-end AI chips (NVIDIA-class)", status: "imported", note: "by design — depends on US licences and the maker's allocation" },
          { name: "Assembly & test equipment", status: "imported", note: "long waits, but several suppliers exist" },
          { name: "Older-generation chip wafers", status: "partial", note: "via GlobalFoundries — already owned by Abu Dhabi" },
          { name: "Specialist engineers", status: "imported", note: "the scarcest input — staff exchanges must be written into the deal" },
        ],
      },
      partners: [
        { name: "G42 · Khazna", role: "secure custody of the chip reserve + the local demand (Stargate UAE)" },
        { name: "GlobalFoundries (Mubadala)", role: "older-generation chip making + know-how transfer — the UAE already owns it" },
        { name: "EDGE Group", role: "defence-grade testing and a secure supply chain" },
      ],
      precedent: {
        flag: "knowledge",
        title: "Stargate UAE + the US–UAE AI agreement (figures from general knowledge)",
        facts: [
          "May 2025: a US–UAE agreement opened the door, alongside 'Stargate UAE' — a planned giant AI campus in Abu Dhabi (G42 with OpenAI, Oracle, NVIDIA, Cisco, SoftBank), first phase targeted for 2026",
          "Nov 2025: G42 received approval to import advanced NVIDIA chips — concrete proof the door is open today",
          "GlobalFoundries: owned by Abu Dhabi's Mubadala, one of the world's top makers of older-generation chips — the UAE already owns the realistic build path",
        ],
      },
      tiers: [
        {
          id: "t1", name: "Tier 1 · Stockpile chips now", kind: "live", recommended: true,
          deliverable: "Buy top-end AI chips and spares in advance, under today's licences, into secure storage — a strategic compute reserve purchased while policy allows it.",
          cost: 3.5, vehicle: "SWF liquid capital + G42",
          costBasis: "≈ AED 3.5bn buys roughly 25–30k top-class AI chips at current prices — enough to keep national-priority systems running, not to power the whole AI build-out. Illustrative.",
          days: 180, timeBasis: "~6 months — the wait is the maker's delivery queue, not the money. The licence risk says: start now.",
          livePts: 0.9, ceilPts: 0, local: 0,
          residual: "Chips lose value fast as new generations arrive, and the licence dependency itself is untouched — this rents time against a policy reversal, nothing more.",
          milestones: [["D0", "Allocation secured under today's licences"], ["M3", "First deliveries into secure storage"], ["M6", "Reserve complete · refresh cycle set"]],
        },
        {
          id: "t2", name: "Tier 2 · Build chip finishing", kind: "ceiling",
          deliverable: "A chip 'finishing' campus at KEZAD — assembling, testing and packaging chips — with know-how from the UAE-owned GlobalFoundries and defence-grade certification from EDGE.",
          cost: 7.0, vehicle: "Operation 300bn + Mubadala",
          costBasis: "Based on what such campuses cost globally (US$1–2bn class) ≈ AED 7bn. The realistic middle rung of the chip-making ladder.",
          days: 1100, timeBasis: "~3 years — ultra-clean facilities, long equipment waits, then certification. Start recruiting the specialists the day it is approved.",
          livePts: 0, ceilPts: 1.6, local: 40,
          residual: "The silicon wafers still come from abroad — this converts 'import finished chips' into 'import wafers, finish them here'. Real progress, but partial.",
          milestones: [["M0", "KEZAD campus + GlobalFoundries know-how agreement · specialist recruiting starts"], ["M12", "Cleanroom build · equipment ordered"], ["M30", "Lines commissioned"], ["M36", "Defence-grade certification (EDGE)"]],
        },
        {
          id: "t3", name: "Tier 3 · Older-generation chip factory", kind: "ceiling",
          deliverable: "A factory for older-generation chips — the kind defence systems, industry and cars actually consume in volume — modelled on GlobalFoundries, which the UAE already owns.",
          cost: 18.0, vehicle: "Mubadala + Operation 300bn + partner equity",
          costBasis: "Estimated from comparable factories worldwide (US$4–5bn class) ≈ AED 18bn. Nothing like it exists in the UAE — treat as a planning estimate.",
          days: 1825, timeBasis: "~5 years to build and certify; best sequenced after Tier 2 has built the talent pipeline.",
          livePts: 0, ceilPts: 2.6, local: 65,
          residual: "The most advanced chips stay imported permanently — by design. The factory covers the chips actually used at volume; the cutting edge remains dependent on allies.",
          milestones: [["Y1", "Partner equity closed · site works"], ["Y3", "Fab shell + tooling installed"], ["Y5", "Older-generation wafers in production"]],
        },
      ],
      premortem: [
        { mode: "Washington changes its mind", likelihood: "Medium",
          indicator: "US export-control rule changes or blacklist actions", tracked: true,
          trackedWhere: "Live signals → trade-policy news lanes & OFAC sanctions feed",
          mitigation: "Execute the stockpile immediately while the door is open, and qualify chips from allied factories too — today's approval is a policy, not a promise, and can reverse with one election." },
        { mode: "Chasing a factory that cannot be built", likelihood: "High",
          indicator: "The gap between what the UAE could realistically make and what it needs", tracked: false,
          mitigation: "Aim at the realistic rungs — finishing, testing, and older-generation chips through GlobalFoundries — and cover the cutting edge with the stockpile plus alliances. Only a handful of firms can make the most advanced chips; no plan changes that." },
        { mode: "The factory exists, but the people do not", likelihood: "Medium",
          indicator: "The specialist hiring pipeline vs the staffing plan", tracked: false,
          mitigation: "Write training programmes and staff exchanges with the big chip makers into the deal from day one — these facilities run on rare specialists the UAE would import, so the fix carries the same workforce risk it is trying to cure." },
      ],
    },
  ];

  /* ---- Evaluation --------------------------------------------------------
     st = { tier: index } — the scope decision. Returns the tier's grounded
     numbers plus references for the UI to display the full derivation.   */
  function evalPlay(p, st) {
    st = st || {};
    const ti = st.tier == null ? p.tiers.findIndex((t) => t.recommended) : st.tier;
    const t = p.tiers[Math.max(0, ti)];
    const pts = t.livePts + t.ceilPts;
    const eff = pts / Math.max(t.cost, 0.2);
    return {
      tier: t, tierIndex: Math.max(0, ti),
      live: t.livePts, ceil: t.ceilPts, pts: +pts.toFixed(1),
      cost: t.cost, days: t.days, eff: +eff.toFixed(2),
    };
  }

  /* Priority 0–100 — a property of the PROBLEM, not the plan you pick.
     One flat line, three named factors, round weights:

       Priority = 0.5·Weakness + 0.3·Payoff + 0.2·Time-pressure

       • Weakness  — how fragile the sector is: its consequence-weighted DRI,
                     the same number behind the sector score on the Overview.
       • Payoff    — points the recommended fix would recover, scaled to the
                     biggest such across all plays.
       • Time-pressure — the one hand-set factor: a closing-clock the fragility
                     number can't see (e.g. an export licence open today).

     Weakness leads, so the queue tracks where the model is actually weakest.
     All three are tier-independent, so exploring or staging a scope never
     reorders the queue. Speed and value-for-money are deliberately NOT here —
     they're the lens for the *scope decision* on the right. Weights editable. */
  const _recPts = (p) => { const t = p.tiers.find((x) => x.recommended) || p.tiers[0]; return t.livePts + t.ceilPts; };
  const REF_PTS = Math.max(0.1, ...PLAYS.map(_recPts));
  // Weakness = consequence-weighted mean DRI / 100 (0–1). Same basis as the
  // sector score (100 − that wDRI), so it always agrees with the Overview grid.
  function sectorFragility(sectorId) {
    const ps = RD.precursors.filter((x) => x.sector === sectorId);
    if (!ps.length) return 0.5;
    const cw = ps.reduce((a, x) => a + x.consequence, 0) || 1;
    const wdri = ps.reduce((a, x) => a + x.dri * x.consequence, 0) / cw;
    return Math.min(1, wdri / 100);
  }
  const W_WEAK = 0.5, W_PAYOFF = 0.3, W_TIME = 0.2;
  function priorities(evals) {
    return evals.map((e) => {
      const weakness = sectorFragility(e.p.sector);
      const payoff = Math.min(1, _recPts(e.p) / REF_PTS); // recommended-scope pts → tier-independent
      const time = e.p.window != null ? e.p.window : 0.5;
      const score = 100 * (W_WEAK * weakness + W_PAYOFF * payoff + W_TIME * time);
      return { id: e.p.id, score: +score.toFixed(0), weakness, payoff, time, wdri: +(weakness * 100).toFixed(1) };
    });
  }

  function fmtDays(d) {
    if (d < 30) return d + " days";
    if (d < 365) return Math.round(d / 30) + " mo";
    return (d / 365).toFixed(1) + " yr";
  }
  function fmtAED(b) {
    if (b >= 1) return "AED " + (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)) + "bn";
    return "AED " + Math.round(b * 1000) + "m";
  }

  return { PLAYS, evalPlay, priorities, sectorFragility, fmtDays, fmtAED };
})();
