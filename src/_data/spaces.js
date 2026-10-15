const fs = require("node:fs");
const path = require("node:path");

const DATA_FILE = path.join(__dirname, "..", "..", "data", "repos.json");

// Groups a repo's translations by status, keeping the order each status first appears.
function statusGroups(translations) {
  const order = [];
  const groups = {};
  for (const t of translations) {
    if (!groups[t.status]) {
      groups[t.status] = [];
      order.push(t.status);
    }
    groups[t.status].push({ label: t.label, url: t.course_url });
  }
  return order.map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    items: groups[status],
  }));
}

module.exports = function () {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error("data/repos.json is missing. Run `npm run build:data` first.");
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  return data.spaces.map((space) => ({
    ...space,
    repoCount: space.repos.length,
    repos: space.repos.map((repo) => ({
      ...repo,
      statusGroups: statusGroups(repo.translations),
    })),
  }));
};
