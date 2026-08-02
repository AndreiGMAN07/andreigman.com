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
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (window.location.pathname.includes("/posts/")) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ponytail: simple image lightbox via native dialog
(() => {
  const open = (img) => {
    let lb = document.querySelector("dialog.lightbox");
    if (!lb) {
      lb = document.createElement("dialog");
      lb.className = "lightbox";
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
  };
  document.addEventListener("click", (e) => {
    const img = e.target.closest("img.img-lightbox");
    if (!img) return;
    e.preventDefault();
    open(img);
  });
})();
