#!/usr/bin/env python3
"""Build script: assembles HTML pages from partials + page sources."""

import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
PARTIALS = os.path.join(ROOT, "src", "partials")
PAGES_SRC = os.path.join(ROOT, "src", "pages")

# ── Read partials ──
def read_file(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

head_tpl = read_file(os.path.join(PARTIALS, "head.html"))
header_tpl = read_file(os.path.join(PARTIALS, "header.html"))
footer_tpl = read_file(os.path.join(PARTIALS, "footer.html"))

# ── Nav definition ──
NAV = [
    ("index", "Home"),
    ("about", "About"),
    ("blog", "Blog"),
    ("resources", "Resources"),
    ("media-watched", "Media-Watched"),
    ("functions", "Functions"),
    ("credits", "Credits"),
]

def build_nav(base, active_id):
    lines = []
    for pid, label in NAV:
        if pid == active_id:
            lines.append(f'        <a href="{base}{pid}.html" class="active" aria-current="page">{label}</a>')
        else:
            lines.append(f'        <a href="{base}{pid}.html">{label}</a>')
    return "\n".join(lines)

def build_head(meta, base, extrahead):
    s = head_tpl
    for k in ("title", "description", "ogtitle", "ogdesc", "ogurl", "ogtype", "ogimage"):
        v = meta.get(k, "")
        s = s.replace("{{" + k + "}}", v)
    s = s.replace("{{extrahead}}", extrahead or "")
    s = s.replace("{{base}}", base)
    return s

def build_header(base, active_id):
    s = header_tpl
    s = s.replace("{{navlinks}}", build_nav(base, active_id))
    s = s.replace("{{base}}", base)
    return s

def build_scripts(base, old_scripts):
    if not old_scripts:
        return ""
    return "\n".join("  " + s if not s.startswith("  ") else s for s in old_scripts)

# ── Page definitions ──
# Each entry: (id, src, dest, meta, active, base, extrahead, old_scripts)
PAGES = []

def add(id_, src, dest, meta, active=None, base="", extrahead="", old_scripts=None, main=True):
    """Add a page definition. If main=True, prepend main.js script."""
    scripts = old_scripts or []
    if main:
        scripts = [f'<script defer src="{base}assets/js/main.js"></script>'] + scripts
    PAGES.append((id_, src, dest, meta, active or id_, base, extrahead, scripts))

# Home
add("index", "index.html", "index.html",
    {"title": "andreigman.com | Home",
     "description": "Personal website of Andrei - blog, resources, and projects.",
     "ogtitle": "andreigman.com | Home",
     "ogdesc": "Personal website of Andrei - blog, resources, and projects.",
     "ogurl": "https://andreigman.com/index.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    extrahead='''<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Andrei-Daniel Florea",
    "alternateName": "andreigman",
    "url": "https://andreigman.com",
    "sameAs": [
      "https://www.instagram.com/andrei._.gman",
      "https://github.com/AndreiGMAN07",
      "https://www.youtube.com/@andreigman6747",
      "https://www.linkedin.com/in/andrei-daniel-florea-86075a355/"
    ],
    "jobTitle": "Student"
  }
  </script>''')

# About
add("about", "about.html", "about.html",
    {"title": "andreigman.com | About",
     "description": "Learn more about Andrei - background, interests, and why he built this website.",
     "ogtitle": "andreigman.com | About",
     "ogdesc": "Learn more about Andrei - background, interests, and why he built this website.",
     "ogurl": "https://andreigman.com/about.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"})

# Blog
BLOG_SCRIPT = '''<script>
    let postsData = [];
    let activeTag = "all";

    const tagButtons = document.querySelectorAll(".blog-tag");
    tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tagButtons.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        activeTag = btn.dataset.tag;
        document.querySelectorAll("#blogList .card").forEach((card) => {
          card.style.display =
            activeTag === "all" || card.dataset.tag === activeTag ? "" : "none";
        });
      });
    });

    function sortPosts(posts) {
      const sortVal = document.getElementById("blogSort").value;
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

    function renderPosts() {
      const list = document.getElementById("blogList");
      if (!list || !postsData.length) return;

      const sorted = sortPosts(postsData);
      const tagLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);

      list.innerHTML = sorted
        .map((p) => {
          const tag = p.tag || "thoughts";
          return (
            '<article class="card hover-card" data-tag="' +
            tag +
            '">' +
            '<p class="mini-meta">' +
            (p.dateDisplay || "") +
            " &middot; " +
            tagLabel(tag) +
            "</p>" +
            "<h3>" +
            (p.title || "(untitled)") +
            "</h3>" +
            "<p>" +
            (p.blurb || "") +
            "</p>" +
            '<a href="' +
            (p.file || "#") +
            '" class="text-link">Read post</a>' +
            "</article>"
          );
        })
        .join("");

      if (typeof window.initScrollReveal === "function") {
        window.initScrollReveal();
      }

      document.querySelectorAll("#blogList .card").forEach((card) => {
        card.style.display =
          activeTag === "all" || card.dataset.tag === activeTag ? "" : "none";
      });

      const recentList = document.getElementById("recentPosts");
      if (recentList) {
        recentList.innerHTML = sorted
          .slice(0, 3)
          .map(
            (p) => '<li><a href="' + p.file + '">' + p.title + "</a></li>"
          )
          .join("");
      }
    }

    document
      .getElementById("blogSort")
      ?.addEventListener("change", renderPosts);

    (async function () {
      try {
        const res = await fetch("posts/posts.json", { cache: "no-cache" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !Array.isArray(data.posts) || data.posts.length === 0)
          return;
        postsData = data.posts;
        renderPosts();
      } catch (e) {
      }
    })();
  </script>'''

add("blog", "blog.html", "blog.html",
    {"title": "andreigman.com \u2013 Blog",
     "description": "A mix of personal reflections, ideas I'm exploring, things I'm learning, and random thoughts I don't want to lose.",
     "ogtitle": "andreigman.com \u2013 Blog",
     "ogdesc": "A mix of personal reflections, ideas I'm exploring, things I'm learning, and random thoughts I don't want to lose.",
     "ogurl": "https://andreigman.com/blog.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    old_scripts=[BLOG_SCRIPT])

# Resources
add("resources", "resources.html", "resources.html",
    {"title": "andreigman.com | Resources",
     "description": "University notes, course materials, and helpful documents collected in one place.",
     "ogtitle": "andreigman.com | Resources",
     "ogdesc": "University notes, course materials, and helpful documents collected in one place.",
     "ogurl": "https://andreigman.com/resources.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    old_scripts=['<script defer src="assets/js/resources.js?v=5"></script>'])

# Credits
add("credits", "credits.html", "credits.html",
    {"title": "andreigman.com | Credits",
     "description": "Site credits and acknowledgments for andreigman.com.",
     "ogtitle": "andreigman.com | Credits",
     "ogdesc": "Site credits and acknowledgments for andreigman.com.",
     "ogurl": "https://andreigman.com/credits.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"})

# Functions
add("functions", "functions.html", "functions.html",
    {"title": "andreigman.com \u2014 Functions",
     "description": "Calculators, timers and more tools on andreigman.com.",
     "ogtitle": "andreigman.com \u2014 Functions",
     "ogdesc": "Calculators, timers and more tools on andreigman.com.",
     "ogurl": "https://andreigman.com/functions.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    extrahead='  <link rel="stylesheet" href="assets/css/functions.css?v=5" />',
    old_scripts=['<script defer src="assets/js/functions.js?v=5"></script>'])

# 404
add("404", "404.html", "404.html",
    {"title": "andreigman.com \u2013 Page Not Found",
     "description": "Page not found.",
     "ogtitle": "andreigman.com \u2013 Page Not Found",
     "ogdesc": "Page not found.",
     "ogurl": "https://andreigman.com/404.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    active=None)

# Media pages - share media.css extrahead
MEDIA_HEAD = '  <link rel="stylesheet" href="assets/css/media.css?v=5" />'

add("media-watched", "media-watched.html", "media-watched.html",
    {"title": "andreigman.com | Media-Watched",
     "description": "Browse live anime, games, movies and TV \u2014 track what you watch in your personal archive.",
     "ogtitle": "andreigman.com | Media-Watched",
     "ogdesc": "Browse live anime, games, movies and TV \u2014 track what you watch in your personal archive.",
     "ogurl": "https://andreigman.com/media-watched.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    extrahead=MEDIA_HEAD,
    old_scripts=[
        '<script defer src="assets/js/media-core.js"></script>',
        '<script defer src="assets/js/media-watched.js?v=5"></script>',
    ])

add("media-anime", "media-anime.html", "media-anime.html",
    {"title": "andreigman.com | Anime & Manga",
     "description": "Live from AniList \u2014 search and add to your archive.",
     "ogtitle": "andreigman.com | Anime & Manga",
     "ogdesc": "Live from AniList \u2014 search and add to your archive.",
     "ogurl": "https://andreigman.com/media-anime.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    active="media-watched",
    extrahead=MEDIA_HEAD,
    old_scripts=[
        '<script defer src="assets/js/media-core.js"></script>',
        '<script defer src="assets/js/media-anime.js?v=5"></script>',
    ])

add("media-games", "media-games.html", "media-games.html",
    {"title": "andreigman.com | Games",
     "description": "Games search powered by IGDB \u2014 coming soon.",
     "ogtitle": "andreigman.com | Games",
     "ogdesc": "Games search powered by IGDB \u2014 coming soon.",
     "ogurl": "https://andreigman.com/media-games.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    active="media-watched",
    extrahead=MEDIA_HEAD,
    old_scripts=[
        '<script defer src="assets/js/media-core.js"></script>',
        '<script defer src="assets/js/media-games.js?v=5"></script>',
    ])

add("media-movies", "media-movies.html", "media-movies.html",
    {"title": "andreigman.com | Movies & TV",
     "description": "From TMDB \u2014 search and add to your archive.",
     "ogtitle": "andreigman.com | Movies & TV",
     "ogdesc": "From TMDB \u2014 search and add to your archive.",
     "ogurl": "https://andreigman.com/media-movies.html",
     "ogtype": "website",
     "ogimage": "https://andreigman.com/favicon.svg"},
    active="media-watched",
    extrahead=MEDIA_HEAD,
    old_scripts=[
        '<script defer src="assets/js/media-core.js"></script>',
        '<script defer src="assets/js/media-movies.js?v=5"></script>',
    ])

# ── JS Bundling ──
def bundle_js():
    """Concatenate JS source files into bundles (no minifier available)."""
    js_dir = os.path.join(ROOT, "assets", "js")
    bundles = {
        "main.js": ["script.js", "search.js"],
        "media-core.js": ["media-config.js", "media-api.js", "media-archive.js", "media-ui.js"],
    }
    print("Bundling JS...")
    for out_name, sources in bundles.items():
        parts = []
        for src in sources:
            src_path = os.path.join(js_dir, src)
            if not os.path.exists(src_path):
                print(f"  ! SKIP {src} (not found)")
                continue
            parts.append(read_file(src_path))
        combined = "\n".join(parts).strip()
        out_path = os.path.join(js_dir, out_name)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(combined)
        kb = len(combined) / 1024
        print(f"  \u2713 {out_name} ({kb:.1f} KB, {len(sources)} files)")

# ── Build ──
def build():
    bundle_js()
    print("Building pages...")
    for pid, src, dest, meta, active, base, extrahead, old_scripts in PAGES:
        src_path = os.path.join(PAGES_SRC, src)
        if not os.path.exists(src_path):
            print(f"  ! SKIP {dest} (source not found: {src_path})")
            continue

        page_src = read_file(src_path)

        head = build_head(meta, base, extrahead)
        header = build_header(base, active)
        scripts = build_scripts(base, old_scripts)

        output = (page_src
                  .replace("{{head}}", head)
                  .replace("{{header}}", header)
                  .replace("{{footer}}", footer_tpl.replace("{{base}}", base))
                  .replace("{{scripts}}", scripts))

        dest_path = os.path.join(ROOT, dest)
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"  \u2713 {dest}")

    print("Build complete!")

if __name__ == "__main__":
    build()
