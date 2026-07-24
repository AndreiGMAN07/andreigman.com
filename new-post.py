#!/usr/bin/env python3
"""
new-post.py — create a blog post and update blog.html + posts.json
Usage:
  python3 new-post.py "My Title" --tag diary --blurb "Short summary"
Then type/paste the body markdown, press Ctrl+D when done.

Or pipe the body:
  echo "**hello**" | python3 new-post.py "My Title" --tag tech --blurb "hello world"
"""

import sys, os, re, json, datetime, textwrap

BASE = os.path.dirname(os.path.abspath(__file__))
POSTS_DIR = os.path.join(BASE, "posts")
BLOG_FILE = os.path.join(BASE, "blog.html")
FEED_FILE = os.path.join(POSTS_DIR, "posts.json")

def slugify(s):
    s = s.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

def md_to_html(src):
    if not src: return ""
    h = src
    h = h.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    h = re.sub(r'```(\w*)\n?([\s\S]*?)```', r'<pre><code class="language-\1">\2</code></pre>', h)
    h = re.sub(r'`([^`]+)`', r'<code>\1</code>', h)
    for i in range(6,0,-1):
        h = re.sub(r'^#{' + str(i) + r'}\s+(.*$)', f'<h{i}>\\1</h{i}>', h, flags=re.MULTILINE)
    h = re.sub(r'^---\s*$', '<hr>', h, flags=re.MULTILINE)
    h = re.sub(r'^> (.*$)', r'<blockquote><p>\1</p></blockquote>', h, flags=re.MULTILINE)
    h = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', h)
    h = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', h)
    h = re.sub(r'\*(.+?)\*', r'<em>\1</em>', h)
    h = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1">', h)
    h = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', h)
    h = re.sub(r'^- (.*$)', r'<li>\1</li>', h, flags=re.MULTILINE)
    h = re.sub(r'^\d+\. (.*$)', r'<li>\1</li>', h, flags=re.MULTILINE)

    lines, out, in_ul, in_bq = h.split('\n'), [], False, False
    for line in lines:
        t = line.strip()
        is_li = t.startswith('<li>')
        is_bq = t.startswith('<blockquote>')
        is_hr = t == '<hr>' or t == '<hr/>'
        is_hd = t.startswith('<h') and t[2].isdigit()
        is_pre = t.startswith('<pre>')
        if is_pre:
            if in_ul: out.append('</ul>'); in_ul = False
            if in_bq: out.append('</blockquote>'); in_bq = False
            out.append(line); continue
        if is_li:
            if in_bq: out.append('</blockquote>'); in_bq = False
            if not in_ul: out.append('<ul>'); in_ul = True
            out.append(line); continue
        if in_ul and not is_li: out.append('</ul>'); in_ul = False
        if is_bq:
            if in_ul: out.append('</ul>'); in_ul = False
            if not in_bq: in_bq = True
            out.append(line); continue
        if in_bq and not is_bq: out.append('</blockquote>'); in_bq = False
        if is_hd or is_hr or t == '': out.append(line); continue
        if not is_li and not is_bq and not is_hd and not is_hr and not is_pre and t:
            out.append(f'<p>{line}</p>')
        else: out.append(line)
    if in_ul: out.append('</ul>')
    if in_bq: out.append('</blockquote>')
    return '\n'.join(out)

def esc(s):
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')

def tag_label(t):
    return t[0].upper() + t[1:]

def month_display(iso):
    if not iso: return ""
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%B %Y")

def format_date(iso):
    if not iso: return ""
    d = datetime.date.fromisoformat(iso)
    return d.strftime("%B %d, %Y")

def generate_post_html(title, slug, date, tag, blurb, body_html):
    t_label = tag_label(tag)
    d_fmt = format_date(date)
    ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": blurb,
        "author": {"@type": "Person", "name": "Andrei-Daniel Florea"},
        "datePublished": date,
        "url": f"https://andreigman.com/posts/{slug}.html"
    }, indent=2)

    page = f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>andreigman.com \u2013 {esc(title)}</title>
  <meta name="description" content="{esc(blurb)}" />
  <meta property="og:title" content="andreigman.com \u2013 {esc(title)}" />
  <meta property="og:description" content="{esc(blurb)}" />
  <meta property="og:url" content="https://andreigman.com/posts/{slug}.html" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="https://andreigman.com/favicon.svg" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" href="../favicon.svg" />
  <link rel="apple-touch-icon" href="../favicon.svg" />
  <link rel="stylesheet" href="../assets/css/style.css?v=5" />
  <script type="application/ld+json">
{ld}
  </script>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header class="site-header">
    <div class="container nav">
      <a href="../index.html" class="logo">andreigman<span>.com</span></a>
      <button class="nav-toggle" id="navToggle" aria-label="Open menu">\u2630</button>
      <nav class="nav-menu" id="navMenu">
        <a href="../index.html">Home</a>
        <a href="../about.html">About</a>
        <a href="../blog.html" class="active">Blog</a>
        <a href="../resources.html">Resources</a>
        <a href="../media-watched.html">Media-Watched</a>
        <a href="../functions.html">Functions</a>
        <a href="../credits.html">Credits</a>
      </nav>
      <button class="theme-btn" id="themeToggle" aria-label="Toggle theme">\U0001f319</button>
    </div>
  </header>

  <main id="main-content">
    <section class="section">
      <div class="container narrow">
        <a href="../blog.html" class="blog-back-link">\u2190 Back to Blog</a>
        <header class="post-header">
          <p class="mini-meta"><span class="tag">{t_label}</span> \u00b7 <time datetime="{date}">{d_fmt}</time> \u00b7 3 min read</p>
          <h1>{esc(title)}</h1>
          <p class="lead">{esc(blurb)}</p>
        </header>
        <article class="post-body">
{body_html}
        </article>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <h3 class="logo">andreigman<span>.com</span></h3>
        <p>Personal site, professional identity, study archive, a place where I can nerd out and that gives me an opportunity to not chicken out with challenges.</p>
      </div>
      <div>
        <h4>Pages</h4>
        <a href="../about.html">About</a>
        <a href="../blog.html">Blog</a>
        <a href="../resources.html">Resources</a>
        <a href="../media-watched.html">Media-Watched</a>
        <a href="../functions.html">Functions</a>
        <a href="../credits.html">Credits</a>
      </div>
    </div>
  </footer>

  <script defer src="../assets/js/script.js?v=5"></script>
  <script defer src="../assets/js/search.js?v=5"></script>
