# Sift — source-first microlearning

Live site (after Pages is enabled): https://royg27.github.io/sift/

An accessible mobile-first library of short, source-linked ideas from books, essays, blogs and academic papers.

## Features
- Mobile-first swipeable stories: each idea opens as 5–7 short slides (including a recall slide), with progress dots, keyboard arrows, and touch swipes
- Source-safe authored HTML per slide plus prebuilt comparisons, diagrams, reveal cards, and choices; legacy ideas auto-convert
- 12 source-linked starter ideas (4 books, 5 essays, 3 papers)
- Search and category/source filters
- Unread-only Discover and Unread tabs, plus a separate Completed shelf sorted by completion time; mark a story unread to move it back
- Bookmarks, read progress and recall questions, stored locally per browser (no account, backend, or cross-user sharing)
- Original source links, limitations and suggested applications

## Publishing
This repository includes a GitHub Actions Pages deployment workflow. Under **Settings > Pages**, select **GitHub Actions** as the build/deployment source. Then trigger **Actions > Publish Sift > Run workflow** if no deployment ran automatically.

## Editing the feed
Edit `data/ideas.json`. Run `python scripts/sync_data.py` to rebuild the embedded dataset in `index.html`. Commit both files to publish.

The deploy workflow embeds structured data into the static HTML and copies the lightweight `reader.js` and `reader.css` assets. There is no backend or API required. See [slide content schema](docs/SLIDE_FORMAT.md).

## Editorial safeguards
Starter source links and synopses are **not fully source-audited**. Always check the source supports a claim before publishing new ideas. Book entries should never claim to have read inaccessible text; essays are arguments rather than scientific results.

## Daily curation
The user has an existing ChatGPT scheduled curation task configured to append source-verified ideas with an authored `slides` array. Scheduled GitHub writes have not yet been verified unattended. This repository does not enable any paid API key or external AI billing.
