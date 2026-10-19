// Compiles highlights/*.yaml into data/highlights.json. Only items that should be visible today are written.
// Node 20+. Fails the build on invalid items so a typo never reaches the site silently.

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const HIGHLIGHTS_DIR = new URL("../highlights/", import.meta.url);
const OUT_PATH = new URL("../data/highlights.json", import.meta.url);
const STATUSES = new Set(["live", "draft"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WORDS = 150;
// Reference files that are not highlight items.
const SKIPPED_FILES = new Set(["template.yaml"]);

const today = new Date().toISOString().slice(0, 10);
const errors = [];
const warnings = [];

const config = JSON.parse(await readFile(new URL("../spaces.json", import.meta.url), "utf8"));
const spaceIds = new Set(config.spaces.map((s) => s.id));

// JSON_SCHEMA keeps dates as YYYY-MM-DD strings instead of Date objects.
const files = (await readdir(HIGHLIGHTS_DIR)).filter((f) => /\.ya?ml$/.test(f) && !SKIPPED_FILES.has(f)).sort();

function checkDate(file, field, value) {
  if (!DATE_RE.test(String(value))) {
    errors.push(`${file}: ${field} must be YYYY-MM-DD, got "${value}"`);
    return false;
  }
  return true;
}

const items = [];
for (const file of files) {
  let raw;
  try {
    raw = yaml.load(await readFile(join(fileURLToPath(HIGHLIGHTS_DIR), file), "utf8"), { schema: yaml.JSON_SCHEMA });
  } catch (err) {
    errors.push(`${file}: invalid YAML: ${err.message}`);
    continue;
  }

  for (const field of ["title", "description", "date", "status"]) {
    if (raw?.[field] === undefined || raw?.[field] === null || raw?.[field] === "") {
      errors.push(`${file}: missing required field "${field}"`);
    }
  }
  if (!raw || errors.some((e) => e.startsWith(`${file}:`))) continue;

  if (!STATUSES.has(raw.status)) {
    errors.push(`${file}: status must be one of ${[...STATUSES].join(", ")}, got "${raw.status}"`);
    continue;
  }
  if (!checkDate(file, "date", raw.date)) continue;
  if (raw.date_archive !== undefined && !checkDate(file, "date_archive", raw.date_archive)) continue;
  if (raw.url !== undefined && !/^https:\/\//.test(raw.url)) {
    errors.push(`${file}: url must be an https URL`);
    continue;
  }
  if (raw.community !== undefined && !spaceIds.has(raw.community)) {
    errors.push(`${file}: community "${raw.community}" is not a space id in spaces.json`);
    continue;
  }
  const words = String(raw.description).trim().split(/\s+/).length;
  if (words > MAX_WORDS) warnings.push(`${file}: description is ${words} words (guideline: under ${MAX_WORDS})`);

  // An item shows as soon as it is live, and drops off once date_archive is reached.
  const visible = raw.status === "live" && (raw.date_archive === undefined || today < raw.date_archive);
  if (!visible) continue;

  items.push({
    title: String(raw.title).trim(),
    description: String(raw.description).trim(),
    url: raw.url ?? null,
    community: raw.community ?? null,
    date: raw.date,
  });
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}

// Closest to today first, whether that date is in the past or the future. Ties go to the later date.
const todayMs = Date.parse(`${today}T00:00:00Z`);
const daysFromToday = (item) => Math.abs(Date.parse(`${item.date}T00:00:00Z`) - todayMs);
items.sort((a, b) => daysFromToday(a) - daysFromToday(b) || (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));

await mkdir(dirname(fileURLToPath(OUT_PATH)), { recursive: true });
await writeFile(OUT_PATH, JSON.stringify({ generated: today, items }, null, 2) + "\n");
console.log(`Wrote ${fileURLToPath(OUT_PATH)} with ${items.length} of ${files.length} highlight items visible on ${today}`);
