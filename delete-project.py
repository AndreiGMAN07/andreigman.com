#!/usr/bin/env python3
"""
delete-project.py — remove a project from src/data/projects.json
Usage:
  python3 delete-project.py "My Project"
  python3 delete-project.py my-project

After deleting, run: python3 build.py
"""

import argparse
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DATA = os.path.join(BASE, "src", "data", "projects.json")


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def main():
    parser = argparse.ArgumentParser(description="Delete a project entry")
    parser.add_argument("project", help="Project title or slug")
    args = parser.parse_args()

    slug = slugify(args.project)
    removed_any = False

    if os.path.exists(PROJECTS_DATA):
        with open(PROJECTS_DATA, "r", encoding="utf-8") as f:
            data = json.load(f)
        before = len(data.get("projects", []))
        data["projects"] = [
            p for p in data.get("projects", [])
            if p.get("slug") != slug and p.get("id") != slug
        ]
        after = len(data["projects"])
        if after < before:
            with open(PROJECTS_DATA, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
                f.write("\n")
            print(f"  \u2713 removed entry from {PROJECTS_DATA}")
            removed_any = True
        else:
            print(f"  \u2013 entry not found in {PROJECTS_DATA}")
    else:
        print(f"  \u2013 {PROJECTS_DATA} not found")

    if not removed_any:
        print(f'\n! Nothing was removed. No project found matching "{args.project}"')
        sys.exit(1)

    print("\nDone! Run: python3 build.py")
    print(f'Then: git add . && git commit -m "delete project: {args.project}"')


if __name__ == "__main__":
    main()
