import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STORY_MUSIC_COPYRIGHT_NOTICES } from "./story-music-license.mjs";

const MUSIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../public/music");

function variableLength(value) {
  const bytes = [value & 0x7f];
  for (let remaining = value >> 7; remaining; remaining >>= 7) {
    bytes.unshift((remaining & 0x7f) | 0x80);
  }
  return Buffer.from(bytes);
}

function embedCopyrightNotice(source, noticeText) {
  const headerLength = source.readUInt32BE(4);
  const firstTrackOffset = 8 + headerLength;
  if (source.toString("ascii", 0, 4) !== "MThd" || source.toString("ascii", firstTrackOffset, firstTrackOffset + 4) !== "MTrk") {
    throw new Error("Expected a Standard MIDI file with an MTrk chunk after its header");
  }

  const notice = Buffer.from(noticeText, "utf8");
  if (source.includes(notice)) return source;

  const trackLength = source.readUInt32BE(firstTrackOffset + 4);
  const trackDataOffset = firstTrackOffset + 8;
  const event = Buffer.concat([
    Buffer.from([0x00, 0xff, 0x02]),
    variableLength(notice.length),
    notice,
  ]);
  const updatedLength = Buffer.alloc(4);
  updatedLength.writeUInt32BE(trackLength + event.length);

  return Buffer.concat([
    source.subarray(0, firstTrackOffset + 4),
    updatedLength,
    event,
    source.subarray(trackDataOffset),
  ]);
}

for (const [filename, notice] of Object.entries(STORY_MUSIC_COPYRIGHT_NOTICES)) {
  const path = resolve(MUSIC_DIR, filename);
  const source = await readFile(path);
  await writeFile(path, embedCopyrightNotice(source, notice));
}

console.log(`Embedded public-domain and CC0 notices in ${Object.keys(STORY_MUSIC_COPYRIGHT_NOTICES).join(", ")}`);
