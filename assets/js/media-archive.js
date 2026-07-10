const MediaArchive = {
  WORKER_URL: "https://media-proxy.andreiflorea.workers.dev",
  _cache: [],

  _adminKey() {
    return localStorage.getItem("admin_key") || "";
  },

  async getAll() {
    try {
      const res = await fetch(`${this.WORKER_URL}/api/watchlist`);
      const items = await res.json();
      this._cache = items;
      return items;
    } catch {
      return this._cache;
    }
  },

  async save(items) {
    this._cache = items;
    const res = await fetch(`${this.WORKER_URL}/api/watchlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": this._adminKey(),
      },
      body: JSON.stringify(items),
    });
    if (res.status === 401) {
      MediaUI.showToast("Not authorized to modify the watchlist");
      throw new Error("UNAUTHORIZED");
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
      case "date-added":
      default:
        return sorted.sort(
          (a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
        );
    }
  },

  isInArchive(id) {
    return this._cache.some((entry) => entry.id === id);
  },
};
