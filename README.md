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
