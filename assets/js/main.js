const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

function closeMobileMenu() {
  if (!navMenu || !navToggle) return;
  navMenu.classList.remove("show");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");
}

function openMobileMenu() {
  if (!navMenu || !navToggle) return;
  navMenu.classList.add("show");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Close menu");
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    if (navMenu.classList.contains("show")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navMenu.classList.contains("show")) {
      e.preventDefault();
      closeMobileMenu();
      navToggle.focus();
    }
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !navMenu.classList.contains("show")) return;
    const focusable = navMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

const savedTheme = localStorage.getItem("site-theme");
if (savedTheme) {
  root.setAttribute("data-theme", savedTheme);
}

if (themeToggle) {
  const setThemeIcon = () => {
    const current = root.getAttribute("data-theme");
    themeToggle.textContent = current === "light" ? "☀️" : "🌙";
  };

  setThemeIcon();

  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("site-theme", next);
    setThemeIcon();
  });
}

const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const onScroll = () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 10);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

const REVEAL_SELECTORS = [
  ".section-head",
  ".card",
  ".hover-card",
  ".bio-cert-card",
  ".media-card:not(.media-skeleton)",
].join(", ");

let revealObserver = null;

const initScrollReveal = () => {
  const elements = document.querySelectorAll(REVEAL_SELECTORS);

  elements.forEach((el) => {
    if (!el.classList.contains("scroll-reveal")) {
      el.classList.add("scroll-reveal");
    }
  });

  const grids = document.querySelectorAll(".grid-2, .grid-3, .grid-auto-fit, .media-grid, .bio-certs");
  grids.forEach((grid) => {
    const cards = grid.querySelectorAll(".card, .hover-card, .bio-cert-card, .media-card:not(.media-skeleton)");
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 80}ms`;
    });
  });

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  }

  document.querySelectorAll(".scroll-reveal:not(.is-visible)").forEach((el) => {
    revealObserver.observe(el);
  });
};

document.addEventListener("DOMContentLoaded", initScrollReveal);
window.initScrollReveal = initScrollReveal;

const backToTop = document.getElementById("backToTop");
if (backToTop) {
  const toggleBtt = () => {
    backToTop.classList.toggle("back-to-top--visible", window.scrollY > 300);
  };
  toggleBtt();
  window.addEventListener("scroll", toggleBtt, { passive: true });
  backToTop.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const header = document.querySelector(".site-header");
  if (header && !header.querySelector(".scroll-progress")) {
    const track = document.createElement("div");
    track.className = "scroll-progress";
    const bar = document.createElement("div");
    bar.className = "scroll-progress__bar";
    track.appendChild(bar);
    header.appendChild(track);

    const updateBar = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      bar.style.width = pct + "%";
    };
    updateBar();
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar, { passive: true });
  }

  let curtain = document.querySelector(".page-transition");

  if (!curtain) {
    curtain = document.createElement("div");
    curtain.className = "page-transition";
    const loader = document.createElement("div");
    loader.className = "page-transition__loader";
    curtain.appendChild(loader);
    document.body.appendChild(curtain);
  }

  const isInternalHtml = (href) => {
    if (!href) return false;
    if (href.startsWith("http") || href.startsWith("//")) return false;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    return /\.html(\?|$|#)/.test(href) || href.endsWith("/");
  };

  let pendingNav = null;

  const clearCurtain = () => {
    curtain.classList.remove("active");
    pendingNav = null;
  };

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!isInternalHtml(href)) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(href, window.location.href);
    if (url.href === window.location.href) return;

    pendingNav = url.href;
    curtain.classList.add("active");
    e.preventDefault();

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (pendingNav) window.location.href = pendingNav;
      }, 120);
    });

    setTimeout(() => {
      if (pendingNav) window.location.href = pendingNav;
    }, 5000);
  });

  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted) clearCurtain();
  });
  window.addEventListener("load", function () {
    requestAnimationFrame(clearCurtain);
  });
  window.addEventListener("popstate", clearCurtain);
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (window.location.pathname.includes("/posts/")) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

(function () {
  const NAV_PAGES = [
    { title: "Home", href: "index.html", kind: "page", keywords: "home start landing main" },
    { title: "About", href: "about.html", kind: "page", keywords: "about me bio biography education certificates social" },
    { title: "Blog", href: "blog.html", kind: "page", keywords: "blog posts thoughts diary notes writing" },
    { title: "Resources", href: "resources.html", kind: "page", keywords: "resources notes courses files study university" },
    { title: "Media-Watched", href: "media-watched.html", kind: "page", keywords: "media watched archive anime games movies tv" },
    { title: "Functions", href: "functions.html", kind: "page", keywords: "functions tools calculator timer stopwatch" },
    { title: "Play", href: "play.html", kind: "page", keywords: "play games mini arcade" },
    { title: "Credits", href: "credits.html", kind: "page", keywords: "credits tools used about site" },
    { title: "Anime & Manga", href: "media-anime.html", kind: "media", keywords: "anime manga anilist" },
    { title: "Games", href: "media-games.html", kind: "media", keywords: "games igdb twitch coming soon" },
    { title: "Movies & TV", href: "media-movies.html", kind: "media", keywords: "movies tv tmdb films series" },
  ];

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
      postsCache = (data && data.posts)
        ? data.posts.map((p) => ({
            title: p.title,
            href: depth + (p.file || ""),
            kind: "post",
            tag: p.tag || "",
            keywords: (p.tag || "") + " " + (p.blurb || "") + " " + (p.dateDisplay || ""),
          }))
        : [];
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
        score += ti - lastIdx === 1 ? 10 : 5;
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
      .map((p) => {
        const s = fuzzyScore(query, p.title) * 2 + fuzzyScore(query, p.keywords) + fuzzyScore(query, p.title);
        return { item: p, score: s };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.item);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    box.innerHTML = results
      .map(
        (r, i) =>
          '<a href="' +
          r.href +
          '" class="search-result" data-idx="' +
          i +
          '" tabindex="0">' +
          '<span class="search-result__kind search-result__kind--' +
          r.kind +
          '">' +
          (r.tag || r.kind) +
          "</span>" +
          '<span class="search-result__title">' +
          escapeHtml(r.title) +
          "</span>" +
          "</a>"
      )
      .join("");
  }

  let activeIdx = -1;
  let overlayEl = null;
  let inputEl = null;
  let lastFocus = null;

  function getFocusable() {
    if (!overlayEl) return [];
    return Array.from(
      overlayEl.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null || el === inputEl);
  }

  function highlightActive() {
    const items = document.querySelectorAll(".search-result");
    items.forEach((el, i) => el.classList.toggle("search-result--active", i === activeIdx));
    const active = items[activeIdx];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }

  async function openSearch() {
    const depth = detectDepth();
    lastFocus = document.activeElement;
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
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function isOpen() {
    return overlayEl && overlayEl.classList.contains("search-overlay--open");
  }

  window.openSiteSearch = openSearch;

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

  function wireMobileSearch() {
    const mobileBtn = document.getElementById("navMenuSearch");
    if (mobileBtn) {
      mobileBtn.addEventListener("click", () => {
        openSearch();
        const navMenu = document.getElementById("navMenu");
        if (navMenu && navMenu.classList.contains("show")) {
          navMenu.classList.remove("show");
          const toggle = document.getElementById("navToggle");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  document.addEventListener("keydown", (e) => {
    const isTyping =
      /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) ||
      document.activeElement.isContentEditable;

    if ((e.key === "/" && !isTyping) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      e.preventDefault();
      openSearch();
      return;
    }

    if (!isOpen()) return;

    if (e.key === "Tab") {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
      return;
    }
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
      const target = activeIdx >= 0 && activeIdx < items.length ? items[activeIdx] : items[0];
      if (target) target.click();
    }
  });

  document.addEventListener("input", async (e) => {
    if (e.target && e.target.id === "searchInput") {
      activeIdx = -1;
      const depth = detectDepth();
      renderResults(e.target.value, await loadPosts(depth));
    }
  });

  function initSearch() {
    injectNavTrigger();
    wireMobileSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearch);
  } else {
    initSearch();
  }
})();