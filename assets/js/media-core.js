const MEDIA_CONFIG = {
  PROXY_BASE: "https://media-proxy.andreiflorea.workers.dev",
  ANILIST_URL: "https://graphql.anilist.co",
  TMDB_IMAGE_BASE: "https://image.tmdb.org/t/p/w342",
  ARCHIVE_KEY: "media-archive-v1",
  SEARCH_DEBOUNCE_MS: 400,
  STATUSES: ["planning", "watching", "playing", "completed", "dropped"],
};

function isProxyConfigured() {
  return (
    MEDIA_CONFIG.PROXY_BASE &&
    !MEDIA_CONFIG.PROXY_BASE.includes("YOUR_SUBDOMAIN")
  );
}

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

  normalizeRawg(game) {
    return {
      id: `games-${game.id}`,
      category: "games",
      externalId: game.id,
      title: game.name || "Untitled",
      posterUrl: game.background_image || "",
      score: game.rating ?? null,
      year: game.released ? parseInt(game.released.slice(0, 4), 10) : null,
      description: game.description_raw || game.short_description || "",
      genres: (game.genres || []).map((g) => g.name).filter(Boolean),
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
    const data = await this.proxyFetch(
      "/api/rawg/games?ordering=-rating&page_size=20"
    );
    return (data.results || []).map((g) => this.normalizeRawg(g));
  },

  async searchGames(query) {
    const data = await this.proxyFetch(
      `/api/rawg/games?search=${encodeURIComponent(query)}&page_size=20`
    );
    return (data.results || []).map((g) => this.normalizeRawg(g));
  },

  async getGameDetail(id) {
    const data = await this.proxyFetch(`/api/rawg/games/${Number(id)}`);
    return this.normalizeRawg(data);
  },
};

