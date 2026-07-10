const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
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
