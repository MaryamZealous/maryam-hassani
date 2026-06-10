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
  if (!r.ok) throw new Error("acled oauth " + r.status);
  const j = await r.json();
  if (!j || !j.access_token) throw new Error("acled oauth: no access_token");
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

    // last 30 days of Gulf / Red Sea conflict + explosion events
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const countries = encodeURIComponent("Yemen:Iran:Saudi Arabia:United Arab Emirates:Oman");
    const url = `${READ_URL}?_format=json&country=${countries}` +
      `&event_date=${since}&event_date_where=%3E%3D` +
      `&event_type=${encodeURIComponent("Explosions/Remote violence:Battles")}` +
      `&fields=event_id_cnty|event_date|event_type|country&limit=2000`;

    let r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    // token might have just expired mid-flight — re-auth once and retry
    if (r.status === 401) {
      TOKEN = { access: null, refresh: null, exp: 0 };
      const fresh = await getToken(email, password);
      r = await fetch(url, { headers: { Authorization: `Bearer ${fresh}` } });
    }
    if (!r.ok) throw new Error("acled read " + r.status);

    const j = await r.json();
    const events = (j && j.data) ? j.data.length : 0;
    // map raw event volume to the dashboard's "GPS jamming events / week" proxy
    const gpsjam = Math.max(2, Math.round(events / 4));
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, events, gpsjam, since, ts: Date.now() }) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};
