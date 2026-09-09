// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import test from "node:test";

import { storySequences } from "../app/curriculum.ts";
import { CC0_IMAGE_COPYRIGHT_NOTICE, CC0_IMAGE_LICENSE_URL } from "../scripts/cc0-image-license.mjs";

const IMAGE_DIR = "public/assets/cc0_images";

async function pngFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await pngFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".png")) files.push(path);
  }
  return files;
}

async function imageFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await imageFiles(path));
    else if (entry.isFile() && /\.(?:png|svg)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function pngTextMetadata(source) {
  const metadata = new Map();
  let offset = 8;
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.toString("ascii", offset + 4, offset + 8);
    const data = source.subarray(offset + 8, offset + 8 + length);
    if (type === "tEXt") {
      const separator = data.indexOf(0);
      metadata.set(data.subarray(0, separator).toString("latin1"), data.subarray(separator + 1).toString("latin1"));
    }
    offset += 12 + length;
  }
  return metadata;
}

test("every CC0 PNG embeds the copyright and license notices", async () => {
  const files = await pngFiles(IMAGE_DIR);
  assert.ok(files.length > 0);
  for (const path of files) {
    const metadata = pngTextMetadata(await readFile(path));
    assert.equal(metadata.get("Copyright"), CC0_IMAGE_COPYRIGHT_NOTICE, path);
    assert.equal(metadata.get("License"), CC0_IMAGE_LICENSE_URL, path);
  }
});

test("the CC0 SVG favicon embeds the copyright and license notices", async () => {
  const source = await readFile(join(IMAGE_DIR, "favicon.svg"), "utf8");
  assert.ok(source.includes(CC0_IMAGE_COPYRIGHT_NOTICE));
  assert.ok(source.includes(CC0_IMAGE_LICENSE_URL));
});

test("the CC0 directory contains no unused artwork", async () => {
  const files = (await imageFiles(IMAGE_DIR)).map((path) => relative(IMAGE_DIR, path)).sort();
  const storyFiles = storySequences.flatMap((story) => story.panels.flatMap((panel) =>
    panel.layers.flatMap((layer) => layer.frames.map((frame) => frame.replace("/assets/cc0_images/", ""))),
  ));
  const usedFiles = Array.from(new Set([
    "classes-v2.png",
    "tower-background.png",
    "tower-torch.png",
    "favicon.svg",
    "hollow-marshal.png",
    "monsters-2.png",
    "monsters-3.png",
    "monsters.png",
    "og-v0.1.2.png",
    "title/infinite-stair-1.png",
    "title/infinite-stair-2.png",
    ...storyFiles,
  ])).sort();

  assert.deepEqual(files, usedFiles);
});
