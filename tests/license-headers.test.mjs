// Copyright 2026 Adam Petcher (to the extent copyright subsists)
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import test from "node:test";

const HEADER_TEXT = "Copyright 2026 Adam Petcher (to the extent copyright subsists)";
const SPDX_TEXT = "SPDX-License-Identifier: Apache-2.0";
const SOURCE_EXTENSIONS = new Set([".css", ".lean", ".md", ".mjs", ".sh", ".svg", ".ts", ".tsx"]);
const EXCLUDED_FILES = new Set([
  "LICENSE",
  "NOTICE",
  "THIRD_PARTY_NOTICES.md",
  "next-env.d.ts",
  "public/assets/cc0_images/LICENSE.md",
  "public/music/LICENSE-COMBAT.md",
  "public/music/LICENSE-STORY.md",
  "public/legal/THIRD_PARTY_NOTICES.txt",
]);
const EXCLUDED_DIRECTORIES = new Set([".agents", ".codex", ".git", ".next", "cc0_images", "node_modules"]);

async function sourceFiles(directory = ".") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name).replace(/^\.\//, "");
    if (entry.isDirectory() && !EXCLUDED_DIRECTORIES.has(entry.name)) files.push(...await sourceFiles(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name)) && !EXCLUDED_FILES.has(path)) files.push(path);
  }
  return files;
}

test("every comment-capable source file has an Apache 2.0 license header", async () => {
  for (const path of await sourceFiles()) {
    const opening = (await readFile(path, "utf8")).slice(0, 300);
    assert.ok(opening.includes(HEADER_TEXT), `${path} should carry the copyright header`);
    assert.ok(opening.includes(SPDX_TEXT), `${path} should carry the Apache-2.0 SPDX header`);
  }
});

test("package metadata declares Apache 2.0", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
  assert.equal(packageJson.license, "Apache-2.0");
  assert.equal(packageLock.license, "Apache-2.0");
  assert.equal(packageLock.packages[""].license, "Apache-2.0");
});

test("deployed legal notices are present and third-party notices are current", async () => {
  assert.equal(await readFile("public/legal/APACHE-2.0.txt", "utf8"), await readFile("LICENSE", "utf8"));
  assert.equal(await readFile("public/legal/THIRD_PARTY_NOTICES.txt", "utf8"), await readFile("THIRD_PARTY_NOTICES.md", "utf8"));
  const notices = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  for (const component of ["Geist and Geist Mono", "next 16.2.6", "react 19.2.6", "react-dom 19.2.6", "tone 15.1.22", "@tonejs/midi 2.0.28", "sharp 0.34.5"]) {
    assert.ok(notices.includes(component), `third-party notices should include ${component}`);
  }
});
