/* ============================================================================
   analytics.js — tiny, privacy-light visit tracker for the whole site.

   What it measures
     • Unique viewers  — a random id kept in localStorage (no cookies, no PII).
     • Time per section — real attention time (only while the tab is visible),
       accrued per named section and flushed to the server.

   How a page declares its sections (three modes, auto-detected):
     1. SPA / tabbed apps — call  window.MA.section("Overview")  whenever the
        active view changes. This wins over everything.
     2. Scroll pages — put  data-sec="Name"  on section wrappers; the tracker
        watches them and credits time to whichever is most on-screen.
     3. Neither — the whole page counts as one section, "(page)".

   The page name comes from  <body data-page="Home">  (falls back to the URL).
   Data is POSTed to the /analytics Netlify function via sendBeacon.
   ========================================================================== */
(function () {
  if (window.__MA_LOADED) return;
  window.__MA_LOADED = true;

  var ENDPOINT = "/.netlify/functions/analytics";
  var HEARTBEAT_MS = 15000;   // flush accrued time on this cadence
  var MIN_SECTION_MS = 400;   // ignore sub-flicker section touches

  /* ---- unique viewer id (first-party, durable) ---- */
  var vid;
  try {
    vid = localStorage.getItem("ma_vid");
    if (!vid) {
      vid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
      localStorage.setItem("ma_vid", vid);
    }
  } catch (e) { vid = "anon-" + Math.random().toString(36).slice(2, 10); }

  var page = (document.body && document.body.getAttribute("data-page"))
    || (location.pathname.replace(/index\.html?$/, "").replace(/\/+$/, "") || "/");

  /* ---- accrual state ---- */
  var pending = {};                 // section -> ms not yet sent
  var current = null;               // active section name
  var manual = null;                // SPA-declared section (mode 1)
  var lastTick = Date.now();
  var registered = false;           // has the "view" been counted server-side?
  var visible = document.visibilityState === "visible";

  function accrue() {
    var now = Date.now();
    var sec = manual || current;
    if (visible && sec) pending[sec] = (pending[sec] || 0) + (now - lastTick);
    lastTick = now;
  }

  function flush(isFinal) {
    accrue();
    var sections = {};
    var any = false;
    for (var k in pending) {
      if (pending[k] >= MIN_SECTION_MS) { sections[k] = Math.round(pending[k]); any = true; }
    }
    // Send if there is time to report, or we still owe a "view" registration.
    if (!any && registered && !isFinal) return;
    pending = {};
    var payload = JSON.stringify({
      v: vid, page: page, sections: sections,
      newView: !registered, ts: Date.now(),
    });
    registered = true;
    var ok = false;
    try {
      if (navigator.sendBeacon) {
        ok = navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
      }
    } catch (e) { ok = false; }
    if (!ok) {
      try {
        fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(function () {});
      } catch (e) {}
    }
  }

  /* ---- mode 1: SPA sections ---- */
  window.MA = {
    section: function (name) {
      if (!name || name === manual) return;
      accrue();
      manual = String(name);
    },
    flush: flush,
  };

  /* ---- mode 2: scroll sections via IntersectionObserver ---- */
  function initScrollSections() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-sec]"));
    if (!els.length) { current = "(page)"; return; }
    var ratios = new Map();
    els.forEach(function (el) { ratios.set(el, 0); });
    function pick() {
      if (manual) return;                 // SPA mode overrides
      var best = null, bestR = 0;
      ratios.forEach(function (r, el) { if (r > bestR) { bestR = r; best = el; } });
      var name = best ? best.getAttribute("data-sec") : els[0].getAttribute("data-sec");
      if (name !== current) { accrue(); current = name; }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { ratios.set(en.target, en.isIntersecting ? en.intersectionRatio : 0); });
      pick();
    }, { threshold: [0, 0.15, 0.35, 0.55, 0.75, 1] });
    els.forEach(function (el) { io.observe(el); });
    current = els[0].getAttribute("data-sec");
  }

  /* ---- lifecycle ---- */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      visible = true; lastTick = Date.now();
    } else {
      visible = false; flush(false);
    }
  });
  window.addEventListener("pagehide", function () { flush(true); });
  window.addEventListener("beforeunload", function () { flush(true); });
  setInterval(function () { if (visible) flush(false); }, HEARTBEAT_MS);

  function boot() {
    initScrollSections();
    // Register the view promptly so quick bounces still count.
    setTimeout(function () { flush(false); }, 1200);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
