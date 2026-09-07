// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { COMBAT_MUSIC } from "./combat-music-license.mjs";

const MUSIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../public/music");

function variableLength(value) {
  const bytes = [value & 0x7f];
  for (let remaining = value >> 7; remaining; remaining >>= 7) {
    bytes.unshift((remaining & 0x7f) | 0x80);
  }
  return Buffer.from(bytes);
}

function firstTrack(source) {
  const headerLength = source.readUInt32BE(4);
  const firstTrackOffset = 8 + headerLength;
  if (source.toString("ascii", 0, 4) !== "MThd" || source.toString("ascii", firstTrackOffset, firstTrackOffset + 4) !== "MTrk") {
    throw new Error("Expected a Standard MIDI file with an MTrk chunk after its header");
  }

  return {
    chunkOffset: firstTrackOffset,
    dataOffset: firstTrackOffset + 8,
    length: source.readUInt32BE(firstTrackOffset + 4),
  };
}

function metaTextEvent(type, text) {
  const bytes = Buffer.from(text, "ascii");
  return Buffer.concat([Buffer.from([0x00, 0xff, type]), variableLength(bytes.length), bytes]);
}

function verifyTitle(source, title) {
  if (!source.includes(metaTextEvent(0x03, title))) {
    throw new Error(`Expected MIDI title ${title}`);
  }
}

function embedCopyrightNotice(source, noticeText) {
  const noticeEvent = metaTextEvent(0x02, noticeText);
  if (source.includes(noticeEvent)) return source;

  const track = firstTrack(source);
  const updatedLength = Buffer.alloc(4);
  updatedLength.writeUInt32BE(track.length + noticeEvent.length);

  return Buffer.concat([
    source.subarray(0, track.chunkOffset + 4),
    updatedLength,
    noticeEvent,
    source.subarray(track.dataOffset),
  ]);
}

for (const [filename, metadata] of Object.entries(COMBAT_MUSIC)) {
  const path = resolve(MUSIC_DIR, filename);
  const source = await readFile(path);
  verifyTitle(source, metadata.title);
  await writeFile(path, embedCopyrightNotice(source, metadata.copyrightNotice));
}

console.log(`Normalized titles and embedded copyright notices in ${Object.keys(COMBAT_MUSIC).join(" and ")}`);
