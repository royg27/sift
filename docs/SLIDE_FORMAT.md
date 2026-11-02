# Sift slide-story content contract

Each idea in `data/ideas.json` can include a `slides` list of **4–6 short HTML panels**. The website builds a final recall slide automatically from the existing `quiz` field.

## Minimal example

```json
{
  "slides": [
    {
      "kind": "cover",
      "eyebrow": "THE QUESTION",
      "title": "What if the obvious answer is wrong?",
      "html": "<p>Start with an interesting tension, not a summary.</p>"
    },
    {
      "kind": "visual",
      "eyebrow": "THE CONTRAST",
      "title": "Two ways to approach this",
      "html": "<p>Explain the comparison briefly.</p>",
      "visual": {
        "type": "compare",
        "left": {"label": "A", "title": "First approach", "text": "One sentence"},
        "right": {"label": "B", "title": "Second approach", "text": "One sentence"}
      }
    },
    {
      "kind": "interactive",
      "eyebrow": "TRY IT",
      "title": "Apply the idea",
      "html": "<p>Invite the reader to make a prediction.</p>",
      "interaction": {
        "type": "reveal",
        "prompt": "What happens next?",
        "answer": "Explain the insight and its limitations."
      }
    }
  ]
}
```

## Supported panels

- `kind`: `cover`, `story`, `visual`, `interactive`.
- `html`: static HTML paragraphs and text formatting only. The only allowed tags are `p`, `strong`, `b`, `em`, `i`, `ul`, `ol`, `li`, `h3`, `h4`, `blockquote`, `br`, `code`, `small`. **No attributes** are allowed.
- `visual`: `compare` with `left` and `right` cards, or `steps` / `flow` / `cards` with 2–4 `items` containing `label`, `title`, `text`.
- `interaction`: `reveal` (`prompt`, `answer`) or `choice` (`question`, `choices`, `feedback`). These are predefined components controlled by the website, not arbitrary JavaScript.
- Keep panels concise: usually 30–70 words and a single central idea; avoid scrolling. Prefer visual metaphors to stock images or invented quantitative charts.
- Strong evidence comes first: concrete claims, especially numbers, must be verifiable from the original source URL. Explicitly identify author arguments, empirical findings and limits.
- Each idea retains legacy `body`, `takeaways`, `nuance`, `application`, `quiz` and provenance fields. They support search and fallback decks.
- First three examples: `scout-mindset`, `lost-middle`, `bitter-lesson`.

## Publication path

Scheduled ChatGPT → GitHub connector writes `data/ideas.json` → GitHub Actions `scripts/sync_data.py` validates safe HTML and embeds all cards into `index.html` → `reader.js` and `reader.css` implement the mobile slideshow → GitHub Pages publishes. No paid API needed.

The HTML is treated as untrusted content: the build validator rejects unsafe tags and attributes, and the browser renderer strips all unapproved elements and attributes. No generated JavaScript runs.

Existing legacy ideas without `slides` render as automatically composed slides until they receive an authored deck.
