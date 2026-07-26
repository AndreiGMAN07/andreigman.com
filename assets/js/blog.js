(function () {
  let postsData = [];
  let activeTag = "all";

  function sortPosts(posts) {
    const sortEl = document.getElementById("blogSort");
    const sortVal = sortEl ? sortEl.value : "date-desc";
    const sorted = posts.slice();
    switch (sortVal) {
      case "date-desc":
        sorted.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        break;
      case "date-asc":
        sorted.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        break;
      case "title-asc":
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "title-desc":
        sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        break;
    }
    return sorted;
  }

  function renderTags(posts) {
    const container = document.getElementById("blogTags");
    if (!container) return;

    const tags = Array.from(new Set(posts.map((p) => p.tag || "thoughts"))).sort();
    const sortWrap = container.querySelector(".blog-sort-wrap");

    container.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "blog-tag active";
    allBtn.dataset.tag = "all";
    allBtn.setAttribute("aria-pressed", "true");
    allBtn.textContent = "All";
    container.appendChild(allBtn);

    tags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "blog-tag";
      btn.dataset.tag = tag;
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = PostUtils.tagLabel(tag);
      container.appendChild(btn);
    });

    if (sortWrap) container.appendChild(sortWrap);

    container.querySelectorAll(".blog-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".blog-tag").forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        activeTag = btn.dataset.tag;
        filterVisibleCards();
      });
    });
  }

  function filterVisibleCards() {
    document.querySelectorAll("#blogList .card").forEach((card) => {
      card.style.display =
        activeTag === "all" || card.dataset.tag === activeTag ? "" : "none";
    });
  }

  function renderPosts() {
    const list = document.getElementById("blogList");
    if (!list || !postsData.length) return;

    const sorted = sortPosts(postsData);
    list.innerHTML = sorted.map(function (p) { return PostUtils.postCardHtml(p); }).join("");

    if (typeof window.initScrollReveal === "function") {
      window.initScrollReveal();
    }

    filterVisibleCards();

    const recentList = document.getElementById("recentPosts");
    if (recentList) {
      recentList.innerHTML = sorted
        .slice(0, 3)
        .map(function (p) { return '<li><a href="' + p.file + '">' + p.title + "</a></li>"; })
        .join("");
    }
  }

  document.getElementById("blogSort")?.addEventListener("change", renderPosts);

  (async function () {
    try {
      const res = await fetch("posts/posts.json", { cache: "no-cache" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.posts) || data.posts.length === 0) return;
      postsData = data.posts;
      renderTags(postsData);
      renderPosts();
    } catch (e) {
      console.warn("Blog: failed to load posts", e);
      PostUtils.showToast("Could not load blog posts. Check your connection.", true);
    }
  })();
})();