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

// ── Scroll effects (header shadow, back-to-top, progress bar) ──
(function () {
  const siteHeader = document.querySelector(".site-header");
  const backToTop = document.getElementById("backToTop");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let bar = null;
  if (!reduceMotion && siteHeader && !siteHeader.querySelector(".scroll-progress")) {
    const track = document.createElement("div");
    track.className = "scroll-progress";
    bar = document.createElement("div");
    bar.className = "scroll-progress__bar";
    track.appendChild(bar);
    siteHeader.appendChild(track);
  }

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (siteHeader) siteHeader.classList.toggle("scrolled", y > 10);
    if (backToTop) backToTop.classList.toggle("back-to-top--visible", y > 300);
    if (bar) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight || 1;
      bar.style.width = Math.min(100, Math.max(0, (y / max) * 100)) + "%";
    }
  };
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => { ticking = false; onScroll(); });
  };

  onScroll();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (window.location.pathname.includes("/posts/")) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

const goBackEl = document.getElementById("goBack");
if (goBackEl) {
  goBackEl.addEventListener("click", (e) => {
    e.preventDefault();
    history.back();
  });
}

// ponytail: simple image lightbox via native dialog
(() => {
  const open = (img) => {
    let lb = document.querySelector("dialog.lightbox");
    if (!lb) {
      lb = document.createElement("dialog");
      lb.className = "lightbox";
      lb.setAttribute("aria-label", "Image preview");
      lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
      lb.addEventListener("close", () => { lb.innerHTML = ""; });
      document.body.appendChild(lb);
    }
    const copy = document.createElement("img");
    copy.src = img.currentSrc || img.src;
    copy.alt = img.alt || "";
    lb.innerHTML = "";
    lb.appendChild(copy);
    lb.showModal();
    copy.focus();
  };
  document.addEventListener("click", (e) => {
    const img = e.target.closest("img.img-lightbox");
    if (!img) return;
    e.preventDefault();
    open(img);
  });
})();
