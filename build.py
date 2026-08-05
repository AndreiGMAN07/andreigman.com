#!/usr/bin/env python3
"""Build script: assembles HTML pages, blog posts, feed, and sitemap from sources."""

import datetime
import hashlib
import json
import os
import re
from typing import Any, Optional
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
PARTIALS = os.path.join(ROOT, "src", "partials")
PAGES_SRC = os.path.join(ROOT, "src", "pages")
POSTS_SRC = os.path.join(ROOT, "src", "posts")
POSTS_DATA = os.path.join(ROOT, "src", "data", "posts.json")
POSTS_OUT = os.path.join(ROOT, "posts")
POST_TEMPLATE = os.path.join(PAGES_SRC, "post-template.html")
PROJECTS_SRC = os.path.join(ROOT, "src", "projects")
PROJECTS_DATA = os.path.join(ROOT, "src", "data", "projects.json")
PROJECTS_OUT = os.path.join(ROOT, "projects")
PROJECT_TEMPLATE = os.path.join(PAGES_SRC, "project-template.html")
SITE_URL = "https://andreigman.com"

# ── File I/O ──
def read_file(p: str) -> str:
    """Read and return a file's contents as UTF-8 text."""
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def write_file(p: str, content: str) -> None:
    """Write text content to a file, creating parent directories if needed."""
    os.makedirs(os.path.dirname(p) or ROOT, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)

head_tpl = read_file(os.path.join(PARTIALS, "head.html"))
header_tpl = read_file(os.path.join(PARTIALS, "header.html"))
footer_tpl = read_file(os.path.join(PARTIALS, "footer.html"))
post_tpl = read_file(POST_TEMPLATE)
project_tpl = read_file(PROJECT_TEMPLATE) if os.path.exists(PROJECT_TEMPLATE) else ""

CSS_PATH = os.path.join(ROOT, "assets", "css", "style.css")
JS_DIR = os.path.join(ROOT, "assets", "js")
CSS_HASH = hashlib.md5(read_file(CSS_PATH).encode("utf-8")).hexdigest()[:8]


def _hash_assets(names: list[str]) -> str:
    """Return the first 8 hex chars of the MD5 hash of the given JS source files."""
    h = hashlib.md5()
    for name in names:
        path = os.path.join(JS_DIR, name)
        if os.path.exists(path):
            h.update(read_file(path).encode("utf-8"))
    return h.hexdigest()[:8]


MAIN_JS_HASH = _hash_assets(["script.js", "search.js", "blog.js", "home-posts.js", "post-utils.js"])
PROJECTS_JS_HASH = _hash_assets(["projects.js"])
RESOURCES_JS_HASH = _hash_assets(["resources.js"])
OG_IMAGE = f"{SITE_URL}/assets/images/og-card.svg"
MEDIA_JS_HASH = _hash_assets([
    "media-config.js",
    "media-api.js",
    "media-archive.js",
    "media-ui.js",
])
FUNCTIONS_SOURCES = ["timer", "math-helpers", "calculator", "calculus", "converter", "init"]
GAMES_JS_HASH = _hash_assets([
    "game-core.js",
    "game-dino.js",
    "game-snake.js",
    "game-breakout.js",
    "game-atari-breakout.js",
    "game-conway.js",
])
FUNCTIONS_JS_HASH = _hash_assets([f"functions/{s}.js" for s in FUNCTIONS_SOURCES])

# ── Nav definition ──
NAV = [
    ("index", "Home"),
    ("about", "About"),
    ("blog", "Blog"),
    ("resources", "Resources"),
    ("projects", "Projects"),
    ("media-watched", "Media-Watched"),
    ("functions", "Functions"),
    ("play", "Play"),
    ("credits", "Credits"),
]

STATIC_PAGES = [
    ("index.html", 1.0),
    ("about.html", 0.8),
    ("blog.html", 0.9),
    ("resources.html", 0.7),
    ("projects.html", 0.6),
    ("media-watched.html", 0.7),
    ("media-anime.html", 0.5),
    ("media-games.html", 0.5),
    ("media-movies.html", 0.5),
    ("functions.html", 0.6),
    ("play.html", 0.6),
    ("credits.html", 0.3),
    ("404.html", 0.1),
]


