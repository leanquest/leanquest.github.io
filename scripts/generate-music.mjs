import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TICKS_PER_BEAT = 480;
const OUTPUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../public/music");
const PITCH_CLASSES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitch(note) {
  if (typeof note === "number") return note;
  const match = note.match(/^([A-G])([#b]?)(-?\d)$/);
  if (!match) throw new Error(`Invalid note ${note}`);
  const accidental = match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0;
  return (Number(match[3]) + 1) * 12 + PITCH_CLASSES[match[1]] + accidental;
}

function track(name, channel, program = 0) {
  return { name, channel, program, notes: [] };
}

function note(target, value, start, duration, velocity = 0.72) {
  target.notes.push({ pitch: pitch(value), start, duration, velocity });
}

function chord(target, values, start, duration, velocity = 0.48) {
  values.forEach((value) => note(target, value, start, duration, velocity));
}

function phrase(target, start, values, velocity = 0.72) {
  let cursor = start;
  for (const [value, duration] of values) {
    if (value !== null) note(target, value, cursor, duration * 0.9, velocity);
    cursor += duration;
  }
}

function drums(target, bars, { driving = false, sparse = false } = {}) {
  for (let bar = 0; bar < bars; bar += 1) {
    const beat = bar * 4;
    note(target, 36, beat, 0.18, sparse ? 0.38 : 0.7);
    if (!sparse || bar % 2 === 1) note(target, 38, beat + 2, 0.16, sparse ? 0.3 : 0.58);
    const step = driving ? 0.5 : 1;
    for (let offset = step; offset < 4; offset += step) {
      note(target, offset % 1 === 0 ? 42 : 44, beat + offset, 0.08, driving ? 0.34 : 0.2);
    }
    if (driving) {
      note(target, 36, beat + 1.5, 0.14, 0.48);
      note(target, 36, beat + 3, 0.14, 0.55);
      note(target, 38, beat + 3.5, 0.12, 0.34);
    }
  }
}

function titleTheme() {
  const lead = track("pulse_lead", 0, 80);
  const harmony = track("warm_harmony", 1, 89);
  const bass = track("triangle_bass", 2, 38);
  const arp = track("square_arp", 3, 81);
  const bell = track("crystal_bell", 4, 10);
  const kit = track("pixel_drums", 9, 0);
  const progression = [
    ["D3", ["D4", "F4", "A4"]], ["Bb2", ["Bb3", "D4", "F4"]],
    ["F3", ["F4", "A4", "C5"]], ["C3", ["C4", "E4", "G4"]],
    ["D3", ["D4", "F4", "A4"]], ["G2", ["G3", "Bb3", "D4"]],
    ["Bb2", ["Bb3", "D4", "F4"]], ["A2", ["A3", "C#4", "E4"]],
    ["D3", ["D4", "F4", "A4"]], ["C3", ["C4", "E4", "G4"]],
    ["Bb2", ["Bb3", "D4", "F4"]], ["F3", ["F4", "A4", "C5"]],
    ["G2", ["G3", "Bb3", "D4"]], ["Bb2", ["Bb3", "D4", "F4"]],
    ["A2", ["A3", "C#4", "E4"]], ["D3", ["D4", "F4", "A4"]],
  ];
  progression.forEach(([root, tones], bar) => {
    const start = bar * 4;
    chord(harmony, tones, start, 3.7, 0.34);
    note(bass, root, start, 1.8, 0.54);
    note(bass, pitch(tones[2]) - 12, start + 2, 1.7, 0.42);
    const arpeggio = [...tones, tones[1], tones[2], tones[1], tones[0], tones[1]];
    arpeggio.forEach((tone, index) => note(arp, tone, start + index * 0.5, 0.38, 0.22));
  });
  phrase(lead, 0, [["A4", 1], ["D5", 1.5], ["C5", 0.5], ["A4", 1], ["F4", 1], ["G4", 1], ["A4", 2], [null, 1], ["F4", 1], ["D4", 1], ["F4", 1], ["A4", 2], ["G4", 1], ["E4", 1], ["D4", 2]], 0.66);
  phrase(lead, 16, [["A4", 1], ["Bb4", 1], ["D5", 2], ["C5", 1], ["A4", 1], ["G4", 2], ["F4", 1], ["G4", 1], ["Bb4", 1], ["A4", 1], ["E5", 2], ["D5", 2]], 0.7);
  phrase(lead, 32, [["F5", 1.5], ["E5", 0.5], ["D5", 1], ["A4", 1], ["C5", 2], ["A4", 1], ["F4", 1], ["G4", 1], ["A4", 1], ["D5", 2], ["C5", 1], ["A4", 1], ["F4", 2]], 0.68);
  phrase(lead, 48, [["G4", 1], ["Bb4", 1], ["D5", 1], ["F5", 1], ["E5", 1], ["D5", 1], ["C#5", 2], ["A4", 1], ["C#5", 1], ["E5", 1], ["G5", 1], ["F5", 1], ["E5", 1], ["D5", 2]], 0.72);
  [0, 16, 32, 48].forEach((start) => chord(bell, ["D5", "A5"], start, 1.2, 0.22));
  drums(kit, 16, { sparse: true });
  return { filename: "title.mid", tempo: 88, title: "Lanterns Above the Proof", tracks: [lead, harmony, bass, arp, bell, kit] };
}

function combatTheme() {
  const lead = track("pulse_lead", 0, 81);
  const harmony = track("dark_harmony", 1, 89);
  const bass = track("triangle_bass", 2, 38);
  const arp = track("square_arp", 3, 80);
  const bell = track("crystal_bell", 4, 10);
  const kit = track("pixel_drums", 9, 0);
  const progression = [
    ["D3", ["D4", "F4", "A4"]], ["Bb2", ["Bb3", "D4", "F4"]],
    ["G2", ["G3", "Bb3", "D4"]], ["A2", ["A3", "C#4", "E4"]],
    ["D3", ["D4", "F4", "A4"]], ["Eb3", ["Eb4", "G4", "Bb4"]],
    ["Bb2", ["Bb3", "D4", "F4"]], ["A2", ["A3", "C#4", "E4"]],
    ["D3", ["D4", "F4", "A4"]], ["C3", ["C4", "Eb4", "G4"]],
    ["Bb2", ["Bb3", "D4", "F4"]], ["G2", ["G3", "Bb3", "D4"]],
    ["Eb3", ["Eb4", "G4", "Bb4"]], ["Bb2", ["Bb3", "D4", "F4"]],
    ["A2", ["A3", "C#4", "E4"]], ["D3", ["D4", "F4", "A4"]],
  ];
  progression.forEach(([root, tones], bar) => {
    const start = bar * 4;
    chord(harmony, tones, start, 3.75, 0.32);
    const lowRoot = pitch(root) - 12;
    const lowFifth = pitch(tones[2]) - 24;
    [lowRoot, lowRoot, lowFifth, lowRoot, lowRoot, lowFifth, lowRoot, lowFifth].forEach((tone, index) =>
      note(bass, tone, start + index * 0.5, 0.38, index === 0 || index === 4 ? 0.62 : 0.43));
    const arpeggio = [...tones, tones[1], tones[2], tones[1], tones[0], tones[1]];
    arpeggio.forEach((tone, index) => note(arp, tone, start + index * 0.5, 0.36, 0.2));
  });
  phrase(lead, 0, [["F5", 0.5], ["E5", 0.5], ["D5", 1], [null, 1], ["C5", 0.5], ["Db5", 0.5], ["A4", 1], [null, 1], ["F5", 0.5], ["E5", 0.5], ["D5", 2], ["C5", 1], ["Bb4", 1], ["A4", 2], [null, 3]], 0.62);
  phrase(lead, 16, [["A4", 0.5], ["Bb4", 0.5], ["C#5", 1], ["D5", 0.5], ["C#5", 0.5], ["A4", 1], [null, 1], ["E5", 0.5], ["F5", 0.5], ["G5", 1], ["F5", 0.5], ["E5", 0.5], ["C#5", 1], ["D5", 2], ["C#5", 1], ["D5", 2], [null, 2]], 0.64);
  phrase(lead, 32, [["Ab5", 0.5], ["G5", 0.5], ["F5", 1], ["D5", 1], [null, 1], ["Eb5", 0.5], ["D5", 0.5], ["Bb4", 1], [null, 1], ["G5", 0.5], ["F5", 0.5], ["D5", 2], ["Db5", 1], ["Bb4", 1], ["A4", 2], [null, 2]], 0.63);
  phrase(lead, 48, [["Bb4", 0.5], ["D5", 0.5], ["Eb5", 1], ["G5", 0.5], ["F5", 0.5], ["D5", 1], [null, 1], ["C#5", 0.5], ["E5", 0.5], ["G5", 1], ["Bb5", 0.5], ["A5", 0.5], ["E5", 1], ["F5", 1], ["E5", 1], ["C#5", 1], ["D5", 2], [null, 2]], 0.66);
  [0, 16, 32, 48].forEach((start) => chord(bell, ["D5", "A5"], start, 1.1, 0.18));
  drums(kit, 16, { sparse: true });
  return { filename: "combat.mid", tempo: 104, title: "Theorem Under Siege", tracks: [lead, harmony, bass, arp, bell, kit] };
}

function victoryTheme() {
  const lead = track("fanfare_lead", 0, 81);
  const brass = track("fm_brass", 1, 62);
  const bass = track("triangle_bass", 2, 38);
  const bell = track("crystal_bell", 3, 10);
  const kit = track("pixel_drums", 9, 0);
  phrase(lead, 0, [["G4", 0.5], ["C5", 0.5], ["E5", 0.5], ["G5", 1.5], ["E5", 0.5], ["A5", 1.5], ["G5", 0.5], ["C6", 2], ["B5", 0.5], ["A5", 0.5], ["G5", 1], ["E5", 1], ["F5", 1], ["G5", 1], ["C6", 4]], 0.88);
  [[0, ["C4", "E4", "G4"]], [4, ["F4", "A4", "C5"]], [8, ["G4", "B4", "D5"]], [12, ["C4", "E4", "G4", "C5"]]].forEach(([start, tones]) => chord(brass, tones, start, start === 12 ? 4 : 3.6, 0.58));
  [[0, "C2"], [4, "F2"], [8, "G2"], [12, "C2"]].forEach(([start, value]) => {
    note(bass, value, start, 1.8, 0.7);
    note(bass, value, start + 2, 1.8, 0.56);
  });
  [2, 6, 10, 12, 13, 14].forEach((start) => note(kit, start >= 12 ? 49 : 38, start, 0.16, 0.7));
  [0, 4, 8, 12].forEach((start) => note(kit, 36, start, 0.18, 0.78));
  chord(bell, ["C6", "E6", "G6"], 12, 3.8, 0.42);
  return { filename: "victory.mid", tempo: 150, title: "Q.E.D. Fanfare", tracks: [lead, brass, bass, bell, kit] };
}

function brokenAxiomTheme() {
  const lead = track("breath_lead", 0, 75);
  const harmony = track("dark_harmony", 1, 89);
  const bass = track("triangle_bass", 2, 38);
  const bell = track("crystal_bell", 3, 10);
  const arp = track("square_arp", 4, 80);
  const progression = [
    ["D2", ["D3", "F3", "A3"]], ["C2", ["C3", "E3", "G3"]],
    ["Bb1", ["Bb2", "D3", "F3"]], ["A1", ["A2", "C#3", "E3"]],
    ["D2", ["D3", "F3", "A3"]], ["F2", ["F3", "A3", "C4"]],
    ["Eb2", ["Eb3", "G3", "Bb3"]], ["A1", ["A2", "C#3", "E3"]],
    ["G2", ["G3", "Bb3", "D4"]], ["D2", ["D3", "F3", "A3"]],
    ["Bb1", ["Bb2", "D3", "F3"]], ["C2", ["C3", "E3", "G3"]],
    ["D2", ["D3", "F3", "A3"]], ["Eb2", ["Eb3", "G3", "Bb3"]],
    ["A1", ["A2", "C#3", "E3"]], ["D2", ["D3", "F3", "A3"]],
  ];
  progression.forEach(([root, tones], bar) => {
    const start = bar * 4;
    chord(harmony, tones, start, 3.85, 0.25);
    note(bass, root, start, 3.6, 0.38);
    if (bar >= 4) {
      [tones[0], tones[2], tones[1], tones[2]].forEach((tone, index) => note(arp, tone, start + index, 0.6, 0.14));
    }
  });
  phrase(lead, 0, [["D5", 2], ["A4", 1], ["C5", 1], ["Bb4", 2], ["F4", 2], ["E4", 1], ["G4", 1], ["A4", 2], [null, 2], ["C#5", 2]], 0.46);
  phrase(lead, 16, [["D5", 1], ["F5", 2], ["E5", 1], ["C5", 2], ["A4", 2], ["Bb4", 1], ["D5", 1], ["Eb5", 2], ["C#5", 2], ["A4", 2]], 0.5);
  phrase(lead, 32, [["G4", 2], ["Bb4", 1], ["D5", 1], ["A4", 2], ["F4", 2], ["Bb4", 2], ["C5", 1], ["D5", 1], ["F5", 2], ["E5", 2]], 0.48);
  phrase(lead, 48, [["D5", 1], ["Eb5", 1], ["F5", 2], ["C#5", 2], ["A4", 2], ["C#5", 1], ["E5", 1], ["D5", 4], [null, 4]], 0.52);
  [0, 15, 31, 47, 60].forEach((start, index) => chord(bell, index === 4 ? ["D5", "A5"] : ["A5", "D6"], start, 1.4, 0.2));
  return { filename: "story-broken-axiom.mid", tempo: 70, title: "Fracture in the First Theorem", tracks: [lead, harmony, bass, bell, arp] };
}

function hallOfNamesTheme() {
  const lead = track("breath_lead", 0, 75);
  const harmony = track("warm_harmony", 1, 89);
  const bass = track("triangle_bass", 2, 38);
  const arp = track("square_arp", 3, 80);
  const bell = track("crystal_bell", 4, 10);
  const progression = [
    ["A2", ["A3", "C4", "E4"]], ["D2", ["D3", "F#3", "A3"]],
    ["G2", ["G3", "B3", "D4"]], ["E2", ["E3", "G3", "B3"]],
    ["A2", ["A3", "C4", "E4"]], ["C3", ["C4", "E4", "G4"]],
    ["D2", ["D3", "F#3", "A3"]], ["E2", ["E3", "G3", "B3"]],
    ["F#2", ["F#3", "A3", "C4"]], ["G2", ["G3", "B3", "D4"]],
    ["E2", ["E3", "G3", "B3"]], ["A2", ["A3", "C4", "E4"]],
  ];
  progression.forEach(([root, tones], bar) => {
    const start = bar * 4;
    chord(harmony, tones, start, 3.8, 0.22);
    note(bass, root, start, 1.7, 0.4);
    note(bass, pitch(tones[2]) - 12, start + 2, 1.6, 0.3);
    const pattern = [tones[0], tones[1], tones[2], tones[1], tones[0], tones[2], tones[1], tones[2]];
    pattern.forEach((tone, index) => note(arp, tone, start + index * 0.5, 0.32, 0.2));
  });
  phrase(lead, 0, [["E5", 1], ["A5", 2], ["G5", 1], ["F#5", 2], ["E5", 1], ["D5", 1], ["B4", 2], ["D5", 2], ["E5", 2], [null, 2]], 0.5);
  phrase(lead, 16, [["C5", 1], ["E5", 1], ["A5", 2], ["G5", 1], ["E5", 1], ["D5", 2], ["F#5", 1], ["A5", 1], ["B5", 2], ["G5", 2], ["E5", 2]], 0.54);
  phrase(lead, 32, [["F#5", 1], ["A5", 1], ["C6", 2], ["B5", 1], ["G5", 1], ["E5", 2], ["D5", 1], ["F#5", 1], ["E5", 2], ["C5", 2], ["A4", 2]], 0.52);
  [0, 12, 24, 36, 44].forEach((start) => note(bell, "A5", start, 1.1, 0.2));
  return { filename: "story-hall-of-names.mid", tempo: 82, title: "Names Without End", tracks: [lead, harmony, bass, arp, bell] };
}

function variableLength(value) {
  const bytes = [value & 0x7f];
  for (let remaining = value >> 7; remaining; remaining >>= 7) {
    bytes.unshift((remaining & 0x7f) | 0x80);
  }
  return bytes;
}

function textEvent(type, text) {
  const bytes = Buffer.from(text, "utf8");
  return [0xff, type, ...variableLength(bytes.length), ...bytes];
}

function chunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32BE(data.length, 4);
  return Buffer.concat([header, Buffer.from(data)]);
}

function encodeTrack(source) {
  const events = [
    { tick: 0, order: 0, bytes: textEvent(0x03, source.name) },
    { tick: 0, order: 1, bytes: [0xc0 | source.channel, source.program] },
  ];
  for (const entry of source.notes) {
    const start = Math.round(entry.start * TICKS_PER_BEAT);
    const end = Math.round((entry.start + entry.duration) * TICKS_PER_BEAT);
    const velocity = Math.max(1, Math.min(127, Math.round(entry.velocity * 127)));
    events.push({ tick: start, order: 2, bytes: [0x90 | source.channel, entry.pitch, velocity] });
    events.push({ tick: end, order: 1, bytes: [0x80 | source.channel, entry.pitch, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const bytes = [];
  let previousTick = 0;
  for (const event of events) {
    bytes.push(...variableLength(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  }
  bytes.push(0, 0xff, 0x2f, 0);
  return chunk("MTrk", bytes);
}

function encodeMidi(song) {
  const microseconds = Math.round(60_000_000 / song.tempo);
  const tempoTrack = [
    0, ...textEvent(0x03, song.title),
    0, 0xff, 0x51, 3, (microseconds >> 16) & 0xff, (microseconds >> 8) & 0xff, microseconds & 0xff,
    0, 0xff, 0x58, 4, 4, 2, 24, 8,
    0, 0xff, 0x2f, 0,
  ];
  const header = Buffer.alloc(14);
  header.write("MThd", 0, 4, "ascii");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(1, 8);
  header.writeUInt16BE(song.tracks.length + 1, 10);
  header.writeUInt16BE(TICKS_PER_BEAT, 12);
  return Buffer.concat([header, chunk("MTrk", tempoTrack), ...song.tracks.map(encodeTrack)]);
}

const songs = [titleTheme(), combatTheme(), victoryTheme(), brokenAxiomTheme(), hallOfNamesTheme()];
await mkdir(OUTPUT_DIR, { recursive: true });
await Promise.all(songs.map((song) => writeFile(resolve(OUTPUT_DIR, song.filename), encodeMidi(song))));
console.log(`Generated ${songs.length} original MIDI tracks in ${OUTPUT_DIR}`);
