/* ============================================================================
   motion.js — shared, tasteful motion layer (Lenis + GSAP + ScrollTrigger).

   Design intent: honor the paper-&-ink identity. Nothing flashy — smooth
   scroll, a gentle rise-and-fade as sections enter, and a soft word-stagger
   on headlines. Everything is fully disabled under prefers-reduced-motion.

   Opt-in via attributes (no per-page JS needed):
     data-reveal              → fades + rises in when it enters the viewport
     data-reveal="left"/"right"/"scale"/"none"  → variant of the entrance
     data-reveal-delay="0.1"  → seconds of extra delay
     data-reveal-group        → stagger direct [data-reveal] children together
     data-split               → split headline into words and stagger them in

   Initial hidden state is set in CSS gated on <html class="motion"> (added by a
   tiny inline script in <head>), so there is no flash and no-JS/reduced-motion
   users see everything immediately. A 4s safety reveals all if anything stalls.
   ========================================================================== */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  function showAll() {
    root.classList.add("motion-done");
    [].forEach.call(document.querySelectorAll("[data-reveal]"), function (el) {
      el.style.opacity = "1"; el.style.transform = "none";
    });
  }
  if (reduce) { root.classList.remove("motion"); showAll(); return; }
  // hard safety: never leave content hidden
  setTimeout(showAll, 4000);

  /* ---- word splitter (markup-safe: recurses, keeps inline tags) ---- */
  function splitWords(el) {
    if (el.__split) return; el.__split = true;
    var words = [];
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (tok === "") return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            var w = document.createElement("span");
            w.className = "m-word"; w.textContent = tok;
            frag.appendChild(w); words.push(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(el);
    return words;
  }

  function init() {
    var g = window.gsap, ST = window.ScrollTrigger;
    if (!g) { showAll(); return; }
    if (ST) g.registerPlugin(ST);

    /* ---- Lenis smooth scroll (only where the page actually scrolls) ---- */
    if (window.Lenis && document.body.scrollHeight > window.innerHeight + 40) {
      var lenis = new Lenis({
        lerp: 0.12,                 // light, responsive smoothing (single driver)
        smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5,
      });
      // Drive Lenis from exactly ONE clock. Prefer GSAP's ticker when present
      // (keeps ScrollTrigger in sync); otherwise use our own rAF loop.
      if (ST) {
        lenis.on("scroll", ST.update);
        g.ticker.add(function (t) { lenis.raf(t * 1000); });
        g.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      window.__lenis = lenis;
    }

    /* ---- headline word stagger ---- */
    [].forEach.call(document.querySelectorAll("[data-split]"), function (el) {
      var words = splitWords(el);
      if (!words || !words.length) return;
      el.style.opacity = "1";
      g.set(words, { yPercent: 40, opacity: 0 });
      var play = function () {
        g.to(words, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.03,
          delay: parseFloat(el.getAttribute("data-split-delay")) || 0.05 });
      };
      if (ST && !inView(el)) ST.create({ trigger: el, start: "top 88%", once: true, onEnter: play });
      else play();
    });

    /* ---- reveal on enter ---- */
    var revs = [].slice.call(document.querySelectorAll("[data-reveal]"));
    revs.forEach(function (el) {
      var v = el.getAttribute("data-reveal") || "up";
      var from = { opacity: 0 };
      if (v === "left") from.x = -28; else if (v === "right") from.x = 28;
      else if (v === "scale") { from.scale = 0.96; from.y = 14; }
      else if (v === "none") {} else from.y = 20;
      g.set(el, from);
    });
    function playReveal(el, i) {
      var v = el.getAttribute("data-reveal") || "up";
      var to = { opacity: 1, duration: 0.85, ease: "power2.out",
        delay: (parseFloat(el.getAttribute("data-reveal-delay")) || 0) + (i ? i * 0.07 : 0) };
      if (v === "left" || v === "right") to.x = 0;
      else if (v === "scale") { to.scale = 1; to.y = 0; }
      else if (v !== "none") to.y = 0;
      g.to(el, to);
    }
    // grouped children stagger together; lone reveals fire individually
    var grouped = new Set();
    [].forEach.call(document.querySelectorAll("[data-reveal-group]"), function (grp) {
      var kids = [].slice.call(grp.querySelectorAll(":scope > [data-reveal]"));
      kids.forEach(function (k) { grouped.add(k); });
      var run = function () { kids.forEach(function (k, i) { playReveal(k, i); }); };
      if (ST && !inView(grp)) ST.create({ trigger: grp, start: "top 85%", once: true, onEnter: run });
      else run();
    });
    revs.forEach(function (el) {
      if (grouped.has(el)) return;
      var run = function () { playReveal(el, 0); };
      if (ST && !inView(el)) ST.create({ trigger: el, start: "top 88%", once: true, onEnter: run });
      else run();
    });

    if (ST) ST.refresh();
    root.classList.add("motion-ready");
  }

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.9 && r.bottom > 0;
  }

  // React pages mount during Babel (after DOMContentLoaded), so init on load.
  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);

  // let pages re-scan after async content
  window.MAMotion = { refresh: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } };
})();
