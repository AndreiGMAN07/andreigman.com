/* ═══════════════════════════════════════════════════════════════
   PHASE 4 — Full-screen search overlay
   Vanilla JS, no dependencies. Fuzzy match across posts.json + pages.
   Triggered by: clicking the nav search icon, or pressing "/" or
   Ctrl/Cmd+K. Closed by Esc, clicking the backdrop, or selecting.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const NAV_PAGES = [
    { title: "Home",            href: "index.html",          kind: "page",   keywords: "home start landing main" },
    { title: "About",           href: "about.html",          kind: "page",   keywords: "about me bio biography education certificates social" },
    { title: "Blog",            href: "blog.html",           kind: "page",   keywords: "blog posts thoughts diary notes writing" },
    { title: "Resources",       href: "resources.html",      kind: "page",   keywords: "resources notes courses files study university" },
    { title: "Media-Watched",   href: "media-watched.html",  kind: "page",   keywords: "media watched archive anime games movies tv" },
    { title: "Functions",       href: "functions.html",      kind: "page",   keywords: "functions tools calculator timer stopwatch" },
    { title: "Credits",         href: "credits.html",       kind: "page",   keywords: "credits tools used about site" },
    { title: "Anime & Manga",   href: "media-anime.html",    kind: "media",  keywords: "anime manga anilist" },
    { title: "Games",           href: "media-games.html",   kind: "media",  keywords: "games igdb twitch coming soon" },
    { title: "Movies & TV",     href: "media-movies.html",  kind: "media",  keywords: "movies tv tmdb films series" }
  ];

  // Each page lists its own known posts. For posts/, the URLs are relative to root.
  const POST_HREF_ROOT = "posts/";

  // Detect if we're in a sub-directory (e.g. posts/*.html) so we can adjust hrefs
  function detectDepth() {
    const p = window.location.pathname;
    if (p.includes("/posts/")) return "../";
    return "";
  }

  function buildOverlay() {
    if (document.getElementById("searchOverlay")) return document.getElementById("searchOverlay");

    const overlay = document.createElement("div");
    overlay.id = "searchOverlay";
    overlay.className = "search-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Site search");

    overlay.innerHTML =
      '<div class="search-overlay__backdrop" data-close></div>' +
      '<div class="search-overlay__panel" role="search">' +
        '<div class="search-overlay__input-row">' +
          '<span class="search-overlay__icon" aria-hidden="true">\uD83D\uDD0D</span>' +
          '<input type="search" id="searchInput" class="search-overlay__input" ' +
                 'placeholder="Search posts and pages&hellip;" autocomplete="off" ' +
                 'autocapitalize="off" autocorrect="off" spellcheck="false" />' +
          '<button class="search-overlay__close" data-close aria-label="Close search">Esc</button>' +
        '</div>' +
        '<div id="searchResults" class="search-overlay__results" aria-live="polite"></div>' +
        '<div class="search-overlay__hint">' +
          '<kbd>/</kbd> to open &middot; <kbd>Esc</kbd> to close &middot; <kbd>\u2191\u2193</kbd> to navigate' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target.matches("[data-close]")) closeSearch();
    });
    return overlay;
  }

  let postsCache = null;
  async function loadPosts(depth) {
    if (postsCache) return postsCache;
    try {
      const res = await fetch(depth + "posts/posts.json", { cache: "no-cache" });
      if (!res.ok) return [];
      const data = await res.json();
      postsCache = (data && data.posts) ? data.posts.map(p => ({
        title: p.title,
        href: depth + (p.file || ""),
        kind: "post",
        tag: p.tag || "",
        keywords: (p.tag || "") + " " + (p.blurb || "") + " " + (p.dateDisplay || "")
      })) : [];
      return postsCache;
    } catch (e) {
      return [];
    }
  }

  function fuzzyScore(query, text) {
    if (!text) return 0;
    text = String(text).toLowerCase();
    query = String(query).toLowerCase();
    if (!query) return 0;
    if (text.indexOf(query) !== -1) return 100 - text.indexOf(query);
    let qi = 0, score = 0, lastIdx = -1;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) {
        score += (ti - lastIdx === 1) ? 10 : 5;
        lastIdx = ti;
        qi++;
      }
    }
    return qi === query.length ? score : 0;
  }

  function search(query, posts) {
    const pool = NAV_PAGES.concat(posts);
    if (!query.trim()) return [];
    return pool
      .map(p => {
        const s = fuzzyScore(query, p.title) * 2 + fuzzyScore(query, p.keywords) + fuzzyScore(query, p.title);
        return { item: p, score: s };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(r => r.item);
  }

  function renderResults(query, posts) {
    const box = document.getElementById("searchResults");
    if (!box) return;
    const results = search(query, posts);
    if (!query.trim()) {
      box.innerHTML = '<div class="search-overlay__empty">Start typing to search posts and pages.</div>';
      return;
    }
    if (results.length === 0) {
      box.innerHTML = '<div class="search-overlay__empty">No matches for "' + escapeHtml(query) + '".</div>';
      return;
    }
    box.innerHTML = results.map((r, i) =>
      '<a href="' + r.href + '" class="search-result" data-idx="' + i + '" tabindex="0">' +
        '<span class="search-result__kind search-result__kind--' + r.kind + '">' + (r.tag || r.kind) + '</span>' +
        '<span class="search-result__title">' + escapeHtml(r.title) + '</span>' +
      '</a>'
    ).join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  let activeIdx = -1;

  function highlightActive() {
    const items = document.querySelectorAll(".search-result");
    items.forEach((el, i) => el.classList.toggle("search-result--active", i === activeIdx));
    const active = items[activeIdx];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }

  let overlayEl = null;
  let inputEl = null;

  async function openSearch() {
    const depth = detectDepth();
    overlayEl = buildOverlay();
    inputEl = document.getElementById("searchInput");
    overlayEl.classList.add("search-overlay--open");
    document.body.classList.add("search-open");
    setTimeout(() => inputEl && inputEl.focus(), 50);
    renderResults("", await loadPosts(depth));
    activeIdx = -1;
  }

  function closeSearch() {
    if (!overlayEl) return;
    overlayEl.classList.remove("search-overlay--open");
    document.body.classList.remove("search-open");
    if (inputEl) inputEl.value = "";
    activeIdx = -1;
  }

  function isOpen() {
    return overlayEl && overlayEl.classList.contains("search-overlay--open");
  }

  // Inject the nav trigger button once
  function injectNavTrigger() {
    if (document.querySelector(".nav-search-btn")) return;
    const themeBtn = document.querySelector("#themeToggle");
    if (!themeBtn) return;
    const btn = document.createElement("button");
    btn.className = "nav-search-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Search");
    btn.title = "Search (/)";
    btn.textContent = "\uD83D\uDD0D";
    btn.addEventListener("click", openSearch);
    themeBtn.parentNode.insertBefore(btn, themeBtn);
  }

  // Global keyboard handling
  document.addEventListener("keydown", (e) => {
    // Open: "/" when not focused in an input/textarea, or Ctrl/Cmd+K anywhere
    const isTyping = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
                  || document.activeElement.isContentEditable;
    if ((e.key === "/" && !isTyping) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (!isOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); closeSearch(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const items = document.querySelectorAll(".search-result");
      if (!items.length) return;
      activeIdx = Math.min(items.length - 1, activeIdx + 1);
      highlightActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIdx = Math.max(-1, activeIdx - 1);
      highlightActive();
    } else if (e.key === "Enter") {
      const items = document.querySelectorAll(".search-result");
      const target = (activeIdx >= 0 && activeIdx < items.length) ? items[activeIdx] : items[0];
      if (target) target.click();
    }
  });

  // Re-render as user types
  document.addEventListener("input", async (e) => {
    if (e.target && e.target.id === "searchInput") {
      activeIdx = -1;
      const depth = detectDepth();
      renderResults(e.target.value, await loadPosts(depth));
    }
  });

  // Init: inject trigger, wire nothing else (overlay built lazily on open)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectNavTrigger);
  } else {
    injectNavTrigger();
  }
})();
