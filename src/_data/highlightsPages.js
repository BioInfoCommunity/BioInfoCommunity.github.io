const fs = require("node:fs");
const path = require("node:path");
const loadHighlights = require("./highlights.js");

const PAGE_SIZE = 20;
const SPACES_FILE = path.join(__dirname, "..", "..", "spaces.json");

// One entry per listing page: the "all" list and one list per space that has highlights,
// each split into pages of PAGE_SIZE items.
module.exports = function () {
  const highlights = loadHighlights();
  const config = JSON.parse(fs.readFileSync(SPACES_FILE, "utf8"));
  const titles = Object.fromEntries(config.spaces.map((s) => [s.id, s.title]));

  const filters = [{ id: "all", path: "highlights/", label: "All spaces", items: highlights.all }];
  for (const id of Object.keys(highlights.bySpace).sort()) {
    filters.push({ id, path: `highlights/${id}/`, label: titles[id] || id, items: highlights.bySpace[id] });
  }
  const options = filters.map((f) => ({ id: f.id, label: f.label, url: `/${f.path}` }));

  const pages = [];
  for (const filter of filters) {
    const chunks = [];
    for (let i = 0; i < filter.items.length; i += PAGE_SIZE) {
      chunks.push(filter.items.slice(i, i + PAGE_SIZE));
    }
    if (!chunks.length) chunks.push([]);

    chunks.forEach((items, index) => {
      const page = index + 1;
      const pagePath = page === 1 ? filter.path : `${filter.path}page/${page}/`;
      const url = (n) => (n === 1 ? `/${filter.path}` : `/${filter.path}page/${n}/`);
      pages.push({
        filterId: filter.id,
        label: filter.label,
        path: pagePath,
        url: `/${pagePath}`,
        items,
        total: filter.items.length,
        page,
        totalPages: chunks.length,
        prevUrl: page > 1 ? url(page - 1) : null,
        nextUrl: page < chunks.length ? url(page + 1) : null,
        options: options.map((o) => ({ ...o, selected: o.id === filter.id })),
      });
    });
  }
  return pages;
};
