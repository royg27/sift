#!/usr/bin/env python3
"""Regenerate Sift standalone page's embedded feed from data/ideas.json."""
from pathlib import Path
import json
import re
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
html = path.read_text(encoding="utf-8")
payload = json.dumps(ideas, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
pattern = r"window\.SIFT_IDEAS\s*=\s*\[[\s\S]*?\];(?=\s*</script>)"
updated, count = re.subn(pattern, lambda _: "window.SIFT_IDEAS = " + payload + ";", html, count=1)
assert count == 1, "Couldn't find data block in index.html"
path.write_text(updated, encoding="utf-8")
print(f"Embedded {len(ideas)} cards in index.html")
