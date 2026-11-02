import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Vercel runs ignoreCommand before each build: exit 0 skips the deployment, exit 1 builds it.
const SKIP = 0;
const BUILD = 1;
const { ignoreCommand } = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
// git reads no machine config, so these commits are unsigned and the branch name is fixed.
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" };
let repo = "";

const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, env }).toString().trim();
const commit = (files: Record<string, string | null>) => {
    for (const [path, body] of Object.entries(files)) {
        if (body === null) {
            git("rm", "-q", path);
            continue;
        }
        mkdirSync(dirname(join(repo, path)), { recursive: true });
        writeFileSync(join(repo, path), body);
        git("add", path);
    }
    git("commit", "-qm", Object.keys(files).join(" "));
    return git("rev-parse", "HEAD");
};
// The exit status for a build whose last deployment was `previous`; unset, as on a branch's first.
const decide = (previous?: string) =>
    spawnSync("sh", ["-c", ignoreCommand], {
        cwd: repo,
        env: previous ? { ...env, VERCEL_GIT_PREVIOUS_SHA: previous } : env,
    }).status;

before(() => {
    repo = mkdtempSync(join(tmpdir(), "vercel-ignore-"));
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    commit({ "app/page.tsx": "a", "README.md": "a", "docs/notes.md": "a" });
});
after(() => rmSync(repo, { recursive: true, force: true }));

test("a commit that changes only Markdown is skipped, at any depth", () => {
    commit({ "README.md": "b" });
    assert.equal(decide(), SKIP);
    commit({ "docs/notes.md": "b" });
    assert.equal(decide(), SKIP);
});

test("a commit that changes code builds", () => {
    commit({ "app/page.tsx": "b" });
    assert.equal(decide(), BUILD);
});

test("MDX is a page, so a .mdx change builds", () => {
    commit({ "app/post.mdx": "a" });
    assert.equal(decide(), BUILD);
});

test("code anywhere since the last deployment builds, even under a Markdown-only head", () => {
    const deployed = git("rev-parse", "HEAD");
    commit({ "app/page.tsx": "c" });
    commit({ "README.md": "c" });
    assert.equal(decide(deployed), BUILD);
});

test("only Markdown since the last deployment is skipped", () => {
    const deployed = git("rev-parse", "HEAD");
    commit({ "README.md": "d" });
    commit({ "docs/notes.md": "d" });
    assert.equal(decide(deployed), SKIP);
});

test("deleting only Markdown is skipped", () => {
    commit({ "docs/notes.md": null });
    assert.equal(decide(), SKIP);
});

test("a last deployment git cannot find builds rather than failing the step", () => {
    assert.equal(decide("0".repeat(40)), BUILD);
});

test("a change to vercel.json builds", () => {
    commit({ "vercel.json": "{}" });
    assert.equal(decide(), BUILD);
});
