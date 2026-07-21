const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("show");
    navToggle.setAttribute("aria-expanded", isOpen);
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
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

  const grids = document.querySelectorAll(".grid-2, .grid-3, .media-grid, .bio-certs");
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

/* ── Back to top ── */
const backToTop = document.getElementById("backToTop");
if (backToTop) {
  const toggleBtt = () => {
    backToTop.classList.toggle("back-to-top--visible", window.scrollY > 300);
  };
  toggleBtt();
  window.addEventListener("scroll", toggleBtt, { passive: true });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Scroll progress + page-transition curtain wipe
   All additive, scoped to their own elements. No conflicts with
   existing nav toggle / theme toggle / reveal observer.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  /* --- Grain overlay layer (injected once, sits above content visually but
       is non-interactive and very faint; respects --grain-opacity via CSS) --- */
  if (!document.querySelector("body > .phase2-grain")) {
    const grain = document.createElement("div");
    grain.className = "phase2-grain";
    grain.setAttribute("aria-hidden", "true");
    document.body.appendChild(grain);
  }

  /* --- Scroll progress indicator (inserted once into sticky header) --- */
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
      const max = (doc.scrollHeight - doc.clientHeight) || 1;
      const pct = Math.min(100, Math.max(0, (window.scrollY / max) * 100));
      bar.style.width = pct + "%";
    };
    updateBar();
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar, { passive: true });
  }

  /* --- Page-transition green curtain wipe ---
     Reads existing .page-transition + .page-transition__loader markup
     if present on the page; if absent, builds it once. Triggers on
     internal <a> clicks that navigate to a .html file in the same
     origin (not external, not hash links, not target=_blank).        */
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

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!isInternalHtml(href)) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Same URL: don't fire curtain
    const url = new URL(href, window.location.href);
    if (url.href === window.location.href) return;

    e.preventDefault();
    curtain.classList.add("active");
    setTimeout(() => { window.location.href = url.href; }, 280);
  });

  // Safety net: if bfcache restore leaves curtain visible, clear it.
  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted) curtain.classList.remove("active");
  });
  window.addEventListener("load", function () {
    // Hide curtain if a new page loaded with it stuck open
    requestAnimationFrame(() => curtain.classList.remove("active"));
  });

  // Handle back/forward navigation: close curtain immediately
  window.addEventListener("popstate", function () {
    curtain.classList.remove("active");
  });
})();
