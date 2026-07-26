(function () {
  (async function () {
    const list = document.getElementById("latestPosts");
    if (!list) return;
    try {
      const res = await fetch("posts/posts.json", { cache: "no-cache" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.posts) || data.posts.length === 0) return;
      const sorted = data.posts
        .slice()
        .sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); })
        .slice(0, 3);
      list.innerHTML = sorted.map(function (p) { return PostUtils.postCardHtml(p); }).join("");
      if (typeof window.initScrollReveal === "function") {
        window.initScrollReveal();
      }
    } catch (e) {
      console.warn("Home: failed to load latest posts", e);
      PostUtils.showToast("Could not load recent posts.", true);
    }
  })();
})();