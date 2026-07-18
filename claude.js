// netlify/functions/claude.js
// Proxies the app's AI requests to Anthropic so your API key stays server-side.
// Set ANTHROPIC_API_KEY in Netlify: Site settings -> Environment variables.

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors() };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors(), body: "Method not allowed" };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set in Netlify environment variables" }) };
  }
  try {
    const { system, messages, max_tokens } = JSON.parse(event.body || "{}");
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: "messages required" }) };
    }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: Math.min(Number(max_tokens) || 1200, 2000),
        system: typeof system === "string" ? system : undefined,
        messages,
      }),
    });
    const body = await r.text();
    return { statusCode: r.status, headers: { ...cors(), "content-type": "application/json" }, body };
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
  }
};

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}