def month_display(iso: str) -> str:
    """Convert an ISO date string (YYYY-MM-DD) to 'Month YYYY' format."""
    if not iso:
        return ""
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%B %Y")


def format_date(iso: str) -> str:
    """Convert an ISO date string to 'Month DD, YYYY' format."""
    if not iso:
        return ""
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%B %d, %Y")


def tag_label(tag: str) -> str:
    """Return capitalised tag (e.g. 'diary' → 'Diary'), defaulting to 'Thoughts'."""
    if not tag:
        return "Thoughts"
    return tag[0].upper() + tag[1:]


def rss_date(iso: str) -> str:
    """Convert an ISO date string to RFC 2822 date format for RSS feeds."""
    d = datetime.date.fromisoformat(iso)
    dt = datetime.datetime(d.year, d.month, d.day, tzinfo=datetime.timezone.utc)
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")


def load_posts_data() -> list[dict[str, Any]]:
    """Load and return the posts list from src/data/posts.json."""
    if not os.path.exists(POSTS_DATA):
        return []
    with open(POSTS_DATA, "r", encoding="utf-8") as f:
        data = json.load(f)
    posts = data.get("posts", [])
    for p in posts:
        if not p.get("dateDisplay"):
            p["dateDisplay"] = month_display(p.get("date", ""))
    return posts


def build_nav(base: str, active_id: Optional[str]) -> str:
    """Generate the navigation link HTML, marking the active page."""
    lines = []
    for pid, label in NAV:
        if pid == active_id:
            lines.append(
                f'        <a href="{base}{pid}.html" class="active" aria-current="page">{label}</a>'
            )
        else:
            lines.append(f'        <a href="{base}{pid}.html">{label}</a>')
    return "\n".join(lines)


def build_head(meta: dict[str, str], base: str, extrahead: str) -> str:
    """Render the <head> HTML by filling placeholders in the head partial."""
    s = head_tpl
    for k in ("title", "description", "ogtitle", "ogdesc", "ogurl", "ogtype", "ogimage"):
        s = s.replace("{{" + k + "}}", meta.get(k, ""))
    s = s.replace("{{extrahead}}", extrahead or "")
    s = s.replace("{{base}}", base)
    s = s.replace("{{csshash}}", CSS_HASH)
    s = s.replace("{{canonical}}", meta.get("ogurl", ""))
    return s


def build_header(base: str, active_id: Optional[str]) -> str:
    """Render the site header by filling placeholders in the header partial."""
    s = header_tpl
    s = s.replace("{{navlinks}}", build_nav(base, active_id))
    s = s.replace("{{base}}", base)
    return s


def build_scripts(base: str, old_scripts: list[str]) -> str:
    """Join script tags into a block for injection at the end of <body>."""
    if not old_scripts:
        return ""
    return "\n".join("  " + s if not s.startswith("  ") else s for s in old_scripts)


def assemble_page(
    page_src: str,
    meta: dict[str, str],
    active: Optional[str],
    base: str,
    extrahead: str,
    old_scripts: list[str],
) -> str:
    """Assemble a complete HTML page from a template, head, header, footer, and scripts."""
    head = build_head(meta, base, extrahead)
    header = build_header(base, active)
    scripts = build_scripts(base, old_scripts)
    return (
        page_src.replace("{{head}}", head)
        .replace("{{header}}", header)
        .replace("{{footer}}", footer_tpl.replace("{{base}}", base))
        .replace("{{scripts}}", scripts)
        .replace("{{base}}", base)
    )


def post_body_path(slug: str) -> str:
    """Return the filesystem path to a post's HTML body file."""
    return os.path.join(POSTS_SRC, f"{slug}.html")


def read_post_body(slug: str) -> str:
    """Read a post's HTML body from src/posts/{slug}.html, returning a fallback if missing."""
    path = post_body_path(slug)
    if not os.path.exists(path):
        print(f"  ! missing body: {path}")
        return "<p>Post content not found.</p>"
    return read_file(path).strip()


