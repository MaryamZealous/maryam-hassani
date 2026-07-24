// netlify/functions/notebook.js
// Stores Maryam's sentence notebook in Netlify Blobs so her teacher can open it
// from his own device. Two keys: ownerKey (write sentences) and teacherKey (read + comment).

const STORE = "ramsati-notebooks";

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return res(204, null);
  if (event.httpMethod !== "POST") return res(405, { error: "POST only" });

  let getStore;
  try {
    ({ getStore } = await import("@netlify/blobs"));
  } catch (e) {
    return res(500, { error: "The @netlify/blobs package isn't installed. Add package.json to the repo root and redeploy." });
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return res(400, { error: "Bad JSON" }); }

  const store = getStore(STORE);
  const id = typeof body.id === "string" ? body.id.replace(/[^a-zA-Z0-9-]/g, "") : "";
  const key = typeof body.key === "string" ? body.key : "";

  try {
    if (body.action === "create") {
      const newId = rand(10);
      const doc = {
        ownerKey: rand(16),
        teacherKey: rand(16),
        title: typeof body.title === "string" ? body.title.slice(0, 80) : "دفتر مريم",
        entries: [],
        updated: Date.now(),
      };
      await store.setJSON(newId, doc);
      return res(200, { id: newId, ownerKey: doc.ownerKey, teacherKey: doc.teacherKey });
    }

    if (!id) return res(400, { error: "Missing notebook id" });
    const doc = await store.get(id, { type: "json" });
    if (!doc) return res(404, { error: "Notebook not found" });

    const role = key && key === doc.ownerKey ? "owner" : key && key === doc.teacherKey ? "teacher" : null;
    if (!role) return res(403, { error: "Wrong or missing key for this notebook" });

    if (body.action === "get") {
      return res(200, { role, title: doc.title, entries: doc.entries || [], updated: doc.updated });
    }

    if (body.action === "save") {
      if (role !== "owner") return res(403, { error: "Only the owner can edit sentences" });
      const incoming = Array.isArray(body.entries) ? body.entries.slice(0, 300) : [];
      const existing = {};
      (doc.entries || []).forEach((e) => { existing[e.id] = e; });
      doc.entries = incoming.map((e) => ({
        id: String(e.id || "").slice(0, 40),
        word: String(e.word || "").slice(0, 60),
        text: String(e.text || "").slice(0, 1200),
        updated: Number(e.updated) || Date.now(),
        // teacher comments are never overwritten by the owner's save
        teacherNote: existing[e.id] ? existing[e.id].teacherNote : undefined,
        teacherAt: existing[e.id] ? existing[e.id].teacherAt : undefined,
      }));
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return res(200, { ok: true, entries: doc.entries, updated: doc.updated });
    }

    if (body.action === "comment") {
      const entryId = String(body.entryId || "");
      const comment = String(body.comment || "").slice(0, 1200);
      const entry = (doc.entries || []).find((e) => e.id === entryId);
      if (!entry) return res(404, { error: "Sentence not found" });
      entry.teacherNote = comment;
      entry.teacherAt = Date.now();
      doc.updated = Date.now();
      await store.setJSON(id, doc);
      return res(200, { ok: true, entries: doc.entries });
    }

    return res(400, { error: "Unknown action" });
  } catch (e) {
    return res(500, { error: String((e && e.message) || e) });
  }
};

function rand(n) {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

function res(status, obj) {
  return {
    statusCode: status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
    body: obj === null ? "" : JSON.stringify(obj),
  };
}
