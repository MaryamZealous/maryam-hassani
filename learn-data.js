// learn-data.js — Maryam's influence map: thinkers, books, channels, ideas.
// Clusters: poly = polymaths, any era (center) · sci = science & curiosity ·
//           world = world & economics · build = building & product · live = how to live
// Positions are normalized (0..1) anchors; the graph drifts gently around them.
// Edit freely — add nodes, retag, repoint links.

window.LEARN = {
  clusters: {
    poly:  { label: "Polymaths",            short: "masters of many fields", lx: 0.40, ly: 0.33 },
    sci:   { label: "Science & Curiosity",  short: "how the world works", lx: 0.06, ly: 0.04 },
    world: { label: "World & Economics",    short: "why nations move",   lx: 0.72, ly: 0.04 },
    build: { label: "Building & Product",   short: "how to build",       lx: 0.07, ly: 0.95 },
    live:  { label: "How to Live",          short: "mind & meaning",     lx: 0.73, ly: 0.95 },
  },
  nodes: [
    // ---- Polymaths (center — everything radiates from here) ----
    { id: "khwarizmi", label: "Al-Khwarizmi", type: "thinker", cluster: "poly", x: 0.42, y: 0.45, hub: true,
      note: "Revolutionary mathematician whose name is the root of the word \u201Calgorithm\u201D — and who introduced algebra to the world. Every line of code traces back here." },
    { id: "kindi", label: "Al-Kindi", type: "thinker", cluster: "poly", x: 0.31, y: 0.52,
      note: "The philosopher of the Arabs. Brought Greek philosophy into Arabic thought, and broke ciphers with frequency analysis — cryptography's first scientist." },
    { id: "firnas", label: "Abbas ibn Firnas", type: "thinker", cluster: "poly", x: 0.38, y: 0.66,
      note: "Legendary inventor and engineer who made the earliest recorded scientific attempts at human flight — a thousand years before the Wright brothers." },
    { id: "khaldun", label: "Ibn Khaldun", type: "thinker", cluster: "poly", x: 0.60, y: 0.50,
      note: "The father of modern sociology, historiography, and economics. In his masterpiece, the Muqaddimah, Ibn Khaldun was the polymath who first mapped the roughly 100-year cycle of national supremacy — how group solidarity (ʿasabiyyah) lets a dynasty rise, then how comfort and complacency erode it over about three generations until the next power takes its place. The original theory of why empires rise and fall." },
    { id: "battuta", label: "Ibn Battuta", type: "thinker", cluster: "poly", x: 0.50, y: 0.61,
      note: "Extraordinary scholar and traveler who covered over 73,000 miles across Africa, the Middle East, and Asia, documenting medieval civilizations as he went." },
    { id: "wisdom", label: "House of Wisdom", type: "idea", cluster: "poly", x: 0.49, y: 0.38,
      note: "Baghdad's Bayt al-Hikma — where Al-Khwarizmi and Al-Kindi worked side by side. Proof that golden ages are built, deliberately, by putting curious minds in one room." },

    // ---- Polymaths (women across eras) ----
    { id: "fihri", label: "Fatima al-Fihri", type: "thinker", cluster: "poly", x: 0.56, y: 0.30,
      note: "Founded al-Qarawiyyin in Fez in 859 — by many accounts the oldest degree-granting university still running. She turned an inheritance into a thousand-year engine of learning." },
    { id: "astrulabi", label: "Mariam al-Astrulabi", type: "thinker", cluster: "poly", x: 0.29, y: 0.39,
      note: "Tenth-century Aleppo astronomer who designed and built intricate astrolabes — the handheld star-computers that let travelers find their place beneath the sky." },
    { id: "sutayta", label: "Sutayta al-Mahamali", type: "thinker", cluster: "poly", x: 0.45, y: 0.57,
      note: "Tenth-century Baghdad mathematician renowned for arithmetic and the algebra of inheritance — applied proof that the new mathematics belonged to everyone." },
    { id: "hypatia", label: "Hypatia of Alexandria", type: "thinker", cluster: "poly", x: 0.61, y: 0.39,
      note: "The great mathematician, astronomer, and philosopher of late-antique Alexandria — head of its Neoplatonist school, and ever since a symbol of reason itself." },
    { id: "duchatelet", label: "Émilie du Châtelet", type: "thinker", cluster: "poly", x: 0.34, y: 0.29,
      note: "Enlightenment physicist and mathematician who translated and corrected Newton — her commentary on the Principia is still the standard French edition." },
    { id: "davinci", label: "Leonardo da Vinci", type: "thinker", cluster: "poly", x: 0.40, y: 0.31,
      note: "The Renaissance ideal of the universal mind — painter, anatomist, engineer, inventor. His notebooks blur art and science until the line between them disappears." },

    // ---- Science & Curiosity (top-left) ----
    { id: "veritasium", url: "https://www.youtube.com/@veritasium", label: "Veritasium", type: "video", cluster: "sci", x: 0.10, y: 0.17, hub: true,
      note: "Counterintuitive science — why the obvious answer is usually wrong, tested on camera. @veritasium" },
    { id: "3b1b", url: "https://www.youtube.com/@3blue1brown", label: "3Blue1Brown", type: "video", cluster: "sci", x: 0.25, y: 0.12,
      note: "Grant Sanderson makes mathematics visual — intuition before formalism, every time. @3blue1brown" },
    { id: "cleo", url: "https://www.youtube.com/@CleoAbram", label: "Cleo Abram", type: "video", cluster: "sci", x: 0.06, y: 0.32,
      note: "Optimistic, rigorous tech explainers — what the future looks like if things go right. @CleoAbram" },
    { id: "seeker", url: "https://www.youtube.com/@Seeker", label: "Seeker", type: "video", cluster: "sci", x: 0.21, y: 0.28,
      note: "Science news made legible — fast, visual briefings from the edge of research. @Seeker" },
    { id: "bigthink", url: "https://www.youtube.com/@bigthink", label: "Big Think", type: "video", cluster: "sci", x: 0.33, y: 0.20,
      note: "Experts compressing their life's work into minutes — a buffet of big ideas. @bigthink" },

    // ---- World & Economics (top-right) ----
    { id: "wealth", label: "The Wealth of Nations", type: "book", cluster: "world", x: 0.76, y: 0.15, hub: true,
      note: "Adam Smith on the division of labor, markets, and the invisible hand — still the foundation under every economics argument." },
    { id: "econx", url: "https://www.youtube.com/@EconomicsExplained", label: "Economics Explained", type: "video", cluster: "world", x: 0.85, y: 0.26,
      note: "Whole economies told as stories of incentives — why nations get rich, stall, or unravel. @EconomicsExplained" },
    { id: "johnny", url: "https://www.youtube.com/@johnnyharris", label: "Johnny Harris", type: "video", cluster: "world", x: 0.64, y: 0.20,
      note: "Geopolitics and geography as visual investigations — maps, borders, and why the world is shaped this way. @johnnyharris" },
    { id: "lessons21", label: "21 Lessons for the 21st Century", type: "book", cluster: "world", x: 0.79, y: 0.32,
      note: "Harari on the present tense — AI, work, truth, and attention. What actually matters this century." },

    // ---- Building & Product (bottom-left) ----
    { id: "lennys", url: "https://www.youtube.com/@LennysPodcast", label: "Lenny's Podcast", type: "video", cluster: "build", x: 0.13, y: 0.76, hub: true,
      note: "Product, growth, and careers — operators explaining how it's actually done, not how it's written up. @LennysPodcast" },
    { id: "momtest", label: "The Mom Test", type: "book", cluster: "build", x: 0.04, y: 0.60,
      note: "Rob Fitzpatrick on customer conversations: ask questions so concrete that even your mom can't lie to you." },
    { id: "coldstart", label: "The Cold Start Problem", type: "book", cluster: "build", x: 0.17, y: 0.64,
      note: "Andrew Chen on network effects — how products go from zero to unstoppable, and why most never escape the cold start." },
    { id: "doac", url: "https://www.youtube.com/@TheDiaryOfACEO", label: "The Diary Of A CEO", type: "video", cluster: "build", x: 0.20, y: 0.88,
      note: "Steven Bartlett's long-form interviews on building, failure, and health — founders with the polish off. @TheDiaryOfACEO" },
    { id: "arabcast", url: "https://www.youtube.com/@ArabCastAE", label: "ArabCast · لكل إبداع حكاية", type: "video", cluster: "build", x: 0.33, y: 0.79,
      note: "Every creation has a story — Arab founders and creators on how they built it, in their own words. @ArabCastAE" },

    // ---- How to Live (bottom-right) ----
    { id: "meditations", label: "Meditations", type: "book", cluster: "live", x: 0.74, y: 0.80, hub: true,
      note: "Marcus Aurelius writing to himself — the private notebook of the most powerful man alive, on controlling only what you can." },
    { id: "mindgut", label: "The Mind-Gut Connection", type: "book", cluster: "live", x: 0.84, y: 0.71,
      note: "Emeran Mayer on the gut-brain dialogue — how the body shapes mood, decisions, and the mind itself." },
    { id: "life3d", label: "Life in Three Dimensions", type: "book", cluster: "live", x: 0.78, y: 0.89,
      note: "Shigehiro Oishi's case for psychological richness — not just happiness or meaning, but a life of varied, perspective-changing experience." },
    { id: "academy", url: "https://www.youtube.com/@academyofideas", label: "Academy of Ideas", type: "video", cluster: "live", x: 0.63, y: 0.74,
      note: "Philosophy and psychology of freedom and self-mastery — Jung, Nietzsche, and the inner life. @academyofideas" },
    { id: "lex", url: "https://www.youtube.com/@lexfridman", label: "Lex Fridman", type: "video", cluster: "live", x: 0.85, y: 0.58,
      note: "Marathon conversations on AI, science, power, and love — patience as an interviewing style. @lexfridman" },

    // ---- Science & Curiosity (added books) ----
    { id: "systems", label: "Thinking in Systems", type: "book", cluster: "sci", x: 0.04, y: 0.06,
      note: "Donella Meadows on seeing the world as stocks, flows, and feedback loops — the mental model under every resilience and complexity question." },
    { id: "hownotwrong", label: "How Not to Be Wrong", type: "book", cluster: "sci", x: 0.17, y: 0.04,
      note: "Jordan Ellenberg on the hidden maths of everyday life — how mathematical thinking sharpens judgement far outside the classroom." },
    { id: "hitchhiker", label: "The Hitchhiker's Guide to the Galaxy", type: "book", cluster: "sci", x: 0.37, y: 0.32,
      note: "Douglas Adams' cosmic comedy — curiosity, absurdity, and the reminder not to take the universe (or yourself) too seriously." },

    // ---- World & Economics (added books) ----
    { id: "silkroads", label: "The New Silk Roads", type: "book", cluster: "world", x: 0.90, y: 0.12,
      note: "Peter Frankopan on the East's return to the center of the world economy — where power and trade are actually flowing now." },
    { id: "prisoners", label: "Prisoners of Geography", type: "book", cluster: "world", x: 0.69, y: 0.09,
      note: "Tim Marshall on how mountains, rivers, and coastlines still dictate the choices of nations — geography as destiny." },
    { id: "materialworld", label: "Material World", type: "book", cluster: "world", x: 0.85, y: 0.05,
      note: "Ed Conway on the six raw materials — sand, salt, iron, copper, oil, lithium — that quietly underpin everything, and the handful of mines, refineries, and chokepoints they pass through. The physical foundation under the abstract economy; the source argument behind the whole resilience system." },
    { id: "sapiens", label: "Sapiens", type: "book", cluster: "world", x: 0.62, y: 0.30,
      note: "Yuval Noah Harari's brief history of humankind — how shared fictions let strangers cooperate at scale and built civilization." },
    { id: "surveillance", label: "The Age of Surveillance Capitalism", type: "book", cluster: "world", x: 0.91, y: 0.40,
      note: "Shoshana Zuboff on how human experience became raw material for prediction and profit — the new logic of power." },
    { id: "philosopher", label: "The Philosopher in the Valley", type: "book", cluster: "world", x: 0.75, y: 0.43,
      note: "Michael Steinberger on Alex Karp and Palantir — data, defense, and the rise of the surveillance state from inside Silicon Valley." },
    { id: "wmd", label: "Weapons of Math Destruction", type: "book", cluster: "world", x: 0.89, y: 0.31,
      note: "Cathy O'Neil on how opaque algorithms quietly encode bias and scale it across society — the case for demanding that models show their work." },
    { id: "nineteen84", label: "1984", type: "book", cluster: "world", x: 0.83, y: 0.49,
      note: "George Orwell's blueprint of surveillance, censorship, and language as control — the dystopia every conversation about state power still measures itself against." },
    { id: "bravenew", label: "Brave New World", type: "book", cluster: "world", x: 0.94, y: 0.47,
      note: "Aldous Huxley's softer dystopia — control through pleasure and distraction rather than force. The warning that we might engineer away our own freedom." },

    // ---- Building & Product (added books) ----
    { id: "startupcomm", label: "The Startup Community Way", type: "book", cluster: "build", x: 0.05, y: 0.83,
      note: "Brad Feld & Ian Hathaway on building entrepreneurial ecosystems — startups as a complex, emergent system, not a machine." },
    { id: "moonshots", label: "Moonshots", type: "book", cluster: "build", x: 0.30, y: 0.66,
      note: "Naveen Jain on thinking bigger — solving the world's hardest problems by aiming at the audacious rather than the incremental." },
    { id: "comingwave", label: "The Coming Wave", type: "book", cluster: "build", x: 0.31, y: 0.93,
      note: "Mustafa Suleyman on AI and synthetic biology — the most powerful technologies in history, and the containment problem they pose." },

    // ---- How to Live (added books) ----
    { id: "fivepeople", label: "The Five People You Meet in Heaven", type: "book", cluster: "live", x: 0.65, y: 0.90,
      note: "Mitch Albom's parable on how every life quietly touches others — meaning found in connections you never noticed." },
    { id: "strangers", label: "Talking to Strangers", type: "book", cluster: "live", x: 0.93, y: 0.82,
      note: "Malcolm Gladwell on why we misread people we don't know — the hidden assumptions behind our worst misunderstandings." },
    { id: "courage", label: "The Courage to Be Disliked", type: "book", cluster: "live", x: 0.70, y: 0.66,
      note: "Kishimi and Koga on Adlerian psychology, in dialogue form — freedom as the willingness to be disliked, and happiness as a present-tense choice." },
    { id: "prophet", label: "The Prophet", type: "book", cluster: "live", x: 0.59, y: 0.84,
      note: "Kahlil Gibran's prose-poetry on love, work, and freedom — a wanderer's parting wisdom on how to live, read and reread the world over." },

    // ---- AI, power & history (added books) ----
    { id: "atlasai", label: "Atlas of AI", type: "book", cluster: "world", x: 0.97, y: 0.37,
      note: "Kate Crawford on what AI is really made of — the minerals, labor, data, water and energy behind the 'cloud.' A foundational map of the AI supply chain and the physical cost of the abstract, and a direct cousin of the resilience system's whole argument. @_katecrawford_" },
    { id: "empireai", label: "Empire of AI", type: "book", cluster: "world", x: 0.96, y: 0.24,
      note: "Karen Hao's critical, investigative account of how modern empires are being built around AI — the concentration of power, labor and resources behind the handful of companies racing to own the technology." },
    { id: "oppression", label: "Algorithms of Oppression", type: "book", cluster: "world", x: 0.93, y: 0.55,
      note: "Safiya Noble on how search engines encode racism and bias — published before ChatGPT, but the essential early argument that 'neutral' algorithms and machine learning carry the prejudices of the systems that build them." },
    { id: "destiny", label: "Destiny Disrupted", type: "book", cluster: "world", x: 0.57, y: 0.12,
      note: "Tamim Ansary's highly readable history of the world through Islamic eyes — a compelling reframing of the events we think we know, told from the center of a different map." },

    // ---- How to Live (added book) ----
    { id: "twentyfour7", label: "24/7", type: "book", cluster: "live", x: 0.92, y: 0.93,
      note: "Jonathan Crary on late capitalism and the ends of sleep — how a culture of non-stop speed and visibility (the movement against dromology) colonizes the last refuges of rest, and why an always-on life is a harmful one." },

    // ---- Ideas (concepts that thread the map together) ----
    { id: "algorithms", label: "Algorithms", type: "idea", cluster: "poly", x: 0.33, y: 0.24,
      note: "A recipe a machine can follow — named for Al-Khwarizmi himself. The single idea that turns mathematics into software, and software into power." },
    { id: "fictions", label: "Shared Fictions", type: "idea", cluster: "world", x: 0.66, y: 0.37,
      note: "Money, nations, laws, brands — stories we collectively agree to believe. Harari's claim that these fictions are what let strangers cooperate at scale." },
    { id: "networkfx", label: "Network Effects", type: "idea", cluster: "build", x: 0.22, y: 0.70,
      note: "Each new user makes the product more valuable to the rest — the compounding force behind why a few platforms become unstoppable and most never start." },
    { id: "antifragile", label: "Antifragility", type: "idea", cluster: "sci", x: 0.15, y: 0.47,
      note: "Some things don't just survive shocks — they get stronger from them. The property every resilient system, body, and portfolio is quietly chasing." },
    { id: "freedom", label: "Freedom", type: "idea", cluster: "live", x: 0.80, y: 0.63,
      note: "The recurring question under the dystopias and the philosophy alike — how much of it we really have, how easily it's engineered away, and what it costs to keep." },
  ],
  // edges connect related ideas; cross-cluster links are the interesting ones
  edges: [
    // within the roots
    ["khwarizmi","wisdom"],["kindi","wisdom"],["khwarizmi","kindi"],
    ["khaldun","battuta"],["khwarizmi","firnas"],
    // science & curiosity
    ["veritasium","3b1b"],["veritasium","seeker"],["cleo","veritasium"],
    ["cleo","seeker"],["bigthink","3b1b"],
    // world & economics
    ["wealth","econx"],["johnny","econx"],["wealth","lessons21"],["johnny","lessons21"],
    // building & product
    ["momtest","lennys"],["coldstart","lennys"],["momtest","coldstart"],
    ["doac","lennys"],["doac","arabcast"],
    // how to live
    ["meditations","academy"],["mindgut","life3d"],["meditations","life3d"],["lex","mindgut"],
    // bridges from the roots outward
    ["khwarizmi","3b1b"],        // algebra & algorithms ↔ visual math
    ["firnas","veritasium"],     // experiment ↔ experiment
    ["firnas","cleo"],           // invention ↔ tech optimism
    ["khaldun","wealth"],        // Muqaddimah ↔ political economy
    ["khaldun","econx"],         // civilization dynamics ↔ macro stories
    ["khaldun","lessons21"],     // reading civilizations, then and now
    ["battuta","johnny"],        // travel ↔ geography storytelling
    ["kindi","academy"],         // philosophy ↔ philosophy
    ["kindi","meditations"],     // Greek thought, carried forward
    ["arabcast","battuta"],      // Arab stories, medieval and modern
    // other bridges
    ["bigthink","lex"],          // long ideas ↔ long conversations
    ["coldstart","econx"],       // network effects ↔ economics
    ["doac","mindgut"],          // founder health ↔ gut science
    // ---- added books — woven into the existing map ----
    ["systems","3b1b"],["systems","coldstart"],["systems","econx"],
    ["hownotwrong","3b1b"],["hownotwrong","veritasium"],
    ["hitchhiker","veritasium"],["hitchhiker","bigthink"],
    ["silkroads","johnny"],["silkroads","wealth"],["prisoners","johnny"],["prisoners","silkroads"],
    ["materialworld","silkroads"],["materialworld","prisoners"],["materialworld","johnny"],["materialworld","systems"],["materialworld","antifragile"],
    ["sapiens","lessons21"],["sapiens","khaldun"],["sapiens","wealth"],
    ["surveillance","lessons21"],["surveillance","comingwave"],
    ["philosopher","surveillance"],["philosopher","comingwave"],
    ["comingwave","cleo"],["comingwave","lennys"],
    ["startupcomm","lennys"],["startupcomm","coldstart"],
    ["moonshots","lennys"],["moonshots","cleo"],
    ["fivepeople","meditations"],["fivepeople","life3d"],
    ["strangers","lex"],["strangers","academy"],
    ["wmd","surveillance"],["wmd","hownotwrong"],["wmd","systems"],
    ["nineteen84","surveillance"],["nineteen84","bravenew"],["nineteen84","academy"],
    ["bravenew","surveillance"],["bravenew","academy"],
    ["courage","academy"],["courage","meditations"],
    ["prophet","meditations"],["prophet","fivepeople"],["prophet","academy"],
    // ---- ideas thread clusters together ----
    ["algorithms","khwarizmi"],["algorithms","3b1b"],["algorithms","hownotwrong"],["algorithms","wmd"],["algorithms","comingwave"],
    ["fictions","sapiens"],["fictions","wealth"],["fictions","lessons21"],["fictions","khaldun"],
    ["networkfx","coldstart"],["networkfx","econx"],["networkfx","startupcomm"],["networkfx","lennys"],
    ["antifragile","systems"],["antifragile","meditations"],["antifragile","comingwave"],
    ["freedom","nineteen84"],["freedom","bravenew"],["freedom","courage"],["freedom","academy"],["freedom","meditations"],
    // ---- women polymaths woven in ----
    ["fihri","wisdom"],["fihri","khaldun"],
    ["astrulabi","firnas"],["astrulabi","veritasium"],
    ["sutayta","khwarizmi"],["sutayta","algorithms"],
    ["hypatia","kindi"],["hypatia","khwarizmi"],["hypatia","3b1b"],
    ["duchatelet","3b1b"],["duchatelet","veritasium"],["duchatelet","algorithms"],
    ["davinci","firnas"],["davinci","astrulabi"],["davinci","veritasium"],["davinci","hypatia"],
    // ---- added books — AI, power, history & the always-on life ----
    ["atlasai","materialworld"],["atlasai","surveillance"],["atlasai","algorithms"],["atlasai","comingwave"],["atlasai","empireai"],
    ["empireai","surveillance"],["empireai","philosopher"],["empireai","comingwave"],["empireai","algorithms"],
    ["oppression","wmd"],["oppression","algorithms"],["oppression","surveillance"],
    ["destiny","khaldun"],["destiny","battuta"],["destiny","sapiens"],["destiny","lessons21"],["destiny","fihri"],
    ["twentyfour7","freedom"],["twentyfour7","surveillance"],["twentyfour7","bravenew"],["twentyfour7","academy"],
  ],
};