def build_runtime_posts_json(posts: list[dict]) -> None:
    """Generate posts/posts.json (v1) consumed by client-side JS for blog listings."""
    runtime = {
        "version": 1,
        "posts": [],
    }
    for p in posts:
        slug = p.get("slug") or p.get("id")
        runtime["posts"].append(
            {
                "id": p.get("id", slug),
                "file": f"posts/{slug}.html",
                "title": p.get("title", ""),
                "date": p.get("date", ""),
                "dateDisplay": p.get("dateDisplay") or month_display(p.get("date", "")),
                "tag": p.get("tag", "thoughts"),
                "blurb": p.get("blurb", ""),
                "readTime": p.get("readTime", "3 min"),
            }
        )
    out_path = os.path.join(POSTS_OUT, "posts.json")
    write_file(out_path, json.dumps(runtime, indent=2) + "\n")
    print(f"  ✓ posts/posts.json ({len(runtime['posts'])} posts)")


def build_post_pages(posts: list[dict]) -> None:
    """Render each post from post-template.html into posts/{slug}.html."""
    expected: set[str] = set()
    for i, p in enumerate(posts):
        slug = p.get("slug") or p.get("id")
        expected.add(f"{slug}.html")
        body = read_post_body(slug)
        title = p.get("title", "Untitled")
        blurb = p.get("blurb", "")
        date = p.get("date", "")
        tag = p.get("tag", "thoughts")
        read_time = p.get("readTime", "3 min")

        ld = json.dumps(
            {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": title,
                "description": blurb,
                "author": {"@type": "Person", "name": "Andrei-Daniel Florea"},
                "datePublished": date,
                "url": f"{SITE_URL}/posts/{slug}.html",
            },
            indent=2,
        )

        meta = {
            "title": f"andreigman.com \u2013 {title}",
            "description": blurb,
            "ogtitle": f"andreigman.com \u2013 {title}",
            "ogdesc": blurb,
            "ogurl": f"{SITE_URL}/posts/{slug}.html",
            "ogtype": "article",
            "ogimage": OG_IMAGE,
        }
        extrahead = f"""  <script type="application/ld+json">
{ld}
  </script>"""

        page = post_tpl
        page = page.replace("{{type}}", tag_label(tag))
        page = page.replace("{{date}}", date)
        page = page.replace("{{dateDisplay}}", format_date(date))
        page = page.replace("{{readTime}}", read_time)
        page = page.replace("{{title}}", title)
        page = page.replace("{{blurb}}", blurb)
        page = page.replace("{{body}}", body)

        # Prev / Next navigation
        prev_link = ""
        next_link = ""
        if i > 0:
            prev_p = posts[i - 1]
            prev_slug = prev_p.get("slug") or prev_p.get("id")
            prev_link = (
                '<a href="' + prev_slug + '.html" class="post-nav__link post-nav__link--prev">'
                '&larr; ' + (prev_p.get("title", "")) +
                "</a>"
            )
        if i < len(posts) - 1:
            next_p = posts[i + 1]
            next_slug = next_p.get("slug") or next_p.get("id")
            next_link = (
                '<a href="' + next_slug + '.html" class="post-nav__link post-nav__link--next">'
                + (next_p.get("title", "")) + " &rarr;" +
                "</a>"
            )
        page = page.replace("{{prev}}", prev_link)
        page = page.replace("{{next}}", next_link)

        output = assemble_page(
            page,
            meta,
            "blog",
            "../",
            extrahead,
            [
                f'<script defer src="../assets/js/main.js?v={MAIN_JS_HASH}"></script>',
            ],
        )
        out_path = os.path.join(POSTS_OUT, f"{slug}.html")
        write_file(out_path, output)
        print(f"  ✓ posts/{slug}.html")

    # Remove orphaned generated post HTML files
    if os.path.isdir(POSTS_OUT):
        for name in os.listdir(POSTS_OUT):
            if not name.endswith(".html"):
                continue
            if name not in expected:
                orphan = os.path.join(POSTS_OUT, name)
                os.remove(orphan)
                print(f"  ✓ removed orphan posts/{name}")


