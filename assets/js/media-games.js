document.addEventListener("DOMContentLoaded", () => {
  MediaUI.initBrowsePage({
    gridId: "mediaGrid",
    searchId: "mediaSearch",
    errorId: "mediaError",
    categoryLabel: "Games",
    needsProxy: true,
    loadTrending: () => MediaAPI.searchTrendingGames(),
    search: (q) => MediaAPI.searchGames(q),
    getDetail: (item) => MediaAPI.getGameDetail(item.externalId),
  });
});
