#!/usr/bin/env python3
"""
new-project.py — add a project to src/data/projects.json
Usage:
  python3 new-project.py "My Project" \
      --desc "Short description" \
      --tags "python,web,uni" \
      --image "assets/images/projects/my-project.jpg" \
      --link "https://github.com/..."

Images: place them in assets/images/projects/ before running build.
After creating a project, run: python3 build.py
"""

import argparse
import datetime
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DATA = os.path.join(BASE, "src", "data", "projects.json")
PROJECTS_SRC = os.path.join(BASE, "src", "projects")


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def load_data():
    if os.path.exists(PROJECTS_DATA):
        with open(PROJECTS_DATA, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"version": 1, "projects": []}


def save_data(data):
    os.makedirs(os.path.dirname(PROJECTS_DATA), exist_ok=True)
    with open(PROJECTS_DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def main():
    parser = argparse.ArgumentParser(description="Create a project entry")
    parser.add_argument("title", nargs="?", help="Project title")
    parser.add_argument("--desc", "-d", default="", help="Short description")
    parser.add_argument("--tags", "-t", default="", help="Comma-separated tags")
    parser.add_argument(
        "--image", "-i", default="", help="Path to main image (e.g. assets/images/projects/foo.jpg)"
    )
    parser.add_argument(
        "--images", "-m", default="", help="Comma-separated extra image paths"
    )
    parser.add_argument("--link", "-l", default="", help="External URL (GitHub, demo, etc.)")
    parser.add_argument(
        "--body", "-b", help="Path to optional HTML body file (or pipe via stdin)"
    )
    args = parser.parse_args()

    title = args.title
    if not title:
        title = input("Project title: ").strip()
        if not title:
            print("Title is required")
            sys.exit(1)

    desc = args.desc or input("Short description: ").strip()
    tags_raw = args.tags or input("Tags (comma-separated): ").strip()
    tags = [t.strip().lower() for t in tags_raw.split(",") if t.strip()]
    seen = set()
    tags_clean = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            tags_clean.append(t)
    tags = tags_clean

    slug = slugify(title)

    # Validate slug uniqueness
    existing_data = load_data()
    for p in existing_data.get("projects", []):
        existing_slug = p.get("slug") or p.get("id")
        if existing_slug == slug:
            print(f'  ! A project with slug "{slug}" already exists.')
            proceed = input("  Add duplicate entry anyway? [y/N] ").strip().lower()
            if proceed != "y":
                print("Aborted.")
                sys.exit(1)
            break

    image = args.image or input("Main image path (or leave blank): ").strip()
    images_raw = args.images or ""
    extra_images = [p.strip() for p in images_raw.split(",") if p.strip() and p.strip() != image]

    link = args.link or input("External link (or leave blank): ").strip()

    os.makedirs(PROJECTS_SRC, exist_ok=True)

    if args.body:
        with open(args.body, "r", encoding="utf-8") as f:
            body = f.read()
    else:
        body_path = os.path.join(PROJECTS_SRC, f"{slug}.html")
        if os.path.exists(body_path):
            overwrite = input(f"Body file exists ({body_path}). Overwrite? [y/N] ").strip().lower()
            if overwrite == "y":
                if sys.stdin.isatty():
                    print("Body (HTML) — type/paste and press Ctrl+D when done (or leave empty):")
                body = sys.stdin.read().strip()
                if body:
                    with open(body_path, "w", encoding="utf-8") as f:
                        f.write(body + "\n")
                    print(f"  \u2713 updated {body_path}")
            else:
                print(f"  \u2013 kept existing {body_path}")
        else:
            body = ""

    data = load_data()
    entry = {
        "id": slug,
        "slug": slug,
        "title": title,
        "description": desc,
        "tags": tags,
        "image": image,
        "images": extra_images,
        "link": link,
        "date": datetime.date.today().isoformat(),
    }
    data["projects"] = [p for p in data.get("projects", []) if p.get("slug") != slug]
    data["projects"].append(entry)
    save_data(data)
    print(f"  \u2713 updated {PROJECTS_DATA}")

    print(f"\nDone! Run: python3 build.py")
    print(f"Place images in assets/images/projects/ and reference them by path.")


if __name__ == "__main__":
    main()