def load_projects_data() -> list[dict]:
    """Load and return the projects list from src/data/projects.json."""
    if not os.path.exists(PROJECTS_DATA):
        return []
    with open(PROJECTS_DATA, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("projects", [])


def build_runtime_projects_json(projects: list[dict]) -> None:
    """Generate projects/projects.json consumed by client-side JS."""
    runtime: dict[str, Any] = {"version": 1, "projects": []}
    for p in projects:
        slug = p.get("slug") or p.get("id")
        entry = {
            "id": p.get("id", slug),
            "file": f"projects/{slug}.html" if os.path.exists(PROJECT_TEMPLATE) else "",
            "title": p.get("title", ""),
            "description": p.get("description", ""),
            "date": p.get("date", ""),
            "tags": p.get("tags", []),
            "image": p.get("image", ""),
            "images": p.get("images", []),
            "link": p.get("link", ""),
        }
        runtime["projects"].append(entry)
    out_path = os.path.join(PROJECTS_OUT, "projects.json")
    write_file(out_path, json.dumps(runtime, indent=2) + "\n")
    print(f"  \u2713 projects/projects.json ({len(runtime['projects'])} projects)")


def build_project_pages(projects: list[dict]) -> None:
    """Render each project from project-template.html into projects/{slug}.html."""
    if not project_tpl:
        return
    expected: set[str] = set()
    for p in projects:
        slug = p.get("slug") or p.get("id")
        expected.add(f"{slug}.html")
        title = p.get("title", "Untitled")
        desc = p.get("description", "")
        tags = p.get("tags", [])
        image = p.get("image", "")
        images = p.get("images", [])
        link = p.get("link", "")

        body_path = os.path.join(PROJECTS_SRC, f"{slug}.html")
        body = read_file(body_path) if os.path.exists(body_path) else ""

        all_images = list(images)
        if image and image not in all_images:
            all_images.insert(0, image)

        if all_images:
            imgs = "\n".join(
                f'    <img class="project-page-img img-lightbox" src="../{img}" alt="{title}" loading="lazy" />'
                for img in all_images
            )
            imgs_html = f'  <div class="project-page-images">\n{imgs}\n  </div>\n'
        else:
            imgs_html = ""

        tags_html = " ".join(
            f'<span class="project-tag">{t}</span>' for t in tags
        ) if tags else ""

        link_html = (
            f'<a href="{link}" target="_blank" rel="noopener noreferrer" '
            f'class="btn btn-primary" style="margin-top:1.5rem">View project &rarr;</a>'
        ) if link else ""

        meta = {
            "title": f"andreigman.com \u2013 {title}",
            "description": desc,
            "ogtitle": f"andreigman.com \u2013 {title}",
            "ogdesc": desc,
            "ogurl": f"{SITE_URL}/projects/{slug}.html",
            "ogtype": "website",
            "ogimage": f"{SITE_URL}/{image}" if image else OG_IMAGE,
        }

        page = project_tpl
        page = page.replace("{{title}}", title)
        page = page.replace("{{description}}", desc)
        page = page.replace("{{tags}}", tags_html)
        page = page.replace("{{images}}", imgs_html)
        page = page.replace("{{body}}", body)
        page = page.replace("{{link}}", link_html)

        output = assemble_page(
            page,
            meta,
            "projects",
            "../",
            "",
            [f'<script defer src="../assets/js/main.js?v={MAIN_JS_HASH}"></script>'],
        )
        out_path = os.path.join(PROJECTS_OUT, f"{slug}.html")
        write_file(out_path, output)
        print(f"  \u2713 projects/{slug}.html")

    if os.path.isdir(PROJECTS_OUT):
        for name in os.listdir(PROJECTS_OUT):
            if not name.endswith(".html"):
                continue
            if name not in expected:
                orphan = os.path.join(PROJECTS_OUT, name)
                os.remove(orphan)
                print(f"  \u2713 removed orphan projects/{name}")


def build_feed(posts: list[dict]) -> None:
    """Generate feed.xml (RSS 2.0 with Atom self-link) from the posts list."""
    channel = ET.Element("channel")
    ET.SubElement(channel, "title").text = "andreigman.com"
    ET.SubElement(channel, "link").text = SITE_URL
    ET.SubElement(channel, "description").text = (
        "Personal blog of Andrei — thoughts, notes, and diary entries."
    )
    ET.SubElement(channel, "language").text = "en"
    if posts:
        ET.SubElement(channel, "lastBuildDate").text = rss_date(posts[0]["date"])
    atom = ET.SubElement(
        channel,
        "{http://www.w3.org/2005/Atom}link",
        {
            "href": f"{SITE_URL}/feed.xml",
            "rel": "self",
            "type": "application/rss+xml",
        },
    )

    for p in posts:
        slug = p.get("slug") or p.get("id")
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = p.get("title", "")
        ET.SubElement(item, "link").text = f"{SITE_URL}/posts/{slug}.html"
        ET.SubElement(item, "description").text = p.get("blurb", "")
        ET.SubElement(item, "pubDate").text = rss_date(p.get("date", ""))
        ET.SubElement(item, "guid").text = f"{SITE_URL}/posts/{slug}.html"

    rss = ET.Element("rss", {"version": "2.0"})
    rss.append(channel)
    tree = ET.ElementTree(rss)
    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    ET.indent(tree, space="  ")
    out_path = os.path.join(ROOT, "feed.xml")
    tree.write(out_path, encoding="UTF-8", xml_declaration=True)
    print(f"  ✓ feed.xml ({len(posts)} items)")


def build_sitemap(posts: list[dict], projects: Optional[list[dict]] = None) -> None:
    """Generate sitemap.xml with lastmod dates for all pages, posts, and projects."""
    today = datetime.date.today().isoformat()
    urlset = ET.Element(
        "urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    )
    for page, priority in STATIC_PAGES:
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = f"{SITE_URL}/{page}"
        ET.SubElement(url, "lastmod").text = today
        ET.SubElement(url, "priority").text = str(priority)
    for p in posts:
        slug = p.get("slug") or p.get("id")
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = f"{SITE_URL}/posts/{slug}.html"
        ET.SubElement(url, "lastmod").text = p.get("date", today)
        ET.SubElement(url, "priority").text = "0.6"
    if projects:
        for p in projects:
            slug = p.get("slug") or p.get("id")
            url = ET.SubElement(urlset, "url")
            ET.SubElement(url, "loc").text = f"{SITE_URL}/projects/{slug}.html"
            ET.SubElement(url, "lastmod").text = p.get("date", today)
            ET.SubElement(url, "priority").text = "0.5"
    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ")
    out_path = os.path.join(ROOT, "sitemap.xml")
    tree.write(out_path, encoding="UTF-8", xml_declaration=True)
    print(f"  ✓ sitemap.xml")


# ── Page definitions ──
PAGES = []


def add(
    id_: str,
    src: str,
    dest: str,
    meta: dict[str, str],
    active: Optional[str] = None,
    base: str = "",
    extrahead: str = "",
    old_scripts: Optional[list[str]] = None,
    main: bool = True,
) -> None:
    """
    Register a page to be built. Prepends main.js to scripts unless main=False.
    """
    scripts: list[str] = old_scripts or []
    if main:
        scripts = [f'<script defer src="{base}assets/js/main.js?v={MAIN_JS_HASH}"></script>'] + scripts
    PAGES.append((id_, src, dest, meta, active or id_, base, extrahead, scripts))


add(
    "index",
    "index.html",
    "index.html",
    {
        "title": "andreigman.com | Home",
        "description": "Personal website of Andrei - blog, resources, and projects.",
        "ogtitle": "andreigman.com | Home",
        "ogdesc": "Personal website of Andrei - blog, resources, and projects.",
        "ogurl": f"{SITE_URL}/index.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    extrahead=f"""<script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Andrei-Daniel Florea",
    "alternateName": "andreigman",
    "url": "{SITE_URL}",
    "sameAs": [
      "https://www.instagram.com/andrei._.gman",
      "https://github.com/AndreiGMAN07",
      "https://www.youtube.com/@andreigman6747",
      "https://www.linkedin.com/in/andrei-daniel-florea-86075a355/"
    ],
    "jobTitle": "Student"
  }}
  </script>""",
    old_scripts=[f'<script defer src="assets/js/home-posts.js?v={MAIN_JS_HASH}"></script>'],
)

add(
    "about",
    "about.html",
    "about.html",
    {
        "title": "andreigman.com | About",
        "description": "Learn more about Andrei - background, interests, and why he built this website.",
        "ogtitle": "andreigman.com | About",
        "ogdesc": "Learn more about Andrei - background, interests, and why he built this website.",
        "ogurl": f"{SITE_URL}/about.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
)

add(
    "blog",
    "blog.html",
    "blog.html",
    {
        "title": "andreigman.com \u2013 Blog",
        "description": "A mix of personal reflections, ideas I'm exploring, things I'm learning, and random thoughts I don't want to lose.",
        "ogtitle": "andreigman.com \u2013 Blog",
        "ogdesc": "A mix of personal reflections, ideas I'm exploring, things I'm learning, and random thoughts I don't want to lose.",
        "ogurl": f"{SITE_URL}/blog.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    old_scripts=[f'<script defer src="assets/js/blog.js?v={MAIN_JS_HASH}"></script>'],
)

add(
    "resources",
    "resources.html",
    "resources.html",
    {
        "title": "andreigman.com | Resources",
        "description": "University notes, course materials, and helpful documents collected in one place.",
        "ogtitle": "andreigman.com | Resources",
        "ogdesc": "University notes, course materials, and helpful documents collected in one place.",
        "ogurl": f"{SITE_URL}/resources.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    old_scripts=[f'<script defer src="assets/js/resources.js?v={RESOURCES_JS_HASH}"></script>'],
)

add(
    "credits",
    "credits.html",
    "credits.html",
    {
        "title": "andreigman.com | Credits",
        "description": "Site credits and acknowledgments for andreigman.com.",
        "ogtitle": "andreigman.com | Credits",
        "ogdesc": "Site credits and acknowledgments for andreigman.com.",
        "ogurl": f"{SITE_URL}/credits.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
)

add(
    "projects",
    "projects.html",
    "projects.html",
    {
        "title": "andreigman.com | Projects",
        "description": "Personal projects and university work by Andrei.",
        "ogtitle": "andreigman.com | Projects",
        "ogdesc": "Personal projects and university work by Andrei.",
        "ogurl": f"{SITE_URL}/projects.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    old_scripts=[f'<script defer src="assets/js/projects.js?v={PROJECTS_JS_HASH}"></script>'],
)

add(
    "functions",
    "functions.html",
    "functions.html",
    {
        "title": "andreigman.com \u2014 Functions",
        "description": "Calculators, timers and more tools on andreigman.com.",
        "ogtitle": "andreigman.com \u2014 Functions",
        "ogdesc": "Calculators, timers and more tools on andreigman.com.",
        "ogurl": f"{SITE_URL}/functions.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    extrahead=f'  <link rel="stylesheet" href="assets/css/functions.css?v={CSS_HASH}" />',
    old_scripts=[f'<script defer src="assets/js/functions.js?v={FUNCTIONS_JS_HASH}"></script>'],
)

GAMES_HEAD = f'  <link rel="stylesheet" href="assets/css/games-play.css?v={CSS_HASH}" />'

add(
    "play",
    "play.html",
    "play.html",
    {
        "title": "andreigman.com \u2014 Play",
        "description": "Mini games to cure boredom \u2014 Dino Run and more.",
        "ogtitle": "andreigman.com \u2014 Play",
        "ogdesc": "Mini games to cure boredom \u2014 Dino Run and more.",
        "ogurl": f"{SITE_URL}/play.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    extrahead=GAMES_HEAD,
    old_scripts=[f'<script defer src="assets/js/games-play.js?v={GAMES_JS_HASH}"></script>'],
)

add(
    "404",
    "404.html",
    "404.html",
    {
        "title": "andreigman.com \u2013 Page Not Found",
        "description": "Page not found.",
        "ogtitle": "andreigman.com \u2013 Page Not Found",
        "ogdesc": "Page not found.",
        "ogurl": f"{SITE_URL}/404.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    active=None,
)

MEDIA_HEAD = f'  <link rel="stylesheet" href="assets/css/media.css?v={CSS_HASH}" />'

add(
    "media-watched",
    "media-watched.html",
    "media-watched.html",
    {
        "title": "andreigman.com | Media-Watched",
        "description": "Browse live anime, games, movies and TV \u2014 track what you watch in your personal archive.",
        "ogtitle": "andreigman.com | Media-Watched",
        "ogdesc": "Browse live anime, games, movies and TV \u2014 track what you watch in your personal archive.",
        "ogurl": f"{SITE_URL}/media-watched.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    extrahead=MEDIA_HEAD,
    old_scripts=[
        f'<script defer src="assets/js/media-core.js?v={MEDIA_JS_HASH}"></script>',
        f'<script defer src="assets/js/media-watched.js?v={MEDIA_JS_HASH}"></script>',
    ],
)

add(
    "media-anime",
    "media-anime.html",
    "media-anime.html",
    {
        "title": "andreigman.com | Anime & Manga",
        "description": "Live from AniList \u2014 search and add to your archive.",
        "ogtitle": "andreigman.com | Anime & Manga",
        "ogdesc": "Live from AniList \u2014 search and add to your archive.",
        "ogurl": f"{SITE_URL}/media-anime.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    active="media-watched",
    extrahead=MEDIA_HEAD,
    old_scripts=[
        f'<script defer src="assets/js/media-core.js?v={MEDIA_JS_HASH}"></script>',
        f'<script defer src="assets/js/media-anime.js?v={MEDIA_JS_HASH}"></script>',
    ],
)

add(
    "media-games",
    "media-games.html",
    "media-games.html",
    {
        "title": "andreigman.com | Games",
        "description": "Games search powered by IGDB \u2014 coming soon.",
        "ogtitle": "andreigman.com | Games",
        "ogdesc": "Games search powered by IGDB \u2014 coming soon.",
        "ogurl": f"{SITE_URL}/media-games.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    active="media-watched",
    extrahead=MEDIA_HEAD,
    old_scripts=[
        f'<script defer src="assets/js/media-core.js?v={MEDIA_JS_HASH}"></script>',
        f'<script defer src="assets/js/media-games.js?v={MEDIA_JS_HASH}"></script>',
    ],
)

add(
    "media-movies",
    "media-movies.html",
    "media-movies.html",
    {
        "title": "andreigman.com | Movies & TV",
        "description": "From TMDB \u2014 search and add to your archive.",
        "ogtitle": "andreigman.com | Movies & TV",
        "ogdesc": "From TMDB \u2014 search and add to your archive.",
        "ogurl": f"{SITE_URL}/media-movies.html",
        "ogtype": "website",
        "ogimage": OG_IMAGE,
    },
    active="media-watched",
    extrahead=MEDIA_HEAD,
    old_scripts=[
        f'<script defer src="assets/js/media-core.js?v={MEDIA_JS_HASH}"></script>',
        f'<script defer src="assets/js/media-movies.js?v={MEDIA_JS_HASH}"></script>',
    ],
)


def bundle_js() -> None:
    """Concatenate JS source files into static bundles (main.js, media-core.js, games-play.js)."""
    js_dir = os.path.join(ROOT, "assets", "js")
    bundles = {
        "main.js": ["script.js", "search.js", "post-utils.js"],
        "media-core.js": [
            "media-config.js",
            "media-api.js",
            "media-archive.js",
            "media-ui.js",
        ],
        "games-play.js": [
            "game-core.js",
            "game-dino.js",
            "game-snake.js",
            "game-breakout.js",
            "game-atari-breakout.js",
            "game-conway.js",
        ],
        "functions.js": [f"functions/{s}.js" for s in FUNCTIONS_SOURCES],
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
        write_file(out_path, combined)
        kb = len(combined) / 1024
        print(f"  ✓ {out_name} ({kb:.1f} KB, {len(sources)} files)")


def build() -> None:
    """Main build entry point: bundle JS, build blog artifacts, project artifacts, and pages."""
    print(f"CSS hash: {CSS_HASH}")
    posts = load_posts_data()
    posts.sort(key=lambda p: p.get("date", ""), reverse=True)
    projects = load_projects_data()

    bundle_js()

    print("Building blog artifacts...")
    build_runtime_posts_json(posts)
    build_post_pages(posts)
    build_feed(posts)
    build_sitemap(posts, projects)

    print("Building project artifacts...")
    build_runtime_projects_json(projects)
    build_project_pages(projects)

    print("Building pages...")
    for pid, src, dest, meta, active, base, extrahead, old_scripts in PAGES:
        src_path = os.path.join(PAGES_SRC, src)
        if not os.path.exists(src_path):
            print(f"  ! SKIP {dest} (source not found: {src_path})")
            continue
        page_src = read_file(src_path)
        output = assemble_page(page_src, meta, active, base, extrahead, old_scripts)
        dest_path = os.path.join(ROOT, dest)
        write_file(dest_path, output)
        print(f"  ✓ {dest}")

    print("Build complete!")


if __name__ == "__main__":
    build()
