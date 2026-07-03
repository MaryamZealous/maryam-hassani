/* Netlify Function — REAL trade-route news.
   Primary source: Google News RSS (free, no key, reliable from serverless IPs).
   Fallback: GDELT DOC 2.0 (richer volume signal, but it rate-limits cloud /
   serverless egress IPs with HTTP 429, so it cannot be the sole source).

   Both are fetched SERVER-SIDE here because neither sends CORS headers — a
   browser cannot call them directly. We score how far 2-day coverage runs above
   each route's normal volume and return the latest headlines.
   Deployed at: /.netlify/functions/news
*/
const HEAD_OK = {   // cache real data at the CDN so repeat loads don't re-fetch
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
};
const HEAD_FAIL = { // NEVER cache a failure — the next page load should retry
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const UA = "Mozilla/5.0 (compatible; resilience-system/1.0; +https://maryam-hassani.netlify.app)";
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// per-route search queries (Google News query syntax; `when:2d` = last 2 days)
const QUERIES = {
  hormuz:  '"Strait of Hormuz"',
  redsea:  '"Bab-el-Mandeb" OR ("Red Sea" shipping) OR ("Houthi" shipping)',
  suez:    '"Suez Canal"',
  // partner-supply lanes — NEGATIVE-biased queries so positive coverage of the
  // same topic ("deal signed", "record output") is excluded at the source.
  qatar:   '("Qatar gas" OR "Dolphin pipeline" OR "Qatar LNG" OR "Qatar Gulf") (halt OR cut OR curtail OR dispute OR tension OR ban OR sanction OR blockade OR conflict)',
  taiwan:  '(Taiwan semiconductor OR TSMC OR "chip export" OR "Taiwan Strait") (halt OR ban OR restrict OR blockade OR tension OR "export control" OR conflict OR invasion)',
  kazakhstan: '(Kazakhstan uranium OR Kazatomprom OR "nuclear fuel export") (halt OR cut OR ban OR disrupt OR suspend OR sanction OR unrest)',
  china:   '(China "rare earth" OR gallium OR polysilicon OR "solar export" OR "export controls") (ban OR curb OR restrict OR halt OR suspend)',
  india:   '(India pharmaceutical OR "API export" OR "drug export" OR "generic drug") (ban OR halt OR restrict OR shortage OR curb OR suspend)',
  general: '"shipping disruption" OR "port closure" OR "trade route" OR "supply chain disruption"',
};
// typical 2-day adverse-article volume per lane — the "normal" baseline to beat
const BASELINE = { hormuz: 30, redsea: 35, suez: 30, general: 60, qatar: 6, taiwan: 14, kazakhstan: 4, china: 22, india: 9 };
// partner lanes are sentiment-gated; route lanes are already disruption-keyed
const PARTNER_IDS = new Set(["qatar", "taiwan", "kazakhstan", "china", "india"]);
const NEG_RE = /\b(halt|halts|halted|ban|bans|banned|curb|curbs|curtail|cut|cuts|suspend|suspends|disrupt|disrupts|disruption|shortage|sanction|sanctions|restrict|restricts|restriction|embargo|export control|force majeure|outage|strike|attack|seize|seized|tension|tensions|dispute|shutdown|stoppage|crisis|threat|threaten|escalat|blockad|shut|crackdown|standoff|conflict|war|invasion|unrest)\b/i;

/* ---- date + entity helpers ---------------------------------------------- */
function gdeltStamp(d) {            // client expects GDELT format YYYYMMDDThhmmssZ
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T`
    + `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}
function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&").trim();
}

