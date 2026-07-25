#!/usr/bin/env python3
"""
new-post.py — add a blog post to src/data/posts.json and src/posts/{slug}.html
Usage:
  python3 new-post.py "My Title" --tag diary --blurb "Short summary"
Then type/paste the body markdown, press Ctrl+D when done.

After creating a post, run: python3 build.py
"""

import argparse
import datetime
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
POSTS_DATA = os.path.join(BASE, "src", "data", "posts.json")
POSTS_SRC = os.path.join(BASE, "src", "posts")


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def estimate_read_time(text):
    """Rough reading time in minutes. ~200 wpm + extra for code blocks."""
    if not text:
        return "1 min"
    code_blocks = re.findall(r"```[\s\S]*?```", text)
    code_words = sum(len(b.split()) for b in code_blocks)
    plain_text = re.sub(r"```[\s\S]*?```", "", text)
    plain_words = len(re.findall(r"\b\w+\b", plain_text))
    code_time = (code_words / 200) * 1.5
    plain_time = plain_words / 200
    total = max(1, round(plain_time + code_time))
    return f"{total} min"


def md_to_html(src):
    if not src:
        return ""
    h = src
    h = h.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    h = re.sub(
        r"```(\w*)\n?([\s\S]*?)```",
        r'<pre><code class="language-\1">\2</code></pre>',
        h,
    )
    h = re.sub(r"`([^`]+)`", r"<code>\1</code>", h)
    for i in range(6, 0, -1):
        h = re.sub(
            r"^#{" + str(i) + r"}\s+(.*$)",
            f"<h{i}>\\1</h{i}>",
            h,
            flags=re.MULTILINE,
        )
    h = re.sub(r"^---\s*$", "<hr>", h, flags=re.MULTILINE)
    h = re.sub(r"^> (.*$)", r"<blockquote><p>\1</p></blockquote>", h, flags=re.MULTILINE)
    h = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", h)
    h = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", h)
    h = re.sub(r"\*(.+?)\*", r"<em>\1</em>", h)
    h = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r'<img src="\2" alt="\1">', h)
    h = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', h)
    h = re.sub(r"^- (.*$)", r"<li>\1</li>", h, flags=re.MULTILINE)
    h = re.sub(r"^\d+\. (.*$)", r"<li>\1</li>", h, flags=re.MULTILINE)

    lines, out, in_ul, in_bq = h.split("\n"), [], False, False
    for line in lines:
        t = line.strip()
        is_li = t.startswith("<li>")
        is_bq = t.startswith("<blockquote>")
        is_hr = t == "<hr>" or t == "<hr/>"
        is_hd = t.startswith("<h") and len(t) > 2 and t[2].isdigit()
        is_pre = t.startswith("<pre>")
        if is_pre:
            if in_ul:
                out.append("</ul>")
                in_ul = False
            if in_bq:
                out.append("</blockquote>")
                in_bq = False
            out.append(line)
            continue
        if is_li:
            if in_bq:
                out.append("</blockquote>")
                in_bq = False
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append(line)
            continue
        if in_ul and not is_li:
            out.append("</ul>")
            in_ul = False
        if is_bq:
            if in_ul:
                out.append("</ul>")
                in_ul = False
            if not in_bq:
                in_bq = True
            out.append(line)
            continue
        if in_bq and not is_bq:
            out.append("</blockquote>")
            in_bq = False
        if is_hd or is_hr or t == "":
            out.append(line)
            continue
        if not is_li and not is_bq and not is_hd and not is_hr and not is_pre and t:
            out.append(f"<p>{line}</p>")
        else:
            out.append(line)
    if in_ul:
        out.append("</ul>")
    if in_bq:
        out.append("</blockquote>")
    return "\n".join(out)


def load_posts_data():
    if os.path.exists(POSTS_DATA):
        with open(POSTS_DATA, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"version": 2, "posts": []}


def save_posts_data(data):
    os.makedirs(os.path.dirname(POSTS_DATA), exist_ok=True)
    with open(POSTS_DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def main():
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

    blurb = args.blurb or input("Blurb (excerpt): ").strip()

    if args.body_file:
        with open(args.body_file, "r", encoding="utf-8") as f:
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
    body_html = md_to_html(body)
    read_time = estimate_read_time(body)

    os.makedirs(POSTS_SRC, exist_ok=True)
    body_path = os.path.join(POSTS_SRC, f"{slug}.html")
    with open(body_path, "w", encoding="utf-8") as f:
        f.write(body_html.strip() + "\n")
    print(f"  ✓ created {body_path}")

    data = load_posts_data()
    entry = {
        "id": slug,
        "slug": slug,
        "title": title,
        "date": date,
        "tag": tag,
        "blurb": blurb,
        "readTime": read_time,
    }
    data["posts"] = [p for p in data.get("posts", []) if p.get("slug") != slug]
    data["posts"].insert(0, entry)
    save_posts_data(data)
    print(f"  ✓ updated {POSTS_DATA}")

    print(f"\nDone! Run: python3 build.py")
    print(f"Then: git add . && git commit -m \"add post: {title}\"")


if __name__ == "__main__":
    main()
