const IGDB_ENDPOINT = "https://api.igdb.com/v4/games";
const IGDB_FIELDS = "name,rating,cover.url,first_release_date,summary,genres.name";

// ponytail: best-effort module-level cache; isolates may refetch before expiry
let igdbTokenCache = { token: "", expiresAt: 0 };

async function getIgdbToken(env) {
  if (igdbTokenCache.token && Date.now() < igdbTokenCache.expiresAt) {
    return igdbTokenCache.token;
  }
  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", env.IGDB_CLIENT_ID);
  url.searchParams.set("client_secret", env.IGDB_CLIENT_SECRET);
  url.searchParams.set("grant_type", "client_credentials");
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error(`IGDB auth failed: ${res.status}`);
  const data = await res.json();
  igdbTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return igdbTokenCache.token;
}

async function igdbRequest(env, body) {
  const token = await getIgdbToken(env);
  const res = await fetch(IGDB_ENDPOINT, {
    method: "POST",
    headers: {
      "Client-ID": env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  return res;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Archive-Password",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/watchlist") {
        if (request.method === "POST") {
          const sent = request.headers.get("X-Archive-Password") || "";
          if (sent !== env.ARCHIVE_PASSWORD) {
            return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
          }
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
        let body;
        if (igdbPath.startsWith("games/")) {
          const id = igdbPath.replace("games/", "").replace(/[^\d]/g, "");
          if (!id) {
            return new Response(JSON.stringify({ error: "Bad request" }), {
              status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
          }
          body = `fields ${IGDB_FIELDS}; where id = ${id}; limit 1;`;
        } else if (url.searchParams.get("search")) {
          const q = url.searchParams.get("search").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
          body = `search "${q}"; fields ${IGDB_FIELDS}; limit 20;`;
        } else if (url.searchParams.get("trending")) {
          body = `fields ${IGDB_FIELDS}; where rating_count >= 10 & rating != null & cover != null; sort rating desc; limit 20;`;
        } else {
          return new Response(JSON.stringify({ error: "Bad request" }), {
            status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        const res = await igdbRequest(env, body);
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
