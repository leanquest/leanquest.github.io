// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CC0_IMAGE_COPYRIGHT_NOTICE, CC0_IMAGE_LICENSE_URL } from "./cc0-image-license.mjs";

const IMAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../public/assets/cc0_images");
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MANAGED_KEYWORDS = new Set(["Copyright", "License"]);

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function textChunk(keyword, text) {
  return pngChunk("tEXt", Buffer.from(`${keyword}\0${text}`, "latin1"));
}

function embedLicense(source) {
  if (!source.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("Expected a PNG image");
  }

  const chunks = [];
  let offset = PNG_SIGNATURE.length;
  let foundEnd = false;
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > source.length) throw new Error("Invalid PNG chunk length");

    const type = source.toString("ascii", offset + 4, offset + 8);
    const data = source.subarray(offset + 8, offset + 8 + length);
    const keyword = type === "tEXt" ? data.subarray(0, data.indexOf(0)).toString("latin1") : "";
    if (!MANAGED_KEYWORDS.has(keyword)) chunks.push(source.subarray(offset, end));

    offset = end;
    if (type === "IEND") {
      foundEnd = true;
      break;
    }
  }
  if (!foundEnd) throw new Error("PNG image has no IEND chunk");

  const endChunk = chunks.pop();
  return Buffer.concat([
    PNG_SIGNATURE,
    ...chunks,
    textChunk("Copyright", CC0_IMAGE_COPYRIGHT_NOTICE),
    textChunk("License", CC0_IMAGE_LICENSE_URL),
    endChunk,
  ]);
}

async function pngFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await pngFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".png")) files.push(path);
  }
  return files;
}

const files = await pngFiles(IMAGE_DIR);
for (const path of files) await writeFile(path, embedLicense(await readFile(path)));
console.log(`Embedded CC0 metadata in ${files.length} PNG images`);