/* ---- Google News RSS (primary) ------------------------------------------ */
function gnewsUrl(q) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:2d")}`
    + `&hl=en-US&gl=US&ceid=US:en`;
}
function parseRss(xml) {
  const items = [];
  const blocks = xml.split("<item>").slice(1);
  for (const b of blocks) {
    const grab = (tag) => {
      const m = b.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">"));
      return m ? decodeEntities(m[1]) : "";
    };
    let title = grab("title");
    const src = grab("source");
    // Google News titles are "Headline - Publisher"; trim the trailing source
    if (src && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3));
    const pub = grab("pubDate");
    items.push({
      title,
      url: grab("link"),
      domain: src,
      seendate: gdeltStamp(new Date(pub)),
    });
  }
  return items;
}
async function gnews(id) {
  const r = await fetch(gnewsUrl(QUERIES[id]), { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`gnews ${r.status}`);
  const xml = await r.text();
  if (!/<rss|<feed/i.test(xml)) throw new Error("gnews non-RSS");
  return parseRss(xml);
}

/* ---- GDELT (fallback) --------------------------------------------------- */
const GDELT_COMBINED =
  '("Strait of Hormuz" OR "Bab-el-Mandeb" OR "Red Sea shipping" OR "Suez Canal" '
  + 'OR "shipping disruption" OR "port closure" OR "trade route" OR "Houthi attack" '
  + 'OR "Qatar gas" OR "Dolphin pipeline" OR "Qatar LNG" '
  + 'OR "Taiwan Strait" OR "semiconductor export" OR "chip export" OR "TSMC" '
  + 'OR "uranium export" OR "Kazatomprom" OR "nuclear fuel" '
  + 'OR "China export controls" OR "rare earth export" OR "gallium" OR "polysilicon" '
  + 'OR "pharmaceutical export" OR "API export")';
const ROUTE_RE = {
  hormuz: /hormuz/i,
  redsea: /bab.?el.?mandeb|bab.?al.?mandab|red sea|houthi/i,
  suez:   /suez/i,
  qatar:  /qatar|dolphin pipeline/i,
  taiwan: /taiwan|tsmc|semiconductor|chip export/i,
  kazakhstan: /kazakhstan|kazatomprom|uranium|nuclear fuel/i,
  china:  /china|rare earth|gallium|germanium|polysilicon|solar (module|export|panel)/i,
  india:  /(india|indian).*(pharma|api|drug|generic)|pharmaceutical export|api export/i,
};
async function gdeltOnce() {
  const url = "https://api.gdeltproject.org/api/v2/doc/doc?query="
    + encodeURIComponent(GDELT_COMBINED)
    + "&mode=artlist&maxrecords=200&format=json&sort=datedesc&timespan=2d";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) { const e = new Error(`gdelt ${r.status}`); e.status = r.status; throw e; }
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch (e) { throw new Error("gdelt non-JSON"); }
  return Array.isArray(j.articles) ? j.articles : [];
}
async function gdeltBuckets() {
  let arts, lastErr;
  for (const ms of [0, 1800]) {           // one retry on rate-limit, inside timeout
    if (ms) await wait(ms);
    try { arts = await gdeltOnce(); break; }
    catch (e) { lastErr = e; if (e.status && e.status !== 429 && e.status !== 503) break; }
  }
  if (!arts) throw lastErr;
  const hit = { hormuz: [], redsea: [], suez: [], qatar: [], taiwan: [], kazakhstan: [], china: [], india: [] };
  for (const a of arts) {
    const hay = `${a.title || ""} ${a.url || ""} ${a.domain || ""}`;
    const neg = NEG_RE.test(hay);
    for (const id in ROUTE_RE) {
      if (!ROUTE_RE[id].test(hay)) continue;
      if (PARTNER_IDS.has(id) && !neg) continue;   // partner lanes: adverse coverage only
      hit[id].push(a);
    }
  }
  return { hormuz: hit.hormuz, redsea: hit.redsea, suez: hit.suez, qatar: hit.qatar,
    taiwan: hit.taiwan, kazakhstan: hit.kazakhstan, china: hit.china, india: hit.india, general: arts };
}

/* ---- scoring ------------------------------------------------------------ */
function summarize(id, arts) {
  const vol = arts.length;
  const base = BASELINE[id] || 40;
  const score = Math.max(0, Math.min(1, (vol / base - 1) / 2)); // 2× normal = full pressure
  const headlines = arts.slice(0, 6).map((a) => ({
    title: a.title, url: a.url, domain: a.domain, seendate: a.seendate,
  }));
  return { vol, score, headlines };
}

exports.handler = async function () {
  const ids = Object.keys(QUERIES);

  // 1) PRIMARY — Google News RSS, four routes in parallel (it tolerates this).
  //    A route that fails is vol:null ("no data"), never a fabricated 0.
  try {
    const lists = await Promise.all(ids.map((id) => gnews(id).then(
      (arts) => ({ id, arts }),
      () => ({ id, arts: null })
    )));
    const areas = {}; let okCount = 0;
    for (const { id, arts } of lists) {
      if (arts) {
        // partner lanes: keep only adverse-headline articles (sentiment gate)
        const use = PARTNER_IDS.has(id) ? arts.filter((a) => NEG_RE.test(a.title || "")) : arts;
        areas[id] = summarize(id, use); okCount++;
      }
      else areas[id] = { vol: null, score: 0, headlines: [], failed: true };
    }
    if (okCount >= 2) {
      return { statusCode: 200, headers: HEAD_OK, body: JSON.stringify({ ok: true, src: "googlenews", areas, ts: Date.now() }) };
    }
    throw new Error("googlenews thin (" + okCount + "/" + ids.length + ")");
  } catch (ePrimary) {
    // 2) FALLBACK — GDELT combined query, bucketed.
    try {
      const b = await gdeltBuckets();
      const areas = {
        hormuz: summarize("hormuz", b.hormuz),
        redsea: summarize("redsea", b.redsea),
        suez:   summarize("suez", b.suez),
        qatar:  summarize("qatar", b.qatar),
        taiwan: summarize("taiwan", b.taiwan),
        kazakhstan: summarize("kazakhstan", b.kazakhstan),
        china:  summarize("china", b.china),
        india:  summarize("india", b.india),
        general: summarize("general", b.general),
      };
      return { statusCode: 200, headers: HEAD_OK, body: JSON.stringify({ ok: true, src: "gdelt", areas, ts: Date.now() }) };
    } catch (eFallback) {
      // both sources unreachable — honest failure, not cached, client retries.
      return { statusCode: 200, headers: HEAD_FAIL, body: JSON.stringify({ ok: false, error: `googlenews:${ePrimary.message}; gdelt:${eFallback.message}` }) };
    }
  }
};
