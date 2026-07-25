#!/usr/bin/env python3
"""
delete-post.py — remove a post from src/data/posts.json and src/posts/
Usage:
  python3 delete-post.py "Are we all right?"
  python3 delete-post.py are-we-all-right

After deleting, run: python3 build.py
"""

import argparse
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


def main():
    parser = argparse.ArgumentParser(description="Delete a blog post")
    parser.add_argument("post", help="Post title or slug")
    args = parser.parse_args()

    slug = slugify(args.post)
    body_file = os.path.join(POSTS_SRC, f"{slug}.html")
    removed_any = False

    if os.path.exists(body_file):
        os.remove(body_file)
        print(f"  ✓ deleted {body_file}")
        removed_any = True
    else:
        print(f"  - {body_file} not found")

    if os.path.exists(POSTS_DATA):
        with open(POSTS_DATA, "r", encoding="utf-8") as f:
            data = json.load(f)
        before = len(data.get("posts", []))
        data["posts"] = [
            p for p in data.get("posts", []) if p.get("slug") != slug and p.get("id") != slug
        ]
        after = len(data["posts"])
        if after < before:
            with open(POSTS_DATA, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
                f.write("\n")
            print(f"  ✓ removed entry from {POSTS_DATA}")
            removed_any = True
        else:
            print(f"  - entry not found in {POSTS_DATA}")
    else:
        print(f"  - {POSTS_DATA} not found")

    if not removed_any:
        print(f'\n! Nothing was removed. No post found matching "{args.post}"')
        sys.exit(1)

    print("\nDone! Run: python3 build.py")
    print(f'Then: git add . && git commit -m "delete post: {args.post}"')


if __name__ == "__main__":
    main()
