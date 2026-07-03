const MediaAPI = {
  async anilistQuery(query, variables = {}) {
    const res = await fetch(MEDIA_CONFIG.ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error("AniList request failed");
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
    return json.data;
  },

  stripHtml(text) {
    if (!text) return "";
    const el = document.createElement("div");
    el.innerHTML = text.replace(/<br\s*\/?>/gi, "\n");
    return el.textContent.trim();
  },

  normalizeAniList(media) {
    return {
      id: `anime-${media.id}`,
      category: "anime",
      externalId: media.id,
      title:
        media.title?.english ||
        media.title?.romaji ||
        media.title?.native ||
        "Untitled",
      posterUrl: media.coverImage?.large || "",
      score: media.averageScore != null ? media.averageScore / 10 : null,
      year: media.startDate?.year || null,
      description: this.stripHtml(media.description),
      genres: media.genres || [],
      mediaType: media.type || "ANIME",
    };
  },

  normalizeTmdb(item) {
    const isMovie = item.media_type === "movie" || Boolean(item.title);
    return {
      id: `movies-${item.id}`,
      category: "movies",
      externalId: item.id,
      title: item.title || item.name || "Untitled",
      posterUrl: item.poster_path
        ? `${MEDIA_CONFIG.TMDB_IMAGE_BASE}${item.poster_path}`
        : "",
      score: item.vote_average ?? null,
      year: parseInt((item.release_date || item.first_air_date || "").slice(0, 4), 10) || null,
      description: item.overview || "",
      genres: (item.genre_ids || []).map(String),
      mediaType: item.media_type || (isMovie ? "movie" : "tv"),
    };
  },

  normalizeIgdb(game) {
    const coverUrl = game.cover?.url
      ? (game.cover.url.startsWith("//") ? `https:${game.cover.url}` : game.cover.url).replace("t_thumb", "t_cover_big")
      : "";
    const year = game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : null;
    return {
      id: `games-${game.id}`,
      category: "games",
      externalId: game.id,
      title: game.name || "Untitled",
      posterUrl: coverUrl,
      score: game.aggregated_rating != null ? game.aggregated_rating / 10 : null,
      year,
      description: game.summary || "",
      genres: (game.genres || []).map((g) => (typeof g === "object" ? g.name : g)).filter(Boolean),
      mediaType: "game",
    };
  },

  async searchTrendingAnime() {
    const data = await this.anilistQuery(`
      query {
        Page(page: 1, perPage: 20) {
          media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
            id
            type
            title { romaji english native }
            coverImage { large }
            averageScore
            startDate { year }
            description
            genres
          }
        }
      }
    `);
    return data.Page.media.map((m) => this.normalizeAniList(m));
  },

  async searchAnime(query) {
    const data = await this.anilistQuery(
      `
      query ($search: String) {
        Page(page: 1, perPage: 20) {
          media(search: $search, sort: SEARCH_MATCH, isAdult: false) {
            id
            type
            title { romaji english native }
            coverImage { large }
            averageScore
            startDate { year }
            description
            genres
          }
        }
      }
    `,
      { search: query }
    );
    return data.Page.media.map((m) => this.normalizeAniList(m));
  },

  async getAnimeDetail(id) {
    const data = await this.anilistQuery(
      `
      query ($id: Int) {
        Media(id: $id) {
          id
          type
          title { romaji english native }
          coverImage { large extraLarge }
          averageScore
          startDate { year }
          description
          genres
        }
      }
    `,
      { id: Number(id) }
    );
    const item = this.normalizeAniList(data.Media);
    if (data.Media.coverImage?.extraLarge) {
      item.posterUrl = data.Media.coverImage.extraLarge;
    }
    return item;
  },

  async proxyFetch(path, options = {}) {
    if (!isProxyConfigured()) {
      throw new Error("PROXY_NOT_CONFIGURED");
    }
    const url = `${MEDIA_CONFIG.PROXY_BASE}${path}`;
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
    return res.json();
  },

  async searchTrendingMovies() {
    const data = await this.proxyFetch("/api/tmdb/trending/all/week");
    return (data.results || [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => this.normalizeTmdb(item));
  },

  async searchMovies(query) {
    const data = await this.proxyFetch(
      `/api/tmdb/search/multi?query=${encodeURIComponent(query)}`
    );
    return (data.results || [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => this.normalizeTmdb(item));
  },

  async getMovieDetail(id, mediaType) {
    const endpoint = mediaType === "tv" ? "tv" : "movie";
    const data = await this.proxyFetch(`/api/tmdb/${endpoint}/${id}`);
    const normalized = this.normalizeTmdb({ ...data, media_type: endpoint });
    normalized.genres = (data.genres || []).map((g) => g.name);
    return normalized;
  },

  async searchTrendingGames() {
    const body =
      "fields name,cover.url,aggregated_rating,first_release_date,summary,genres.name; where aggregated_rating != null; sort aggregated_rating desc; limit 20;";
    const data = await this.proxyFetch("/api/igdb/games", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    return (Array.isArray(data) ? data : []).map((g) => this.normalizeIgdb(g));
  },

  async searchGames(query) {
    const body = `search "${query.replace(/"/g, "")}"; fields name,cover.url,aggregated_rating,first_release_date,summary,genres.name; limit 20;`;
    const data = await this.proxyFetch("/api/igdb/games", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    return (Array.isArray(data) ? data : []).map((g) => this.normalizeIgdb(g));
  },

  async getGameDetail(id) {
    const body = `fields name,cover.url,aggregated_rating,first_release_date,summary,genres.name; where id = ${Number(id)};`;
    const data = await this.proxyFetch("/api/igdb/games", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    if (!data.length) throw new Error("Game not found");
    return this.normalizeIgdb(data[0]);
  },
};
