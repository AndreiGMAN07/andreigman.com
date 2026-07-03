const MediaArchive = {
  getAll() {
    try {
      const raw = localStorage.getItem(MEDIA_CONFIG.ARCHIVE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save(items) {
    localStorage.setItem(MEDIA_CONFIG.ARCHIVE_KEY, JSON.stringify(items));
  },

  add(item, status = "planning") {
    const items = this.getAll();
    if (items.some((entry) => entry.id === item.id)) {
      return { added: false, reason: "duplicate" };
    }
    items.unshift({
      ...item,
      status,
      addedAt: new Date().toISOString(),
    });
    this.save(items);
    return { added: true };
  },

  remove(id) {
    this.save(this.getAll().filter((entry) => entry.id !== id));
  },

  updateStatus(id, status) {
    const items = this.getAll().map((entry) =>
      entry.id === id ? { ...entry, status } : entry
    );
    this.save(items);
  },

  filterByCategory(category) {
    if (!category || category === "all") return this.getAll();
    return this.getAll().filter((entry) => entry.category === category);
  },

  filterByStatus(items, status) {
    if (!status || status === "all") return items;
    return items.filter((entry) => entry.status === status);
  },

  isInArchive(id) {
    return this.getAll().some((entry) => entry.id === id);
  },
};
