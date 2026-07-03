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

  async filterByCategory(category) {
    const items = await this.getAll();
    if (!category || category === "all") return items;
    return items.filter((entry) => entry.category === category);
  },

  filterByStatus(items, status) {
    if (!status || status === "all") return items;
    return items.filter((entry) => entry.status === status);
  },

  isInArchive(id) {
    return this._cache.some((entry) => entry.id === id);
  },
};
