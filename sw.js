const CACHE_NAME = "andreigman-v4";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/about.html",
  "/blog.html",
  "/resources.html",
  "/projects.html",
  "/media-watched.html",
  "/media-anime.html",
  "/media-games.html",
  "/media-movies.html",
  "/functions.html",
  "/play.html",
  "/credits.html",
  "/404.html",
  "/assets/css/style.css",
  "/assets/css/functions.css",
  "/assets/css/games-play.css",
  "/assets/css/media.css",
  "/assets/js/main.js",
  "/assets/js/functions.js",
  "/assets/js/media-core.js",
  "/assets/js/games-play.js",
  "/assets/js/resources.js",
  "/assets/js/projects.js",
  "/favicon.svg",
  "/feed.xml",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isHtmlRequest(url) {
  if (url.pathname.endsWith("/posts.json")) return false;
  if (url.pathname.startsWith("/assets/")) return false;
  if (url.pathname === "/favicon.svg") return false;
  if (url.pathname === "/feed.xml" || url.pathname === "/sitemap.xml") return false;
  return (
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.pathname.endsWith("/posts.json") || url.pathname.endsWith("/projects.json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (isHtmlRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("/")))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(url.pathname).then((cached) => {
        const update = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || update;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
