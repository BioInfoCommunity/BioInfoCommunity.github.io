const fs = require("node:fs");
const path = require("node:path");

const DATA_FILE = path.join(__dirname, "..", "..", "data", "news.json");
const HOME_LIMIT = 3;

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

module.exports = function () {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error("data/news.json is missing. Run `npm run build:news` first.");
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const items = data.items.map((item) => ({
    ...item,
    displayDate: dateFormat.format(new Date(`${item.date}T00:00:00Z`)),
  }));

  // Items with no community are general news and only appear on the homepage.
  const bySpace = {};
  for (const item of items) {
    if (!item.community) continue;
    (bySpace[item.community] ||= []).push(item);
  }

  return {
    home: items.slice(0, HOME_LIMIT),
    bySpace,
  };
};
