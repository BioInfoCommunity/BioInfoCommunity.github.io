// Builds data/repos.json from the GitHub API, using spaces.json as the mapping.
// Node 20+, no dependencies. Set GITHUB_TOKEN to raise the API rate limit.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ORG = "BioInfoCommunity";
const SITE = "https://www.bioinfotraining-community.org";
const STATUSES = new Set(["published", "in-progress", "planned"]);
const token = process.env.GITHUB_TOKEN;
const warnings = [];

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}: ${await res.text()}`);
  return res.json();
}

// Follows GitHub's paging until a short page comes back.
async function ghAll(path) {
  const items = [];
  for (let page = 1; ; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gh(`${path}${sep}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

const config = JSON.parse(await readFile(new URL("../spaces.json", import.meta.url), "utf8"));
const ignored = new Set(config.ignoredRepos);

// Map each listed repo to its space, and refuse repos that appear twice.
const assigned = new Map();
for (const space of config.spaces) {
  for (const repo of space.repos) {
    if (assigned.has(repo.name)) throw new Error(`${repo.name} is listed in more than one space`);
    assigned.set(repo.name, space.id);
  }
}

const orgRepos = await ghAll(`/orgs/${ORG}/repos?type=public`);
const orgRepoNames = new Set(orgRepos.map((r) => r.name));

for (const name of assigned.keys()) {
  if (!orgRepoNames.has(name)) throw new Error(`spaces.json lists ${name}, which is not a public repo in ${ORG}`);
}

const unassigned = [...orgRepoNames].filter((n) => !assigned.has(n) && !ignored.has(n));
for (const name of unassigned) {
  warnings.push(`Not in spaces.json or ignoredRepos: ${name}`);
}

async function buildRepo(repoConfig) {
  const name = repoConfig.name;
  const [repo, languageBytes, branches] = await Promise.all([
    gh(`/repos/${ORG}/${name}`),
    gh(`/repos/${ORG}/${name}/languages`),
    ghAll(`/repos/${ORG}/${name}/branches`),
  ]);
  const branchNames = new Set(branches.map((b) => b.name));
  const main = repo.default_branch;

  // The default branch is the English course, served at /en/.
  const translations = [
    {
      code: "en",
      label: "English",
      status: "published",
      branch: main,
      course_url: `${SITE}/${name}/en/`,
      branch_url: `${repo.html_url}/tree/${main}`,
    },
  ];

  for (const lang of repoConfig.languages) {
    // English is already added above from the default branch, so skip a duplicate entry.
    if (lang.branch === main) continue;
    if (!STATUSES.has(lang.status)) {
      throw new Error(`${name}: invalid status "${lang.status}" for ${lang.code}`);
    }
    if (lang.status !== "planned" && !branchNames.has(lang.branch)) {
      warnings.push(`${name}: branch "${lang.branch}" for ${lang.code} was not found`);
      continue;
    }
    translations.push({
      code: lang.code,
      label: lang.label,
      status: lang.status,
      branch: lang.branch ?? null,
      course_url: lang.status === "planned" ? null : `${SITE}/${name}/${lang.code}/`,
      branch_url: lang.branch ? `${repo.html_url}/tree/${lang.branch}` : null,
    });
  }

  const totalBytes = Object.values(languageBytes).reduce((sum, n) => sum + n, 0);
  const codeLanguages = Object.entries(languageBytes)
    .sort((a, b) => b[1] - a[1])
    .map(([language, bytes]) => ({
      name: language,
      percent: totalBytes ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    }));

  // Optional cover image, linked from its external host (never copied into the repo).
  const image = repoConfig.image ?? null;
  if (image && !/^https:\/\//.test(image)) {
    throw new Error(`${name}: image must be an https URL`);
  }

  return {
    name,
    description: repo.description,
    image,
    html_url: repo.html_url,
    course_url: repo.has_pages ? `${SITE}/${name}/` : null,
    homepage: repo.homepage || null,
    topics: repo.topics,
    stars: repo.stargazers_count,
    pushed_at: repo.pushed_at,
    code_languages: codeLanguages,
    translations,
  };
}

const spaces = [];
for (const space of config.spaces) {
  const repos = [];
  for (const repoConfig of space.repos) {
    repos.push(await buildRepo(repoConfig));
  }
  spaces.push({ id: space.id, title: space.title, description: space.description, status: space.status, repos });
}

const output = { org: ORG, spaces, unassigned };
const outPath = new URL("../data/repos.json", import.meta.url);
await mkdir(dirname(fileURLToPath(outPath)), { recursive: true });
await writeFile(outPath, JSON.stringify(output, null, 2) + "\n");

for (const w of warnings) console.warn(`warning: ${w}`);
console.log(`Wrote ${fileURLToPath(outPath)} with ${spaces.reduce((n, s) => n + s.repos.length, 0)} repos`);
