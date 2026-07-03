# Media API Proxy

1. Install Wrangler: `npm install -g wrangler`
2. Copy `.env.example` to `.env` and fill in your keys
3. Run `wrangler secret put TMDB_API_KEY` (and IGDB_CLIENT_ID, IGDB_CLIENT_SECRET)
4. Deploy: `wrangler deploy workers/media-proxy.js --name media-proxy`
5. Set the worker URL in `assets/js/media-config.js` → `PROXY_BASE`
