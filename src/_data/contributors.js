const fs = require("node:fs");
const path = require("node:path");

const DATA_FILE = path.join(__dirname, "..", "..", "data", "contributors.json");

module.exports = function () {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error("data/contributors.json is missing. Run `npm run build:contributors` first.");
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  return {
    ...data,
    contributorCount: data.contributors.length,
  };
};
