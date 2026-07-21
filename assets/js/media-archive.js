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

  _getPassword() {
    let pw = sessionStorage.getItem("media-archive-pw");
    if (!pw) {
      pw = prompt("Enter archive password to save changes:");
      if (pw) sessionStorage.setItem("media-archive-pw", pw);
    }
    return pw;
  },

  async save(items) {
    this._cache = items;
    localStorage.setItem(MEDIA_CONFIG.ARCHIVE_KEY, JSON.stringify(items));
    const pw = this._getPassword();
    if (!pw) throw new Error("Password required");
    const res = await fetch(`${this.WORKER_URL}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Archive-Password": pw },
      body: JSON.stringify(items),
    });
    if (res.status === 401) {
      sessionStorage.removeItem("media-archive-pw");
      throw new Error("Wrong password");
    }
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
    const pw = this._getPassword();
    if (!pw) throw new Error("Password required");
    const res = await fetch(`${this.WORKER_URL}/api/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Archive-Password": pw },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      sessionStorage.removeItem("media-archive-pw");
      throw new Error("Wrong password");
    }
    if (!res.ok) throw new Error("Restore failed");
  },
};
