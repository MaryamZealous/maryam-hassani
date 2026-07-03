/* Netlify Function (v2) — shared episode log for the Resilience Intelligence
   System's validation & calibration loop.

   Storage: Netlify Blobs (site-wide store "ris-episodes"). Two keys:
     state    — detection state machine (EMA baseline + any open episode)
     episodes — closed, measured episodes (newest last, capped at 100)

   Clients POST observations (score + per-driver drag breakdown) every ~10 min;
   the SERVER runs episode detection so the log is one shared truth:
     open   when live < baseline − 3 (and ≥3 feeds live — sim-heavy readings
            are never allowed to write history)
     close  when live recovers to ≥ baseline − 1
   A closed episode stores the measured peak drop, duration, dominant driver,
   chokepoint context and the news-vs-throughput lead time.

   GET  /.netlify/functions/episodes            → { ok, episodes, open }
   POST /.netlify/functions/episodes { obs }    → { ok, recorded }
*/
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const OPEN_AT = 3;      // pts below baseline to open an episode
const CLOSE_AT = 1;     // pts below baseline to consider recovered
const MIN_LIVE_FEEDS = 3;
const MIN_OBS_GAP_MS = 5 * 60 * 1000;   // ignore observations closer than 5 min
const EMA_ALPHA = 0.05;                  // slow baseline

const topDriver = (drags) => {
  let best = null, bestV = -1;
  for (const k in drags || {}) {
    if (k === "total") continue;
    if (drags[k] > bestV) { bestV = drags[k]; best = k; }
  }
  return best;
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: CORS });
  const store = getStore("ris-episodes");

  if (req.method === "GET") {
    const episodes = (await store.get("episodes", { type: "json" })) || [];
    const state = (await store.get("state", { type: "json" })) || null;
    return new Response(JSON.stringify({
      ok: true,
      episodes,
      open: state && state.active ? {
        start: state.active.start,
        dropSoFar: +(state.baseline - state.active.minScore).toFixed(1),
        topDriver: state.active.topDriver,
      } : null,
    }), { status: 200, headers: CORS });
  }

  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 405, headers: CORS });

  let obs;
  try { obs = (await req.json()).obs; } catch (e) { obs = null; }
  // strict shape check — this endpoint writes shared history, so junk is refused
  if (!obs || typeof obs.live !== "number" || obs.live < 0 || obs.live > 100
    || typeof obs.liveFeeds !== "number" || typeof obs.drags !== "object") {
    return new Response(JSON.stringify({ ok: false, error: "bad observation" }), { status: 400, headers: CORS });
  }

  const now = Date.now();
  let state = (await store.get("state", { type: "json" })) || { baseline: obs.live, lastObs: 0, active: null };
  if (now - state.lastObs < MIN_OBS_GAP_MS) {
    return new Response(JSON.stringify({ ok: true, recorded: false, reason: "rate" }), { status: 200, headers: CORS });
  }
  state.lastObs = now;

  // sim-heavy readings never move the baseline or write history
  if (obs.liveFeeds < MIN_LIVE_FEEDS) {
    await store.setJSON("state", state);
    return new Response(JSON.stringify({ ok: true, recorded: false, reason: "insufficient live feeds" }), { status: 200, headers: CORS });
  }

  const gap = state.baseline - obs.live;
  const drags = obs.drags || {};

  if (!state.active) {
    // quiet: baseline tracks slowly; a sharp drop opens an episode
    if (gap >= OPEN_AT) {
      state.active = {
        start: now, startBaseline: +state.baseline.toFixed(1),
        minScore: obs.live, minT: now,
        topDriver: topDriver(drags),
        newsFirstT: (drags.routeNews || 0) + (drags.partnerNews || 0) > 1 ? now : null,
        throughputFirstT: (drags.throughput || 0) > 1 ? now : null,
        hormuzDrop: obs.chokes && obs.chokes.hormuz || 0,
        redseaDrop: obs.chokes && obs.chokes.redsea || 0,
        obsCount: 1,
      };
    } else {
      state.baseline = state.baseline + EMA_ALPHA * (obs.live - state.baseline);
    }
  } else {
    const a = state.active;
    a.obsCount += 1;
    if (obs.live < a.minScore) {
      a.minScore = obs.live; a.minT = now;
      a.topDriver = topDriver(drags);
      a.hormuzDrop = Math.max(a.hormuzDrop, obs.chokes && obs.chokes.hormuz || 0);
      a.redseaDrop = Math.max(a.redseaDrop, obs.chokes && obs.chokes.redsea || 0);
    }
    if (a.newsFirstT == null && (drags.routeNews || 0) + (drags.partnerNews || 0) > 1) a.newsFirstT = now;
    if (a.throughputFirstT == null && (drags.throughput || 0) > 1) a.throughputFirstT = now;
    if (state.baseline - obs.live <= CLOSE_AT) {
      // recovered — close and record the measured episode
      const episodes = (await store.get("episodes", { type: "json" })) || [];
      episodes.push({
        start: a.start, end: now,
        peakDrop: +(a.startBaseline - a.minScore).toFixed(1),
        daysToPeak: +((a.minT - a.start) / 86400e3).toFixed(1),
        daysToRecover: +((now - a.start) / 86400e3).toFixed(1),
        topDriver: a.topDriver,
        newsLeadMin: a.newsFirstT != null && a.throughputFirstT != null
          ? Math.round((a.throughputFirstT - a.newsFirstT) / 60000) : null,
        hormuzDrop: a.hormuzDrop, redseaDrop: a.redseaDrop,
        obsCount: a.obsCount,
      });
      await store.setJSON("episodes", episodes.slice(-100));
      state.active = null;
    }
  }

  await store.setJSON("state", state);
  return new Response(JSON.stringify({ ok: true, recorded: true }), { status: 200, headers: CORS });
};

export const config = { path: "/.netlify/functions/episodes" };
