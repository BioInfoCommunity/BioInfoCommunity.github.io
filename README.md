# BioInfoCommunity.github.io

## Building the site

The site is built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages by `.github/workflows/pages.yml`.

```
npm install
npm run build   # fetches repo data (needs GITHUB_TOKEN for higher rate limits) and writes _site/
npm run serve   # local preview with live reload
```

- `spaces.json`: which repos belong to which space, their translation branches and status.
- `scripts/build-repos.mjs`: writes `data/repos.json` from the GitHub API (generated, not committed).
- `src/`: pages and templates. `src/spaces/` generates the space list and one page per space.
- `src/index.html`: the homepage, copied to the site unchanged.

## Adding news

Each news item is one YAML file in `news/`, named by its date (for example `news/2026-10-21.yaml`):

```yaml
title: Portuguese translation of AlphaFold
description: Short summary, under 150 words.
url: https://example.org/post        # optional, https only
community: alphafold                 # optional, a space id from spaces.json; omit for general news
date: 2026-10-21                     # used for ordering and the date shown on the item
date_archive: 2026-12-21             # optional, the item stops showing on this date
status: live                         # live or draft; only live items are shown
```

- `scripts/build-news.mjs` validates the files and writes `data/news.json` (generated, not committed). Invalid items fail the build.
- A live item shows as soon as its file is in `news/`, whatever its `date`, until `date_archive` is reached. The site rebuilds daily, so changes appear on the next build.
- Items are ordered by how close their `date` is to today, past or future. The homepage shows the first three, and each space page shows its items in the same order. Items without a `community` only appear on the homepage.