const MediaArchive = {
  WORKER_URL: "https://media-proxy.andreiflorea.workers.dev",
  _cache: [],

  async getAll() {
    try {
      const res = await fetch(`${this.WORKER_URL}/api/watchlist`);
      const items = await res.json();
      this._cache = items;
      localStorage.setItem(MEDIA_CONFIG.ARCHIVE_KEY, JSON.stringify(items));
      return items;
    } catch {
      const saved = localStorage.getItem(MEDIA_CONFIG.ARCHIVE_KEY);
      if (saved) {
        this._cache = JSON.parse(saved);
        return this._cache;
      }
      return this._cache;
    }
  },

  async save(items) {
    this._cache = items;
    localStorage.setItem(MEDIA_CONFIG.ARCHIVE_KEY, JSON.stringify(items));
    const res = await fetch(`${this.WORKER_URL}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(body || "Save failed");
    }
  },

  async add(item, status = "planning") {
    const items = await this.getAll();
    if (items.some((entry) => entry.id === item.id)) {
      return { added: false, reason: "duplicate" };
    }
    items.unshift({
      ...item,
      status,
      grade: null,
      addedAt: new Date().toISOString(),
    });
    await this.save(items);
    return { added: true };
  },

  async remove(id) {
    const items = await this.getAll();
    await this.save(items.filter((entry) => entry.id !== id));
  },

  async updateStatus(id, status) {
    const items = await this.getAll();
    const updated = items.map((entry) =>
      entry.id === id ? { ...entry, status } : entry
    );
    await this.save(updated);
  },

  _validateGrade(grade) {
    if (grade === null || grade === undefined || grade === "") {
      return { valid: true, value: null };
    }

    const num = Number(grade);
    if (Number.isNaN(num) || num < 1 || num > 10) {
      return { valid: false, reason: "invalid-range" };
    }

    const rounded = Math.round(num * 100) / 100;
    const decimalPart = String(grade).includes(".")
      ? String(grade).split(".")[1]
      : "";
    if (decimalPart.length > 2) {
      return { valid: false, reason: "invalid-decimals" };
    }

    return { valid: true, value: rounded };
  },

  async updateGrade(id, grade) {
    const validation = this._validateGrade(grade);
    if (!validation.valid) {
      return { saved: false, reason: validation.reason };
    }

    const items = await this.getAll();
    const updated = items.map((entry) =>
      entry.id === id ? { ...entry, grade: validation.value } : entry
    );
    await this.save(updated);
    return { saved: true, grade: validation.value };
  },

  async filterByCategory(category) {
    const items = await this.getAll();
    if (!category || category === "all") return items;
    return items.filter((entry) => entry.category === category);
  },

  filterByStatus(items, status) {
    if (!status || status === "all") return items;
    return items.filter((entry) => entry.status === status);
  },

  sortItems(items, sortBy = "date-added") {
    const sorted = [...items];

    switch (sortBy) {
      case "name-asc":
        return sorted.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" })
        );
      case "name-desc":
        return sorted.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "", undefined, { sensitivity: "base" })
        );
      case "grade-asc":
        return sorted.sort((a, b) => {
          const ga = a.grade != null ? Number(a.grade) : -Infinity;
          const gb = b.grade != null ? Number(b.grade) : -Infinity;
          return ga - gb;
        });
      case "grade-desc":
        return sorted.sort((a, b) => {
          const ga = a.grade != null ? Number(a.grade) : -Infinity;
          const gb = b.grade != null ? Number(b.grade) : -Infinity;
          return gb - ga;
        });
      case "year-asc":
        return sorted.sort((a, b) => {
          const ya = a.year != null ? Number(a.year) : Infinity;
          const yb = b.year != null ? Number(b.year) : Infinity;
          return ya - yb;
        });
      case "year-desc":
        return sorted.sort((a, b) => {
          const ya = a.year != null ? Number(a.year) : -Infinity;
          const yb = b.year != null ? Number(b.year) : -Infinity;
          return yb - ya;
        });
      case "date-added":
      default:
        return sorted.sort(
          (a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
        );
    }
  },

  filterByName(items, query) {
    if (!query || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) =>
      (item.title || "").toLowerCase().includes(q)
    );
  },

  isInArchive(id) {
    return this._cache.some((entry) => entry.id === id);
  },

  async export() {
    const items = await this.getAll();
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archive-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async restore(data) {
    if (!Array.isArray(data)) throw new Error("Invalid backup file");
    this._cache = data;
    localStorage.setItem(MEDIA_CONFIG.ARCHIVE_KEY, JSON.stringify(data));
    await fetch(`${this.WORKER_URL}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};

const MediaUI = {
  escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str ?? "";
    return d.innerHTML;
  },

  getGradeColor(grade) {
    if (grade == null || grade === "") return null;
    const g = Number(grade);
    if (Number.isNaN(g)) return null;
    if (g < 5) return "#ef4444";
    if (g < 6.5) return "#f97316";
    if (g < 8) return "#eab308";
    if (g < 9) return "#86efac";
    if (g < 9.7) return "#16a34a";
    return "#67e8f9";
  },

  gradeBadgeHtml(grade) {
    if (grade == null) return "";
    const color = this.getGradeColor(grade);
    const display = Number(grade).toFixed(2);
    return `<span class="grade-badge" style="color: ${color}">★ ${display}</span>`;
  },

  updateGradeBadge(card, grade) {
    const badgeRow = card.querySelector(".archive-badge-row");
    if (!badgeRow) return;

    const existing = badgeRow.querySelector(".grade-badge");
    if (existing) existing.remove();

    if (grade != null) {
      const color = this.getGradeColor(grade);
      const display = Number(grade).toFixed(2);
      const badge = document.createElement("span");
      badge.className = "grade-badge";
      badge.style.color = color;
      badge.textContent = `★ ${display}`;
      badgeRow.appendChild(badge);
    }
  },

  showToast(message) {
    let toast = document.getElementById("mediaToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "mediaToast";
      toast.className = "media-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
  },

  renderSkeletons(container, count = 8) {
    container.innerHTML = "";
    container.className = "media-grid";
    for (let i = 0; i < count; i++) {
      const sk = document.createElement("div");
      sk.className = "media-card media-skeleton";
      sk.innerHTML = '<div class="media-poster"></div><div class="media-skeleton-line"></div><div class="media-skeleton-line short"></div>';
      container.appendChild(sk);
    }
  },

  renderEmpty(container, message) {
    container.innerHTML = `<p class="media-empty">${message}</p>`;
    container.className = "";
  },

  renderError(container, message) {
    container.innerHTML = `<p class="media-error">${message}</p>`;
    container.className = "";
  },

  renderProxySetup(container) {
    container.innerHTML = `
      <div class="card media-setup-notice">
        <h3>API proxy not configured</h3>
        <p>Deploy the Cloudflare Worker in <code>workers/</code>, set your API keys, then update <code>PROXY_BASE</code> in <code>assets/js/media-config.js</code>.</p>
        <p>See <code>workers/README.md</code> for deploy steps.</p>
      </div>`;
    container.className = "";
  },

  formatScore(score) {
    if (score == null || Number.isNaN(score)) return "—";
    return Number(score).toFixed(1);
  },

  createMediaCard(item, onClick) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "media-card";
    card.dataset.id = item.id;
    const poster = item.posterUrl
      ? `<img class="media-poster" src="${item.posterUrl}" alt="${item.title}" loading="lazy" />`
      : `<div class="media-poster media-poster-placeholder" aria-hidden="true">No image</div>`;
    card.innerHTML = `
      ${poster}
      <div class="media-card-body">
        <h3 class="media-card-title">${this.escapeHtml(item.title)}</h3>
        <p class="media-score">${this.formatScore(item.score)}${item.year ? ` · ${item.year}` : ""}</p>
      </div>`;
    card.addEventListener("click", () => onClick(item));
    return card;
  },

  renderGrid(container, items, onClick) {
    container.innerHTML = "";
    container.className = "media-grid";
    if (!items.length) {
      this.renderEmpty(container, "No results found.");
      return;
    }
    items.forEach((item) => container.appendChild(this.createMediaCard(item, onClick)));
  },

  statusOptions(selected = "planning") {
    return MEDIA_CONFIG.STATUSES.map(
      (s) => `<option value="${s}"${s === selected ? " selected" : ""}>${s}</option>`
    ).join("");
  },

  async openModal(item, options = {}) {
    this.closeModal();
    const overlay = document.createElement("div");
    overlay.className = "media-modal-overlay";
    overlay.id = "mediaModalOverlay";
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", item.title);

    await MediaArchive.getAll();
    const inArchive = MediaArchive.isInArchive(item.id);
    const genres = (item.genres || []).join(", ") || "—";
    const poster = item.posterUrl
      ? `<img class="media-modal-poster" src="${item.posterUrl}" alt="${item.title}" />`
      : `<div class="media-poster media-poster-placeholder">No image</div>`;

    const defaultStatus = item.category === "games" ? "playing" : "planning";
    overlay.innerHTML = `
      <div class="media-modal card">
        <button type="button" class="media-modal-close" aria-label="Close">×</button>
        <div class="media-modal-grid">
          ${poster}
          <div class="media-modal-content">
            <p class="mini-meta">${options.categoryLabel || item.category}</p>
            <h2>${this.escapeHtml(item.title)}</h2>
            <p class="media-modal-meta">Score: ${this.formatScore(item.score)} · ${item.year || "—"} · ${this.escapeHtml(genres)}</p>
            <p class="media-modal-desc">${this.escapeHtml(item.description || "No description available.")}</p>
            <div class="media-modal-actions">
              <label class="media-modal-label" for="modalStatus">Status</label>
              <select id="modalStatus" class="status-select">${this.statusOptions(defaultStatus)}</select>
              <button type="button" class="btn btn-primary" id="modalAddBtn" ${inArchive ? "disabled" : ""}>
                ${inArchive ? "Already in archive" : "Add to Archive"}
              </button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const close = () => this.closeModal();
    overlay.querySelector(".media-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    const onKey = (e) => {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", onKey);
      }
    };
    document.addEventListener("keydown", onKey);

    const addBtn = overlay.querySelector("#modalAddBtn");
    if (addBtn && !inArchive) {
      addBtn.addEventListener("click", async () => {
        try {
          const status = overlay.querySelector("#modalStatus").value;
          const result = await MediaArchive.add(item, status);
          if (result.added) {
            this.showToast(`Added "${item.title}" to archive`);
            addBtn.disabled = true;
            addBtn.textContent = "Already in archive";
          }
        } catch (err) {
          this.showToast(err.message || "Failed to save");
        }
      });
    }

    overlay.querySelector(".media-modal-close").focus();
  },

  closeModal() {
    const overlay = document.getElementById("mediaModalOverlay");
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
  },

  renderArchiveCard(item) {
    const card = document.createElement("article");
    card.className = "media-card media-archive-card";
    const poster = item.posterUrl
      ? `<img class="media-poster" src="${item.posterUrl}" alt="${item.title}" loading="lazy" />`
      : `<div class="media-poster media-poster-placeholder">No image</div>`;
    const gradeValue = item.grade != null ? Number(item.grade) : "";
    const status = item.status || "planning";
    const category = item.category || "";
    const title = item.title || "Untitled";
    card.innerHTML = `
      ${poster}
      <div class="media-card-body">
        <div class="archive-badge-row">
          <span class="archive-badge archive-badge--${status}">${status}</span>
          ${this.gradeBadgeHtml(item.grade)}
        </div>
        <h3 class="media-card-title">${this.escapeHtml(title)}</h3>
        <p class="media-score">${category}${item.year ? ` · ${item.year}` : ""}</p>
        <div class="media-archive-actions">
          <select class="status-select archive-status-select" aria-label="Update status for ${title}">
            ${this.statusOptions(status)}
          </select>
          <input
            type="number"
            class="grade-input"
            min="1"
            max="10"
            step="0.01"
            placeholder="Rate (1–10)"
            aria-label="Personal grade for ${title}"
            value="${gradeValue}"
          />
          <button type="button" class="btn btn-secondary media-remove-btn">Remove</button>
        </div>
      </div>`;

    card.querySelector(".archive-status-select").addEventListener("change", async (e) => {
      await MediaArchive.updateStatus(item.id, e.target.value);
      const badge = card.querySelector(".archive-badge");
      badge.textContent = e.target.value;
      badge.className = `archive-badge archive-badge--${e.target.value}`;
      MediaUI.showToast("Status updated");
    });

    const gradeInput = card.querySelector(".grade-input");
    const saveGrade = async (e) => {
      const raw = e.target.value.trim();
      const result = await MediaArchive.updateGrade(item.id, raw === "" ? null : raw);
      if (result.saved) {
        if (result.grade != null) {
          e.target.value = result.grade;
        } else {
          e.target.value = "";
        }
        MediaUI.updateGradeBadge(card, result.grade);
        MediaUI.showToast("Grade saved");
      }
    };
    const debouncedSaveGrade = MediaUI.debounce(saveGrade, 300);
    gradeInput.addEventListener("input", debouncedSaveGrade);

    card.querySelector(".media-remove-btn").addEventListener("click", async () => {
      await MediaArchive.remove(item.id);
      card.remove();
      const grid = document.getElementById("archiveGrid");
      if (grid && !grid.children.length) {
        MediaUI.renderEmpty(grid, "Your archive is empty. Browse a category and add titles you want to track.");
      }
    });

    return card;
  },

  debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  initBrowsePage({ gridId, searchId, errorId, loadTrending, search, getDetail, categoryLabel, needsProxy }) {
    const grid = document.getElementById(gridId);
    const searchInput = document.getElementById(searchId);
    const errorEl = document.getElementById(errorId);

    const showError = (msg) => {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
      }
    };

    const clearError = () => {
      if (errorEl) errorEl.hidden = true;
    };

    const openDetail = async (item) => {
      try {
        const detail = await getDetail(item);
        MediaUI.openModal(detail, { categoryLabel });
      } catch {
        MediaUI.openModal(item, { categoryLabel });
      }
    };

    const load = async (fetchFn) => {
      clearError();
      MediaUI.renderSkeletons(grid);
      try {
        const items = await fetchFn();
        MediaUI.renderGrid(grid, items, openDetail);
        window.initScrollReveal?.();
      } catch (err) {
        if (needsProxy && (err.message === "PROXY_NOT_CONFIGURED" || !isProxyConfigured())) {
          MediaUI.renderProxySetup(grid);
        } else {
          MediaUI.renderError(grid, "Could not load results. Check your connection or API proxy.");
          showError("Could not load results. Check your connection or API proxy.");
        }
      }
    };

    load(loadTrending);

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        MediaUI.debounce(async () => {
          const q = searchInput.value.trim();
          if (!q) {
            load(loadTrending);
            return;
          }
          clearError();
          MediaUI.renderSkeletons(grid);
          try {
            const items = await search(q);
            MediaUI.renderGrid(grid, items, openDetail);
            window.initScrollReveal?.();
          } catch (err) {
            if (needsProxy && (err.message === "PROXY_NOT_CONFIGURED" || !isProxyConfigured())) {
              MediaUI.renderProxySetup(grid);
            } else {
              MediaUI.renderError(grid, "Could not load results. Check your connection or API proxy.");
              showError("Could not load results. Check your connection or API proxy.");
            }
          }
        }, MEDIA_CONFIG.SEARCH_DEBOUNCE_MS)
      );
    }
  },
};