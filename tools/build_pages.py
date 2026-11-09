"""Assemble the site's HTML pages from src/shell.html and src/pages/<page>.html.

Each fragment starts with a front-matter block:
  <!--
  title: ...
  description: ...
  -->
The output files (index.html, reactor.html, ...) are committed, so GitHub Pages needs no build step.
Run from the repo root after editing anything in src/: python3 tools/build_pages.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
shell = (ROOT / "src/shell.html").read_text()
OUT = {"home": "index.html"}

for frag in sorted((ROOT / "src/pages").glob("*.html")):
    page = frag.stem
    text = frag.read_text()
    m = re.match(r"\s*<!--(.*?)-->\s*", text, re.S)
    meta = dict(re.findall(r"^\s*(\w+):\s*(.+)$", m.group(1), re.M)) if m else {}
    body = text[m.end():] if m else text
    html = (shell.replace("{{title}}", meta.get("title", "The Magnet Problem"))
                 .replace("{{description}}", meta.get("description", ""))
                 .replace("{{page}}", page)
                 .replace("{{body}}", body.rstrip()))
    out = ROOT / OUT.get(page, f"{page}.html")
    out.write_text(html)
    print("wrote", out.name)
