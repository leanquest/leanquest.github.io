// Copyright 2026 Adam Petcher (to the extent copyright subsists)
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("static export renders LeanQuest", async () => {
  const html = await readFile(join(projectRoot, "out", "index.html"), "utf8");
  assert.match(html, /<title>LeanQuest — The Proof Dungeon<\/title>/i);
  assert.match(html, /ENTERING THE DUNGEON/);
  assert.match(html, /https:\/\/leanquest\.github\.io\/assets\/cc0_images\/og\.png/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
