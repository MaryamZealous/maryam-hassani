// learn-data.js — Maryam's influence map: thinkers, books, videos, ideas.
// Clusters: mm = mental models · math = mathematical reasoning ·
//           learn = science of learning · sys = systems & resilience
// Positions are normalized (0..1) anchors; the graph drifts gently around them.
// Edit freely — add nodes, retag, repoint links.

window.LEARN = {
  clusters: {
    mm:    { label: "Mental Models",          short: "how to think",  lx: 0.10, ly: 0.04 },
    math:  { label: "Mathematical Reasoning", short: "how to reason", lx: 0.70, ly: 0.04 },
    learn: { label: "Science of Learning",    short: "how to learn",  lx: 0.11, ly: 0.95 },
    sys:   { label: "Systems & Resilience",   short: "how it holds",  lx: 0.74, ly: 0.95 },
  },
  nodes: [
    // ---- Mental Models (top-left) ----
    { id: "munger",   label: "Charlie Munger",     type: "thinker", cluster: "mm",  x: 0.15, y: 0.34, hub: true,
      note: "The latticework of mental models — borrow the big ideas from every discipline and let them check each other." },
    { id: "almanack", label: "Poor Charlie's Almanack", type: "book", cluster: "mm", x: 0.07, y: 0.52,
      note: "Munger's worldly wisdom, collected. Inversion, incentives, and the psychology of misjudgment." },
    { id: "kahneman", label: "Daniel Kahneman",    type: "thinker", cluster: "mm",  x: 0.11, y: 0.15,
      note: "Two systems of mind — fast intuition and slow reasoning — and the biases that live in the gap." },
    { id: "tfs",      label: "Thinking, Fast and Slow", type: "book", cluster: "mm", x: 0.26, y: 0.46,
      note: "The field guide to your own cognitive shortcuts, and when not to trust them." },
    { id: "parrish",  label: "Farnam Street",      type: "video",   cluster: "mm",  x: 0.29, y: 0.20,
      note: "Shane Parrish on thinking clearly — conversations that turn mental models into daily practice." },

    // ---- Mathematical Reasoning (top-right) ----
    { id: "feynman",  label: "Richard Feynman",    type: "thinker", cluster: "math", x: 0.55, y: 0.19, hub: true,
      note: "If you can't explain it simply, you don't understand it. Reasoning from first principles, with delight." },
    { id: "polya",    label: "George Pólya",       type: "thinker", cluster: "math", x: 0.75, y: 0.13,
      note: "How to Solve It — a heuristic for attacking any problem: understand, plan, execute, look back." },
    { id: "htsi",     label: "How to Solve It",    type: "book",    cluster: "math", x: 0.88, y: 0.26,
      note: "Pólya's four-step method. The closest thing to a grammar of problem solving." },
    { id: "3b1b",     label: "3Blue1Brown",        type: "video",   cluster: "math", x: 0.64, y: 0.35,
      note: "Grant Sanderson makes mathematics visual — intuition before formalism, every time." },
    { id: "lockhart", label: "Paul Lockhart",      type: "thinker", cluster: "math", x: 0.47, y: 0.35,
      note: "A Mathematician's Lament — math as an art of pattern and play, not a list of procedures." },
    { id: "mandel",   label: "Benoît Mandelbrot",  type: "thinker", cluster: "math", x: 0.72, y: 0.47,
      note: "Roughness has a geometry. Fractals: infinite complexity unfolding from one simple, repeated rule." },

    // ---- Science of Learning (bottom-left) ----
    { id: "oakley",   label: "Barbara Oakley",     type: "thinker", cluster: "learn", x: 0.17, y: 0.66, hub: true,
      note: "Learning How to Learn — focused vs. diffuse modes, chunking, and beating procrastination by design." },
    { id: "makeitstick", label: "Make It Stick",   type: "book",    cluster: "learn", x: 0.08, y: 0.80,
      note: "The evidence on durable learning: retrieval practice, spacing, interleaving. Effort is the point." },
    { id: "matuschak", label: "Andy Matuschak",    type: "thinker", cluster: "learn", x: 0.31, y: 0.81,
      note: "Why books don't work, and what does — spaced repetition, evergreen notes, knowledge you can build on." },
    { id: "waitzkin", label: "Josh Waitzkin",      type: "thinker", cluster: "learn", x: 0.14, y: 0.86,
      note: "The Art of Learning — depth over breadth, and making smaller circles until the basics become instinct." },
    { id: "srs",      label: "Spaced Repetition",  type: "idea",    cluster: "learn", x: 0.36, y: 0.66,
      note: "Review just before you'd forget. The simplest rule that compounds into a lasting memory." },

    // ---- Systems & Resilience (bottom-right) ----
    { id: "meadows",  label: "Donella Meadows",    type: "thinker", cluster: "sys", x: 0.74, y: 0.65, hub: true,
      note: "Thinking in Systems — stocks, flows, feedback, and where to find the leverage points that actually move things." },
    { id: "tis",      label: "Thinking in Systems", type: "book",   cluster: "sys", x: 0.89, y: 0.74,
      note: "The primer. Once you see feedback loops, you can't unsee them." },
    { id: "taleb",    label: "Nassim Taleb",       type: "thinker", cluster: "sys", x: 0.58, y: 0.75,
      note: "Antifragile — some things gain from disorder. Build for the shock you can't predict." },
    { id: "antifragile", label: "Antifragile",     type: "book",    cluster: "sys", x: 0.68, y: 0.85,
      note: "Beyond resilient: systems that get stronger when stressed, and how to court the right kind of risk." },
    { id: "fractalgeo", label: "The Fractal Geometry of Nature", type: "book", cluster: "sys", x: 0.85, y: 0.54,
      note: "Mandelbrot's masterwork — the self-similar patterns that structure coastlines, markets, and minds." },
  ],
  // edges connect related ideas; cross-cluster links are the interesting ones
  edges: [
    ["munger","almanack"],["munger","kahneman"],["munger","tfs"],["kahneman","tfs"],
    ["munger","parrish"],["parrish","kahneman"],
    ["feynman","polya"],["polya","htsi"],["feynman","3b1b"],["feynman","lockhart"],
    ["lockhart","3b1b"],["mandel","3b1b"],
    ["oakley","makeitstick"],["oakley","matuschak"],["matuschak","srs"],
    ["oakley","srs"],["waitzkin","oakley"],["makeitstick","srs"],
    ["meadows","tis"],["taleb","antifragile"],["meadows","taleb"],
    ["mandel","fractalgeo"],["meadows","fractalgeo"],
    // cross-cluster bridges
    ["mandel","taleb"],          // fractals ↔ fat tails
    ["feynman","oakley"],        // teaching ↔ learning
    ["munger","taleb"],          // risk ↔ mental models
    ["kahneman","waitzkin"],     // mind ↔ practice
    ["polya","matuschak"],       // problem solving ↔ knowledge building
    ["mandel","meadows"],        // self-similarity ↔ systems
  ],
};
