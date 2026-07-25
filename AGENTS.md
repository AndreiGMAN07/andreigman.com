# AGENTS.md — andreigman.com

Guidance for AI agents working on this repository.

## Stack constraints

- Static HTML + plain CSS + vanilla JS only
- No Tailwind, React, or heavy build tooling
- Python `build.py` concatenates partials and generates blog artifacts
- Deployed on Cloudflare Pages

## Source of truth

| What | Where |
|------|-------|
| Page templates | `src/pages/*.html` |
| Shared partials | `src/partials/head.html`, `header.html`, `footer.html` |
| Post metadata | `src/data/posts.json` |
| Post body content | `src/posts/{slug}.html` (HTML fragments, not full pages) |
| Styles | `assets/css/style.css` |
| JS sources | `assets/js/*.js` (bundled into `main.js`, etc.) |

## Generated files (do not hand-edit)

- Root `*.html` pages (except during local debug — always rebuild)
- `posts/*.html` post pages
- `posts/posts.json`
- `feed.xml`, `sitemap.xml`
- `assets/js/main.js`, `media-core.js`, `games-play.js` bundles

## Common tasks

```bash
# Full rebuild
python3 build.py

# New blog post
python3 new-post.py "Title" --tag diary --blurb "Excerpt"
python3 build.py

# Delete blog post
python3 delete-post.py slug-or-title
python3 build.py
```

## Conventions

- Placeholders: `{{head}}`, `{{header}}`, `{{footer}}`, `{{scripts}}`, `{{base}}`
- Post template: `src/pages/post-template.html`
- Blog listing is JS-driven via `assets/js/blog.js` fetching `posts/posts.json`
- CSS cache bust: `{{csshash}}` in head partial, computed by build
- Header height: `--header-h` CSS variable (currently 64px)

## Do not

- Patch `blog.html` cards manually — build + JS handles listing
- Edit `posts/posts.json` directly — edit `src/data/posts.json` instead
- Embed full head/header/footer in post bodies — use the build pipeline
