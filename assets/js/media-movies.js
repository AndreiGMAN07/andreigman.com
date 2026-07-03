document.addEventListener("DOMContentLoaded", () => {
  MediaUI.initBrowsePage({
    gridId: "mediaGrid",
    searchId: "mediaSearch",
    errorId: "mediaError",
    categoryLabel: "Movies & TV",
    needsProxy: true,
    loadTrending: () => MediaAPI.searchTrendingMovies(),
    search: (q) => MediaAPI.searchMovies(q),
    getDetail: (item) => MediaAPI.getMovieDetail(item.externalId, item.mediaType),
  });
});
