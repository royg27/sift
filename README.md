# Sift — source-first microlearning

Live site (after Pages is enabled): https://royg27.github.io/sift/

An accessible mobile-first library of short, source-linked ideas from books, essays, blogs and academic papers.

## Features
- 12 source-linked starter ideas (4 books, 5 essays, 3 papers)
- Search and category/source filters
- Bookmarks, read progress and recall questions, stored locally in the browser
- Original source links, limitations and suggested applications

## Publishing
This repository includes a GitHub Actions Pages deployment workflow. Under **Settings > Pages**, select **GitHub Actions** as the build/deployment source. Then trigger **Actions > Publish Sift > Run workflow** if no deployment ran automatically.

## Editing the feed
Edit `data/ideas.json`. Run `python scripts/sync_data.py` to rebuild the embedded dataset in `index.html`. Commit both files to publish.

The standalone HTML deliberately embeds the data so the page loads without any backend or JSON fetch, including when opened locally.

## Editorial safeguards
Starter source links and synopses are **not fully source-audited**. Always check the source supports a claim before publishing new ideas. Book entries should never claim to have read inaccessible text; essays are arguments rather than scientific results.

## Daily curation
The prototype has no running automatic curation. An optional API-driven, draft-first curation workflow is in the prior project ZIP. API usage requires a separately billed API key and should remain draft-only until reviewed.
