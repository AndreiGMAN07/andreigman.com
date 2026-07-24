#!/usr/bin/env python3
"""
delete-post.py — remove a post from posts/, blog.html, and posts.json
Usage:
  python3 delete-post.py "Are we all right?"
  python3 delete-post.py are-we-all-right
"""

import sys, os, re, json, argparse

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

def main():
    parser = argparse.ArgumentParser(description="Delete a blog post")
    parser.add_argument("post", help="Post title or slug")
    args = parser.parse_args()

    slug = slugify(args.post)
    post_file = os.path.join(POSTS_DIR, f"{slug}.html")
    removed_any = False

    # 1. Delete HTML file
    if os.path.exists(post_file):
        os.remove(post_file)
        print(f"  \u2713 deleted {post_file}")
        removed_any = True
    else:
        print(f"  - {post_file} not found")

    # 2. Remove card from blog.html
    if os.path.exists(BLOG_FILE):
        with open(BLOG_FILE, "r") as f:
            html = f.read()

        # Match the article block containing this slug
        pattern = re.compile(
            r'<article class="card hover-card" data-tag="[^"]*">\s*'
            r'<p class="mini-meta">[^<]*</p>\s*'
            r'<h3>[^<]*</h3>\s*'
            r'<p>[^<]*</p>\s*'
            r'<a href="posts/' + re.escape(slug) + r'\.html" class="text-link">Read post</a>\s*'
            r'</article>\n?',
            re.DOTALL
        )

        new_html, n = pattern.subn('', html)
        if n > 0:
            with open(BLOG_FILE, "w") as f:
                f.write(new_html)
            print(f"  \u2713 removed card from {BLOG_FILE}")
            removed_any = True
        else:
            print(f"  - card not found in {BLOG_FILE}")
    else:
        print(f"  - {BLOG_FILE} not found")

    # 3. Remove entry from posts.json
    if os.path.exists(FEED_FILE):
        with open(FEED_FILE, "r") as f:
            feed = json.load(f)

        before = len(feed.get("posts", []))
        feed["posts"] = [p for p in feed["posts"] if p.get("id") != slug and p.get("slug") != slug]
        after = len(feed["posts"])

        if after < before:
            with open(FEED_FILE, "w") as f:
                json.dump(feed, f, indent=2)
                f.write("\n")
            print(f"  \u2713 removed entry from {FEED_FILE}")
            removed_any = True
        else:
            print(f"  - entry not found in {FEED_FILE}")
    else:
        print(f"  - {FEED_FILE} not found")

    if not removed_any:
        print(f"\n! Nothing was removed. No post found matching \"{args.post}\"")
        sys.exit(1)

    print(f"\nDone. Run: git add . && git commit -m \"delete post: {args.post}\" && git push")

if __name__ == "__main__":
    main()
