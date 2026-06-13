// learn-data.js — Maryam's influence map: thinkers, books, channels, ideas.
// Clusters: arab = Arab polymaths (center) · sci = science & curiosity ·
//           world = world & economics · build = building & product · live = how to live
// Positions are normalized (0..1) anchors; the graph drifts gently around them.
// Edit freely — add nodes, retag, repoint links.

window.LEARN = {
  clusters: {
    arab:  { label: "Arab Polymaths",       short: "the roots",          lx: 0.40, ly: 0.33 },
    sci:   { label: "Science & Curiosity",  short: "how the world works", lx: 0.06, ly: 0.04 },
    world: { label: "World & Economics",    short: "why nations move",   lx: 0.72, ly: 0.04 },
    build: { label: "Building & Product",   short: "how to build",       lx: 0.07, ly: 0.95 },
    live:  { label: "How to Live",          short: "mind & meaning",     lx: 0.73, ly: 0.95 },
  },
  nodes: [
    // ---- Arab Polymaths (center — everything radiates from here) ----
    { id: "khwarizmi", label: "Al-Khwarizmi", type: "thinker", cluster: "arab", x: 0.42, y: 0.45, hub: true,
      note: "Revolutionary mathematician whose name is the root of the word \u201Calgorithm\u201D — and who introduced algebra to the world. Every line of code traces back here." },
    { id: "kindi", label: "Al-Kindi", type: "thinker", cluster: "arab", x: 0.31, y: 0.52,
      note: "The philosopher of the Arabs. Brought Greek philosophy into Arabic thought, and broke ciphers with frequency analysis — cryptography's first scientist." },
    { id: "firnas", label: "Abbas ibn Firnas", type: "thinker", cluster: "arab", x: 0.38, y: 0.66,
      note: "Legendary inventor and engineer who made the earliest recorded scientific attempts at human flight — a thousand years before the Wright brothers." },
    { id: "khaldun", label: "Ibn Khaldun", type: "thinker", cluster: "arab", x: 0.60, y: 0.50,
      note: "The father of modern sociology, historiography, and economics — famous for analyzing the dynamics of civilizations in his masterpiece, the Muqaddimah." },
    { id: "battuta", label: "Ibn Battuta", type: "thinker", cluster: "arab", x: 0.50, y: 0.61,
      note: "Extraordinary scholar and traveler who covered over 73,000 miles across Africa, the Middle East, and Asia, documenting medieval civilizations as he went." },
    { id: "wisdom", label: "House of Wisdom", type: "idea", cluster: "arab", x: 0.49, y: 0.38,
      note: "Baghdad's Bayt al-Hikma — where Al-Khwarizmi and Al-Kindi worked side by side. Proof that golden ages are built, deliberately, by putting curious minds in one room." },

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
    { id: "sapiens", label: "Sapiens", type: "book", cluster: "world", x: 0.62, y: 0.30,
      note: "Yuval Noah Harari's brief history of humankind — how shared fictions let strangers cooperate at scale and built civilization." },
    { id: "surveillance", label: "The Age of Surveillance Capitalism", type: "book", cluster: "world", x: 0.91, y: 0.40,
      note: "Shoshana Zuboff on how human experience became raw material for prediction and profit — the new logic of power." },
    { id: "philosopher", label: "The Philosopher in the Valley", type: "book", cluster: "world", x: 0.75, y: 0.43,
      note: "Michael Steinberger on Alex Karp and Palantir — data, defense, and the rise of the surveillance state from inside Silicon Valley." },

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
    ["sapiens","lessons21"],["sapiens","khaldun"],["sapiens","wealth"],
    ["surveillance","lessons21"],["surveillance","comingwave"],
    ["philosopher","surveillance"],["philosopher","comingwave"],
    ["comingwave","cleo"],["comingwave","lennys"],
    ["startupcomm","lennys"],["startupcomm","coldstart"],
    ["moonshots","lennys"],["moonshots","cleo"],
    ["fivepeople","meditations"],["fivepeople","life3d"],
    ["strangers","lex"],["strangers","academy"],
  ],
};
