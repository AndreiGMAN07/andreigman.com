export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST" && url.pathname === "/api/watchlist") {
      const data = await request.json();
      await env.WATCHLIST.put("list", JSON.stringify(data));
      return new Response("Saved", { status: 200, headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/api/watchlist") {
      const data = await env.WATCHLIST.get("list");
      return new Response(data || "[]", {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
