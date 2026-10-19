// Builds data/contributors.json from the GitHub API: everyone who has contributed to the
// public repos of the org, merged across repos. Node 20+, no dependencies.
// Set GITHUB_TOKEN to raise the API rate limit.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ORG = "BioInfoCommunity";
const token = process.env.GITHUB_TOKEN;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // 204 means the repo has no commits yet, so there is nobody to list.
  if (res.status === 204) return [];
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

// Only public repos are read, so private work never reaches the page even with a token that can see it.
const orgRepos = await ghAll(`/orgs/${ORG}/repos?type=public`);
const repos = orgRepos.filter((r) => !r.fork && !ignored.has(r.name));

const byLogin = new Map();
for (const repo of repos) {
  const contributors = await ghAll(`/repos/${ORG}/${repo.name}/contributors`);
  for (const c of contributors) {
    // Bot accounts (such as dependabot or github-actions) are not community members.
    if (c.type === "Bot" || c.login.endsWith("[bot]")) continue;
    if (!byLogin.has(c.login)) {
      byLogin.set(c.login, {
        login: c.login,
        avatar_url: c.avatar_url,
        html_url: c.html_url,
        contributions: 0,
        repos: [],
      });
    }
    const person = byLogin.get(c.login);
    person.contributions += c.contributions;
    person.repos.push({ name: repo.name, contributions: c.contributions });
  }
}

const contributors = [...byLogin.values()]
  .map((p) => ({ ...p, repos: p.repos.sort((a, b) => b.contributions - a.contributions) }))
  .sort((a, b) => b.contributions - a.contributions || a.login.localeCompare(b.login));

const output = {
  org: ORG,
  generated: new Date().toISOString().slice(0, 10),
  repoCount: repos.length,
  repos: repos.map((r) => ({ name: r.name, html_url: r.html_url })),
  contributors,
};
const outPath = new URL("../data/contributors.json", import.meta.url);
await mkdir(dirname(fileURLToPath(outPath)), { recursive: true });
await writeFile(outPath, JSON.stringify(output, null, 2) + "\n");

console.log(`Wrote ${fileURLToPath(outPath)} with ${contributors.length} contributors across ${repos.length} repos`);
