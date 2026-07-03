document.addEventListener("DOMContentLoaded", () => {
  MediaUI.initBrowsePage({
    gridId: "mediaGrid",
    searchId: "mediaSearch",
    errorId: "mediaError",
    categoryLabel: "Anime & Manga",
    needsProxy: false,
    loadTrending: () => MediaAPI.searchTrendingAnime(),
    search: (q) => MediaAPI.searchAnime(q),
    getDetail: (item) => MediaAPI.getAnimeDetail(item.externalId),
  });
});
