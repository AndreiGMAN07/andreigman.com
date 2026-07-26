# andreigman.com

Static personal site built with Python concatenation — no frameworks, no CSS preprocessors.

## Stack

- **Pages:** HTML partials in `src/partials/` + page sources in `src/pages/`
- **Styles:** Plain CSS in `assets/css/style.css`
- **Scripts:** Vanilla JS in `assets/js/`, bundled by `build.py`
- **Deploy:** Cloudflare Pages

## Workflow

### Build the site

```bash
python3 build.py
```

This assembles all pages, generates blog post HTML, `posts/posts.json`, `feed.xml`, and `sitemap.xml`.

### Create a post

```bash
python3 new-post.py "My Title" --tag diary --blurb "Short summary"
# paste markdown body, Ctrl+D

python3 build.py
```

Posts are stored as:
- Metadata: `src/data/posts.json` (source of truth)
- Body HTML fragment: `src/posts/{slug}.html`

### Delete a post

```bash
python3 delete-post.py my-title-or-slug
python3 build.py
```

## Directory map

| Path | Purpose |
|------|---------|
| `src/partials/` | Shared head, header, footer |
| `src/pages/` | Page templates with `{{head}}`, `{{header}}`, etc. |
| `src/data/posts.json` | Blog post metadata (source of truth) |
| `src/posts/` | Blog post body HTML fragments |
| `posts/` | Generated post pages + `posts.json` for client JS |
| `assets/css/` | Stylesheets |
| `assets/js/` | JavaScript sources and bundles |
| `build.py` | Build script |
| `new-post.py` | Create posts |
| `delete-post.py` | Remove posts |

## Notes

- Run `python3 build.py` after any change to partials, pages, posts, or CSS/JS sources.
- `posts/posts.json` is auto-generated — do not edit by hand.
- CSS cache busting uses an MD5 hash injected at build time.

## Image optimization guidelines

- Place project/article images in `assets/images/projects/` and `assets/images/posts/`
- Use modern formats: **AVIF** or **WebP** over JPEG/PNG for smaller file sizes
- Recommended max dimensions: 1920×1080 for hero images, 800×600 for thumbnails
- Keep file sizes under 200 KB for thumbnails, under 500 KB for full-size
- Use `loading="lazy"` on `<img>` tags below the fold (already applied to project galleries)
- Always include descriptive `alt` text on meaningful images; use `alt=""` (empty) for decorative images
