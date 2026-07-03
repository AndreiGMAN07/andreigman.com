const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

let cachedToken = null;
let tokenExpiry = 0;

async function getTwitchToken(env) {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const params = new URLSearchParams({
    client_id: env.IGDB_CLIENT_ID,
    client_secret: env.IGDB_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to obtain Twitch token");

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 120) * 1000;
  return cachedToken;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/watchlist") {
        if (request.method === "POST") {
          const data = await request.json();
          await env.WATCHLIST.put("list", JSON.stringify(data));
          return new Response("Saved", { status: 200, headers: CORS_HEADERS });
        }

        if (request.method === "GET") {
          const data = await env.WATCHLIST.get("list");
          return new Response(data || "[]", {
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
          });
        }
      }

      if (url.pathname.startsWith("/api/tmdb/")) {
        const tmdbPath = url.pathname.replace("/api/tmdb/", "");
        const tmdbUrl = new URL(`https://api.themoviedb.org/3/${tmdbPath}`);
        url.searchParams.forEach((value, key) => tmdbUrl.searchParams.set(key, value));
        tmdbUrl.searchParams.set("api_key", env.TMDB_API_KEY);

        const res = await fetch(tmdbUrl.toString());
        return new Response(await res.text(), {
          status: res.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      if (url.pathname.startsWith("/api/igdb/")) {
        const igdbPath = url.pathname.replace("/api/igdb/", "");
        const token = await getTwitchToken(env);
        const body =
          request.method === "POST" ? await request.text() : "fields name; limit 1;";

        const res = await fetch(`https://api.igdb.com/v4/${igdbPath}`, {
          method: "POST",
          headers: {
            "Client-ID": env.IGDB_CLIENT_ID,
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
          body,
        });

        return new Response(await res.text(), {
          status: res.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return new Response("Not found", { status: 404, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
