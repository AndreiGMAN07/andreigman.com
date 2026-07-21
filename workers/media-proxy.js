const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
          const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
          const allowed = [
            "andreigman.com", "andreiflorea.workers.dev", "andreigman07.github.io",
            "localhost", "127.0.0.1", "0.0.0.0", "::1",
          ];
          const allowedIP = /^https?:\/\/(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;
          if (!allowed.some((d) => origin.includes(d)) && !allowedIP.test(origin)) {
            return new Response(`Forbidden - origin: ${origin}`, { status: 403, headers: CORS_HEADERS });
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

      if (url.pathname.startsWith("/api/rawg/")) {
        const rawgPath = url.pathname.replace("/api/rawg/", "");
        const rawgUrl = new URL(`https://api.rawg.io/api/${rawgPath}`);
        url.searchParams.forEach((value, key) => rawgUrl.searchParams.set(key, value));

        if (!env.RAWG_API_KEY) {
          return new Response(JSON.stringify({ error: "RAWG_API_KEY not configured" }), {
            status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
        rawgUrl.searchParams.set("key", env.RAWG_API_KEY);

        const res = await fetch(rawgUrl.toString());
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
