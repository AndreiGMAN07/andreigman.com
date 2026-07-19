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
              <select id="modalStatus" class="status-select">${this.statusOptions("planning")}</select>
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
        const status = overlay.querySelector("#modalStatus").value;
        const result = await MediaArchive.add(item, status);
        if (result.added) {
          this.showToast(`Added "${item.title}" to archive`);
          addBtn.disabled = true;
          addBtn.textContent = "Already in archive";
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
    card.innerHTML = `
      ${poster}
      <div class="media-card-body">
        <div class="archive-badge-row">
          <span class="archive-badge archive-badge--${item.status}">${item.status}</span>
          ${this.gradeBadgeHtml(item.grade)}
        </div>
        <h3 class="media-card-title">${this.escapeHtml(item.title)}</h3>
        <p class="media-score">${item.category}${item.year ? ` · ${item.year}` : ""}</p>
        <div class="media-archive-actions">
          <select class="status-select archive-status-select" aria-label="Update status for ${item.title}">
            ${this.statusOptions(item.status)}
          </select>
          <input
            type="number"
            class="grade-input"
            min="1"
            max="10"
            step="0.01"
            placeholder="Rate (1–10)"
            aria-label="Personal grade for ${item.title}"
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
