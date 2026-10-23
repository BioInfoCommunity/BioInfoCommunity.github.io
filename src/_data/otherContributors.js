const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const DATA_FILE = path.join(__dirname, "..", "..", "contributors.yaml");

// Manually listed contributors from contributors.yaml, sorted by name.
module.exports = function () {
  if (!fs.existsSync(DATA_FILE)) return [];
  const people = yaml.load(fs.readFileSync(DATA_FILE, "utf8")) || [];
  return people
    .filter((p) => p && p.name)
    .sort((a, b) => a.name.localeCompare(b.name));
};
