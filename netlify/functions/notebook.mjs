// netlify/functions/notebook.mjs
// Sentence notebook shared with Maryam's teacher.
// Uses the modern Netlify Functions v2 signature + Netlify Blobs, which is
// wired up automatically for .mjs functions (same as the site's other .mjs functions).

import { getStore } from "@netlify/blobs";

const STORE = "ramsati-notebooks";

export default async (request) => {
  if (request.method === "OPTIONS") return json(204, null);
  if (request.method === "GET") {
    let ok = true, err = null;
    try { getStore(STORE); } catch (e) { ok = false; err = String(e && e.message || e); }
    return json(200, { ok: true, version: "mjs-1", blobsWorks: ok, err });
  }
  if (request.method !== "POST") return json(405, { error: "POST only" });

  let body;
  try { body = await request.json(); } catch { return json(400, { error: "Bad JSON" }); }

  let store;
  try { store = getStore(STORE); }
  catch (e) { return json(500, { error: "Storage unavailable: " + String(e && e.message || e) }); }

  const id = typeof body.id === "string" ? body.id.replace(/[^a-zA-Z0-9-]/g, "") : "";
  const key = typeof body.key === "string" ? body.key : "";

  try {
    if (body.action === "create") {
      const newId = rand(10);
      const doc = { ownerKey: rand(16), teacherKey: rand(16), title: "دفتر مريم", entries: [], updated: Date.now() };
      await store.setJSON(newId, doc);
      return json(200, { id: newId, ownerKey: doc.ownerKey, teacherKey: doc.teacherKey });
    }

    if (!id) return json(400, { error: "Missing notebook id" });
    const doc = await store.get(id, { type: "json" });
    if (!doc) return json(404, { error: "Notebook not found" });

    const role = key && key === doc.ownerKey ? "owner" : key && key === doc.teacherKey ? "teacher" : null;
    if (!role) return json(403, { error: "Wrong or missing key for this notebook" });

    if (body.action === "get") {
      return json(200, { role, title: doc.title, entries: doc.entries || [], updated: doc.updated });
    }

    if (body.action === "save") {
      if (role !== "owner") return json(403, { error: "Only the owner can edit sentences" });
      const incoming = Array.isArray(body.entries) ? body.entries.slice(0, 300) : [];
      const existing = {};
      (doc.entries || []).forEach((e) => { existing[e.id] = e; });
      doc.entries = incoming.map((e) => ({
        id: String(e.id || "").slice(0, 40),
        word: String(e.word || "").slice(0, 60),
        text: String(e.text || "").slice(0, 1200),
        updated: Number(e.updated) || Date.now(),
        teacherNote: existing[e.id] ? existing[e.id].teacherNote : undefined,
        teacherAt: existing[e.id] ? existing[e.id].teacherAt : undefined,
      }));
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return json(200, { ok: true, entries: doc.entries, updated: doc.updated });
    }

    if (body.action === "comment") {
      const entryId = String(body.entryId || "");
      const comment = String(body.comment || "").slice(0, 1200);
      const entry = (doc.entries || []).find((e) => e.id === entryId);
      if (!entry) return json(404, { error: "Sentence not found" });
      entry.teacherNote = comment;
      entry.teacherAt = Date.now();
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return json(200, { ok: true, entries: doc.entries });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(500, { error: String((e && e.message) || e) });
  }
};

function rand(n) {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

function json(status, obj) {
  return new Response(obj === null ? "" : JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS, GET",
      "access-control-allow-headers": "content-type",
    },
  });
}
