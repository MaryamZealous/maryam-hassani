// netlify/functions/notebook.mjs
// Sentence notebook shared with Maryam's teacher.
//
// RACE-PROOF DESIGN:
//   - Sentences (text/word) live in doc.entries — only the OWNER writes these (action "save").
//   - Teacher corrections live in doc.notes, a separate map keyed by entry id — only the
//     TEACHER writes these (action "comment"). The owner's save NEVER touches doc.notes.
//   - Grammar lessons live in doc.lessons — only the TEACHER writes these.
// Because the student's save and the teacher's comment write to DIFFERENT keys, neither can
// ever overwrite the other, no matter the timing or which device saves last.
// On "get" the server merges doc.notes onto the entries so the app sees teacherNote/teacherAt.

import { getStore } from "@netlify/blobs";

const STORE = "ramsati-notebooks";

export default async (request) => {
  if (request.method === "OPTIONS") return json(204, null);
  if (request.method === "GET") {
    let ok = true, err = null;
    try { getStore(STORE); } catch (e) { ok = false; err = String(e && e.message || e); }
    return json(200, { ok: true, version: "mjs-notes-1", blobsWorks: ok, err });
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
      const doc = { ownerKey: rand(16), teacherKey: rand(16), title: "دفتر مريم", entries: [], notes: {}, lessons: [], updated: Date.now() };
      await store.setJSON(newId, doc);
      return json(200, { id: newId, ownerKey: doc.ownerKey, teacherKey: doc.teacherKey });
    }

    if (!id) return json(400, { error: "Missing notebook id" });
    const doc = await store.get(id, { type: "json" });
    if (!doc) return json(404, { error: "Notebook not found" });
    if (!doc.notes) doc.notes = migrateNotes(doc); // one-time lift of old inline notes

    const role = key && key === doc.ownerKey ? "owner" : key && key === doc.teacherKey ? "teacher" : null;
    if (!role) return json(403, { error: "Wrong or missing key for this notebook" });

    if (body.action === "get") {
      return json(200, { role, title: doc.title, entries: merge(doc), lessons: doc.lessons || [], updated: doc.updated });
    }

    if (body.action === "save") {
      if (role !== "owner") return json(403, { error: "Only the owner can edit sentences" });
      const incoming = Array.isArray(body.entries) ? body.entries.slice(0, 300) : [];
      // store ONLY sentence fields — corrections are never read from or written by the client
      doc.entries = incoming.map((e) => ({
        id: String(e.id || "").slice(0, 40),
        word: String(e.word || "").slice(0, 60),
        text: String(e.text || "").slice(0, 1200),
        updated: Number(e.updated) || Date.now(),
      }));
      // drop orphaned notes whose sentence was deleted
      const liveIds = new Set(doc.entries.map((e) => e.id));
      for (const nid of Object.keys(doc.notes)) if (!liveIds.has(nid)) delete doc.notes[nid];
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return json(200, { ok: true, entries: merge(doc), updated: doc.updated });
    }

    if (body.action === "comment") {
      if (role !== "teacher") return json(403, { error: "Only the teacher can correct" });
      const entryId = String(body.entryId || "");
      const comment = String(body.comment || "").slice(0, 1200);
      if (!(doc.entries || []).some((e) => e.id === entryId)) return json(404, { error: "Sentence not found" });
      doc.notes[entryId] = { note: comment, at: Date.now() };
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return json(200, { ok: true, entries: merge(doc) });
    }

    if (body.action === "addLesson") {
      if (role !== "teacher") return json(403, { error: "Only the teacher can add lessons" });
      const lesson = { id: "L" + rand(8), title: String(body.title || "").slice(0, 120) || "درس", md: String(body.md || "").slice(0, 8000), at: Date.now() };
      doc.lessons = [lesson, ...(doc.lessons || [])].slice(0, 100);
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return json(200, { ok: true, lessons: doc.lessons });
    }

    if (body.action === "deleteLesson") {
      if (role !== "teacher") return json(403, { error: "Only the teacher can delete lessons" });
      doc.lessons = (doc.lessons || []).filter((l) => l.id !== String(body.lessonId || ""));
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return json(200, { ok: true, lessons: doc.lessons });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(500, { error: String((e && e.message) || e) });
  }
};

// merge notes map onto entries for the client
function merge(doc) {
  const notes = doc.notes || {};
  return (doc.entries || []).map((e) => {
    const n = notes[e.id];
    return n ? { ...e, teacherNote: n.note, teacherAt: n.at } : e;
  });
}

// lift any corrections that were stored inline on old entries into the new notes map (run once)
function migrateNotes(doc) {
  const notes = {};
  (doc.entries || []).forEach((e) => {
    if (e.teacherNote) notes[e.id] = { note: e.teacherNote, at: e.teacherAt || Date.now() };
  });
  return notes;
}

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