</body>
</html>"""
    return page

def patch_blog_html(slug, title, date, tag, blurb):
    """Insert a new card into blog.html's #blogList."""
    if not os.path.exists(BLOG_FILE):
        print(f"! {BLOG_FILE} not found, skipping card patch")
        return

    with open(BLOG_FILE, "r") as f:
        html = f.read()

    card = f'''          <article class="card hover-card" data-tag="{tag}">
            <p class="mini-meta">{month_display(date)} &middot; {tag_label(tag)}</p>
            <h3>{esc(title)}</h3>
            <p>{esc(blurb)}</p>
            <a href="posts/{slug}.html" class="text-link">Read post</a>
          </article>'''

    marker = '<div class="grid-3" id="blogList" aria-live="polite">'
    if marker in html:
        idx = html.index(marker) + len(marker)
        html = html[:idx] + '\n' + card + '\n' + html[idx:]
        with open(BLOG_FILE, "w") as f:
            f.write(html)
        print(f"  \u2713 card patched into {BLOG_FILE}")
    else:
        print(f"! could not find {marker!r} in blog.html — paste card manually:")
        print(card)

def patch_feed(slug, title, date, tag, blurb):
    """Insert a feed entry into posts/posts.json."""
    if not os.path.exists(FEED_FILE):
        print(f"! {FEED_FILE} not found, skipping feed patch")
        return

    with open(FEED_FILE, "r") as f:
        feed = json.load(f)

    entry = {
        "id": slug,
        "file": f"posts/{slug}.html",
        "title": title,
        "date": date,
        "dateDisplay": month_display(date),
        "tag": tag,
        "blurb": blurb,
        "readTime": "3 min"
    }

    feed["posts"].insert(0, entry)
    with open(FEED_FILE, "w") as f:
        json.dump(feed, f, indent=2)
        f.write("\n")
    print(f"  \u2713 entry patched into {FEED_FILE}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Create a blog post")
    parser.add_argument("title", nargs="?", help="Post title")
    parser.add_argument("--tag", "-t", default="diary", help="Post tag (diary, tech, thoughts, etc)")
    parser.add_argument("--blurb", "-b", default="", help="Short excerpt")
    parser.add_argument("--date", "-d", default=datetime.date.today().isoformat(), help="Date YYYY-MM-DD")
    parser.add_argument("--body-file", "-f", help="Read body from file instead of stdin")
    args = parser.parse_args()

    title = args.title
    if not title:
        title = input("Title: ").strip()
        if not title:
            print("Title is required")
            sys.exit(1)

    if not args.blurb:
        blurb = input("Blurb (excerpt): ").strip()
    else:
        blurb = args.blurb

    if args.body_file:
        with open(args.body_file, "r") as f:
            body = f.read()
    else:
        if sys.stdin.isatty():
            print("Body (Markdown) — type/paste and press Ctrl+D when done:")
        body = sys.stdin.read().strip()

    if not body:
        print("Body is empty, aborting.")
        sys.exit(1)

    slug = slugify(title)
    tag = args.tag
    date = args.date

    os.makedirs(POSTS_DIR, exist_ok=True)

    body_html = md_to_html(body)
    post_html = generate_post_html(title, slug, date, tag, blurb, body_html)

    post_path = os.path.join(POSTS_DIR, f"{slug}.html")
    with open(post_path, "w") as f:
        f.write(post_html)
    print(f"  \u2713 created {post_path}")

    patch_blog_html(slug, title, date, tag, blurb)
    patch_feed(slug, title, date, tag, blurb)

    print(f"\nDone! Run: git add . && git commit -m \"add post: {title}\" && git push")

if __name__ == "__main__":
    main()
