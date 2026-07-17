/* Netlify Function (v2) — site analytics collector + reader.

   Storage: Netlify Blobs, store "ma-analytics", one key "agg".
   Shape:
     {
       pages: {
         "<page>": {
           views:   <int>,                 // total page loads
           uniq:    { "<vid>": <lastTs> },  // unique-viewer ledger (prunable)
           sections:{ "<name>": { ms:<int>, hits:<int> } }
         }
       },
       updated: <ts>
     }

   POST { v, page, sections:{name:ms}, newView, ts }  → merge one beacon
   GET                                                 → { ok, pages, updated }

   Unique viewers per page = number of keys in `uniq` (capped, oldest pruned).
   Time spent per section  = sections[name].ms  (total attention ms).
*/
import { getStore } from "@netlify/blobs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const UNIQ_CAP = 5000;          // max remembered visitor ids per page
const SANE_MAX_MS = 6 * 3600e3; // ignore absurd single-beacon durations (6h)

function prune(uniq) {
  const keys = Object.keys(uniq);
  if (keys.length <= UNIQ_CAP) return uniq;
  keys.sort((a, b) => uniq[a] - uniq[b]);           // oldest first
  for (let i = 0; i < keys.length - UNIQ_CAP; i++) delete uniq[keys[i]];
  return uniq;
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: CORS });
  const store = getStore("ma-analytics");

  if (req.method === "GET") {
    // Owner-only read. Requires ANALYTICS_KEY env var; fails closed if unset.
    const secret = process.env.ANALYTICS_KEY || "";
    const url = new URL(req.url);
    const given = url.searchParams.get("key") || req.headers.get("x-analytics-key") || "";
    if (!secret || given !== secret) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: CORS });
    }
    const agg = (await store.get("agg", { type: "json" })) || { pages: {}, updated: 0 };
    // Return unique COUNTS, never the id ledger.
    const pages = {};
    for (const p in agg.pages) {
      const pg = agg.pages[p];
      pages[p] = {
        views: pg.views || 0,
        uniques: pg.uniq ? Object.keys(pg.uniq).length : 0,
        sections: pg.sections || {},
      };
    }
    return new Response(JSON.stringify({ ok: true, pages, updated: agg.updated || 0 }),
      { status: 200, headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 405, headers: CORS });
  }

  let b;
  try { b = await req.json(); } catch (e) { b = null; }
  if (!b || typeof b.v !== "string" || typeof b.page !== "string") {
    return new Response(JSON.stringify({ ok: false, error: "bad beacon" }), { status: 400, headers: CORS });
  }

  const now = Date.now();
  const agg = (await store.get("agg", { type: "json" })) || { pages: {}, updated: 0 };
  const page = b.page.slice(0, 120);
  const pg = agg.pages[page] || (agg.pages[page] = { views: 0, uniq: {}, sections: {} });

  // unique viewer + view count
  const isNewViewer = !(b.v in pg.uniq);
  pg.uniq[b.v] = now;
  if (b.newView) pg.views = (pg.views || 0) + 1;
  if (isNewViewer) prune(pg.uniq);

  // per-section attention time
  if (b.sections && typeof b.sections === "object") {
    for (const name in b.sections) {
      let ms = +b.sections[name];
      if (!(ms > 0)) continue;
      if (ms > SANE_MAX_MS) ms = SANE_MAX_MS;
      const key = String(name).slice(0, 80);
      const s = pg.sections[key] || (pg.sections[key] = { ms: 0, hits: 0 });
      s.ms += Math.round(ms);
      s.hits += 1;
    }
  }

  agg.updated = now;
  await store.setJSON("agg", agg);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
};

export const config = { path: "/.netlify/functions/analytics" };
