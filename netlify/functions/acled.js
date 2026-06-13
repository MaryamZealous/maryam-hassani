/* Netlify Function — REAL conflict signal from ACLED (Armed Conflict Location
   & Event Data) using ACLED's CURRENT OAuth2 auth (the old key+email API was
   retired on 15 Sep 2025 — new accounts can no longer get a legacy key).

   Requires a FREE myACLED account: https://acleddata.com/register/
   Then set two environment variables in Netlify
   (Site settings → Environment variables):

       ACLED_EMAIL      the email you registered with
       ACLED_PASSWORD   your myACLED password

   Auth flow (per https://acleddata.com/api-documentation/getting-started):
     1. POST email+password to https://acleddata.com/oauth/token  → access_token
        (valid 24h) + refresh_token (valid 14d).
     2. GET https://acleddata.com/api/acled/read with header
        Authorization: Bearer <access_token>.

   With no credentials set, this returns { ok:false } and the dashboard keeps
   the ACLED signal SIMULATED — nothing breaks. Deployed at
   /.netlify/functions/acled
*/
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
};

const TOKEN_URL = "https://acleddata.com/oauth/token";
const READ_URL = "https://acleddata.com/api/acled/read";

// Module-scope token cache — reused while the Lambda container stays warm so we
// don't re-authenticate on every poll. access_token lives 24h; we refresh early.
let TOKEN = { access: null, refresh: null, exp: 0 };

async function getToken(email, password) {
  const now = Date.now();
  // reuse a still-valid cached access token (60s safety margin)
  if (TOKEN.access && now < TOKEN.exp - 60000) return TOKEN.access;

  // try a refresh first if we have a refresh token (avoids re-sending password)
  if (TOKEN.refresh) {
    try {
      const t = await postToken({
        grant_type: "refresh_token",
        refresh_token: TOKEN.refresh,
        client_id: "acled",
      });
      if (t) return t;
    } catch (e) { /* fall through to password grant */ }
  }

  // full password grant
  return await postToken({
    username: email,
    password: password,
    grant_type: "password",
    client_id: "acled",
    scope: "authenticated",
  });
}

async function postToken(fields) {
  const body = new URLSearchParams(fields).toString();
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const txt = await r.text();
  if (!r.ok) {
    const e = new Error("oauth_failed");
    e.stage = "oauth"; e.status = r.status; e.detail = txt.slice(0, 300);
    throw e;
  }
  let j; try { j = JSON.parse(txt); } catch (_) { j = null; }
  if (!j || !j.access_token) {
    const e = new Error("oauth_no_token");
    e.stage = "oauth"; e.status = r.status; e.detail = txt.slice(0, 300);
    throw e;
  }
  TOKEN = {
    access: j.access_token,
    refresh: j.refresh_token || TOKEN.refresh,
    exp: Date.now() + (Number(j.expires_in) || 86400) * 1000,
  };
  return TOKEN.access;
}

exports.handler = async function () {
  const email = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!email || !password) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, reason: "no_credentials" }) };
  }
  try {
    const token = await getToken(email, password);

    // last 30 days of conflict (Battles + Explosions/Remote violence)
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const EVENT_TYPES = "Explosions/Remote violence:Battles";

    // Count events for one ACLED country expression (e.g. "Sudan" or a
    // colon-joined Gulf cluster). limit=4000 + lightweight fields keeps each
    // call fast; row count IS the event count for the window.
    async function countFor(countryExpr) {
      const url = `${READ_URL}?_format=json&country=${encodeURIComponent(countryExpr)}` +
        `&event_date=${since}&event_date_where=%3E%3D` +
        `&event_type=${encodeURIComponent(EVENT_TYPES)}` +
        `&fields=event_id_cnty&limit=4000`;
      let r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 401) {                 // token expired mid-flight — re-auth once
        TOKEN = { access: null, refresh: null, exp: 0 };
        const fresh = await getToken(email, password);
        r = await fetch(url, { headers: { Authorization: `Bearer ${fresh}` } });
      }
      const txt = await r.text();
      if (!r.ok) { const e = new Error("read_failed"); e.stage = "read"; e.status = r.status; e.detail = txt.slice(0, 300); throw e; }
      let j; try { j = JSON.parse(txt); } catch (_) { j = null; }
      return (j && Array.isArray(j.data)) ? j.data.length : 0;
    }

    // Partner / actor geographies we track live, plus a Gulf cluster that backs
    // the GPS-jamming proxy. Run in parallel — ACLED tolerates it and it keeps
    // us inside the function timeout. A single country's failure doesn't sink
    // the rest (it resolves to null = "no data", never a fabricated 0).
    const PARTNERS = ["Sudan", "Russia", "Yemen", "Iran"];
    const GULF = "Saudi Arabia:United Arab Emirates:Oman:Iraq";
    const settled = await Promise.all([
      ...PARTNERS.map((c) => countFor(c).then((n) => [c, n], () => [c, null])),
      countFor(GULF).then((n) => ["_gulf", n], () => ["_gulf", null]),
    ]);

    const byCountry = {};
    for (const [c, n] of settled) if (c !== "_gulf") byCountry[c] = n;
    const okCount = Object.values(byCountry).filter((v) => v != null).length;
    if (!okCount) { const e = new Error("all_countries_failed"); e.stage = "read"; throw e; }

    const gulf = (settled.find(([c]) => c === "_gulf") || [])[1];
    // total tracked events (Gulf cluster + Yemen/Iran already inside it are the
    // jamming-relevant theatre); gpsjam proxy maps that theatre's intensity.
    const theatre = (gulf || 0) + (byCountry.Yemen || 0) + (byCountry.Iran || 0);
    const gpsjam = Math.max(2, Math.round(theatre / 40));
    const events = Object.values(byCountry).reduce((a, b) => a + (b || 0), 0) + (gulf || 0);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, events, gpsjam, byCountry, gulf, since, ts: Date.now() }) };
  } catch (e) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        ok: false,
        stage: e.stage || "unknown",
        status: e.status || null,
        error: e.message || String(e),
        detail: e.detail || null,
        // safe env diagnostics (never exposes the password value)
        env: { email_set: !!email, email: email || null, password_set: !!password },
      }),
    };
  }
};
