#!/usr/bin/env python3
"""Regenerate Sift standalone page's embedded feed from data/ideas.json."""
from pathlib import Path
import json
import re
from html.parser import HTMLParser

class SafeSlideHTML(HTMLParser):
    ALLOWED = {"p", "b", "strong", "em", "i", "ul", "ol", "li", "h3", "h4", "blockquote", "br", "code", "small"}
    def handle_starttag(self, tag, attrs):
        if tag not in self.ALLOWED or attrs:
            raise ValueError(f"Unsafe slide HTML tag or attributes: {tag}")
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
    def handle_endtag(self, tag):
        if tag not in self.ALLOWED:
            raise ValueError(f"Unsafe slide HTML closing tag: {tag}")

def validate_slides(idea):
    slides = idea.get("slides")
    if slides is None:
        return  # Backwards-compatible rendering for the initial cards
    assert isinstance(slides, list) and 3 <= len(slides) <= 8, "Expected 3-8 content slides"
    for slide in slides:
        assert slide.get("kind") in {"cover", "story", "visual", "interactive"}, "Unknown slide layout"
        assert isinstance(slide.get("title"), str) and slide["title"].strip()
        assert isinstance(slide.get("eyebrow"), str)
        html = slide.get("html")
        assert isinstance(html, str) and len(html) <= 1800, "Slide HTML must be short"
        SafeSlideHTML().feed(html)
        visual = slide.get("visual")
        if visual:
            assert visual.get("type") in {"compare", "steps", "flow", "cards"}
            if visual["type"] == "compare":
                assert isinstance(visual.get("left"), dict) and isinstance(visual.get("right"), dict)
            else:
                assert isinstance(visual.get("items"), list) and 2 <= len(visual["items"]) <= 4
        interaction = slide.get("interaction")
        if interaction:
            assert interaction.get("type") in {"reveal", "choice"}
            if interaction["type"] == "reveal":
                assert interaction.get("prompt") and interaction.get("answer")
            else:
                assert interaction.get("question") and isinstance(interaction.get("choices"), list)
                assert 2 <= len(interaction["choices"]) <= 4

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "index.html"
ideas = json.loads((ROOT / "data/ideas.json").read_text(encoding="utf-8"))
assert isinstance(ideas, list) and len(ideas) > 0
assert len({i["id"] for i in ideas}) == len(ideas), "Duplicate idea ids"
for idea in ideas:
    for key in ("id", "title", "source_url", "type", "summary", "quiz"):
        assert key in idea, f"Missing {key}"
    assert idea["type"] in ("Book", "Essay", "Paper")
    assert idea["source_url"].startswith("https://"), "Use a secure original source URL"
    assert 0 <= idea["quiz"]["answer"] < len(idea["quiz"]["choices"])
    validate_slides(idea)
html = path.read_text(encoding="utf-8")
payload = json.dumps(ideas, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
pattern = r"window\.SIFT_IDEAS\s*=\s*\[[\s\S]*?\];(?=\s*</script>)"
updated, count = re.subn(pattern, lambda _: "window.SIFT_IDEAS = " + payload + ";", html, count=1)
assert count == 1, "Couldn't find data block in index.html"
# Compile CSS and JavaScript into the published HTML to avoid stale/missing
# separate assets when the reader is first launched on GitHub Pages.
css_asset = (ROOT / "reader.css").read_text(encoding="utf-8")
js_asset = (ROOT / "reader.js").read_text(encoding="utf-8")
assert "</style>" not in css_asset.lower() and "</script>" not in js_asset.lower()
css_link = '<link rel="stylesheet" href="reader.css" />'
js_link = '<script src="reader.js"></script>'
assert updated.count(css_link) == 1 and updated.count(js_link) == 1, "Missing reader assets in index.html"
updated = updated.replace(css_link, '<style id="sift-reader-styles">\n' + css_asset + '\n</style>')
updated = updated.replace(js_link, '<script id="sift-reader-script">\n' + js_asset + '\n</script>')
assert updated.count('window.SIFT_SLIDES =') == 1, "Slide reader unavailable"
path.write_text(updated, encoding="utf-8")
print(f"Embedded {len(ideas)} cards in index.html")
