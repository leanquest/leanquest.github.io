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

// William Byrd's composition is public domain; IMSLP #232546 is the reference
// public-domain score. Note data was checked against Monique Rio's CC BY 4.0
// St Cecilia Press edition. This adaptation changes the ending and form: it
// follows the score's repeat: measures 1-43, 29-42, then the second ending.
// The Amen is omitted; SATB resolve on the first half of the final measure,
// with soprano sustaining alone until the loop restarts on the next downbeat.
const AVE_VERUM_VOICES = {
  soprano: [
    [67,0,4], [66,4,2], [69,6,3], [67,9,1], [66,10,1], [67,11,1.5], [66,12.5,0.25], [64,12.75,0.25],
    [66,13,1], [67,14,2], [69,16,2], [70,18,2], [72,20,1], [72,21,1], [74,22,3], [72,25,1],
    [70,26,1.5], [70,27.5,0.5], [69,28,2], [67,31,2], [65,33,1], [63,34,2], [62,36,2], [65,39,2],
    [67,41,1], [69,42,2], [69,44,2], [67,47,1], [70,48,2], [69,50,3], [70,53,1], [67,54,1.5],
    [67,55.5,0.5], [66,56,2], [67,59,2], [67,61,1], [69,62,2], [67,64,1], [70,65,1.5], [69,66.5,0.5],
    [69,67,2], [67,69,1], [69,70,2], [72,72,2], [70,74,1], [69,75,2], [67,77,1], [65,78,1.5],
    [65,79.5,0.5], [65,80,1], [65,81,2], [65,83,1], [65,84,2], [67,87,2], [67,89,1], [67,90,2],
    [67,92,1], [69,93,2], [69,95,1], [70,96,2], [69,98,1], [69,99,1], [72,100,3], [70,103,2],
    [69,105,2], [70,107,2], [69,109,1], [70,110,1], [65,111,1], [70,112,2], [67,114,2], [67,117,1],
    [70,118,2], [69,120,2], [67,123,1], [74,124,3], [72,127,2], [70,129,2], [69,131,0.5], [67,131.5,0.5],
    [69,132,1], [69,133,1], [70,134,1.5], [69,135.5,0.5], [67,136,2], [66,138,2], [67,146,1.5], [70,147.5,0.5],
    [69,148,1], [67,149,1], [66,150,2], [67,152,1], [69,156,1.5], [72,157.5,0.5], [70,158,1], [69,159,1],
    [69,160,1], [67,161,1], [66,162,1], [69,163,1.5], [67,164.5,0.5], [67,165,2], [66,167,1], [67,168,2],
    [62,171,1], [70,172,2], [67,174,2], [67,177,1], [70,178,2], [69,180,2], [67,183,1], [74,184,3],
    [72,187,2], [70,189,2], [69,191,0.5], [67,191.5,0.5], [69,192,1], [69,193,1], [70,194,1.5], [69,195.5,0.5],
    [67,196,2], [66,198,2], [67,206,1.5], [70,207.5,0.5], [69,208,1], [67,209,1], [66,210,2], [67,212,1],
    [69,216,1.5], [72,217.5,0.5], [70,218,1], [69,219,1], [69,220,1], [67,221,1], [66,222,1], [69,223,1.5],
    [67,224.5,0.5], [67,225,2], [66,227,1], [67,228,4],
  ],
  alto: [
    [62,0,4], [62,4,2], [60,6,3], [60,9,1], [62,10,4], [62,14,2], [65,16,2], [65,18,2],
    [65,20,1], [65,21,1], [65,22,3], [65,25,1], [62,26,1.5], [62,27.5,0.5], [62,28,2], [58,31,2],
    [58,33,1], [58,34,2], [58,36,2], [62,38,3], [64,41,1], [65,42,4], [60,46,2], [58,49,1],
    [65,50,1.5], [65,51.5,0.5], [60,52,1], [62,53,2], [60,55,1], [62,56,2], [64,59,2], [64,61,1],
    [65,62,2], [64,64,1], [65,65,2], [64,67,1], [65,68,1], [64,69,0.5], [62,69.5,0.5], [60,70,1],
    [65,71,2], [63,73,1], [62,74,2], [60,76,2], [62,78,1.5], [62,79.5,0.5], [62,80,2], [60,82,1.5],
    [60,83.5,0.5], [62,84,2], [63,87,2], [63,89,1], [62,90,2], [64,92,1], [65,93,2], [65,95,1],
    [65,96,2], [65,98,1], [65,99,1], [67,100,2], [67,102,1], [58,103,1], [65,104,2], [65,106,1],
    [65,107,1], [65,108,1.5], [63,109.5,0.5], [62,110,2], [62,113,1], [63,114,2], [62,116,2], [62,119,1],
    [62,120,2], [59,122,2], [58,125,1], [65,126,2], [63,128,1], [62,129,2], [60,131,1], [53,133,1],
    [58,134,3], [57,137,0.5], [55,137.5,0.5], [57,138,2], [58,140,1.5], [62,141.5,0.5], [60,142,1], [58,143,1],
    [57,144,2], [58,146,2], [60,148,1.5], [63,149.5,0.5], [62,150,1], [57,151,1], [62,152,1.5], [65,153.5,0.5],
    [63,154,1], [62,155,1], [60,156,1], [57,157,1], [62,158,1.5], [60,159.5,0.5], [57,160,1], [58,161,0.5],
    [60,161.5,0.5], [62,162,1], [63,163,1], [62,164,1], [60,165,1], [62,166,2], [59,168,4], [62,173,1],
    [63,174,2], [62,176,2], [62,179,1], [62,180,2], [59,182,2], [58,185,1], [65,186,2], [63,188,1],
    [62,189,2], [60,191,1], [53,193,1], [58,194,3], [57,197,0.5], [55,197.5,0.5], [57,198,2], [58,200,1.5],
    [62,201.5,0.5], [60,202,1], [58,203,1], [57,204,2], [58,206,2], [60,208,1.5], [63,209.5,0.5], [62,210,1],
    [57,211,1], [62,212,1.5], [65,213.5,0.5], [63,214,1], [62,215,1], [60,216,1], [57,217,1], [62,218,1.5],
    [60,219.5,0.5], [57,220,1], [58,221,0.5], [60,221.5,0.5], [62,222,1], [63,223,1], [62,224,1], [60,225,1],
    [62,226,2], [59,228,2],
  ],
  tenor: [
    [58,0,4], [57,4,4], [57,8,3], [55,11,1], [57,12,2], [59,14,2], [60,16,2], [62,18,2],
    [53,20,1], [53,21,1], [58,22,3], [57,25,1], [55,26,1.5], [55,27.5,0.5], [54,28,2], [55,31,0.5],
    [57,31.5,0.5], [58,32,1], [53,33,1], [55,34,2], [53,36,2], [58,38,2], [53,40,1], [60,41,2],
    [53,43,1], [60,45,1], [63,46,3], [62,49,2], [60,51,1], [65,52,1.5], [53,53.5,0.5], [55,54,1],
    [55,55,1], [57,56,2], [60,59,2], [60,61,1], [60,62,2], [60,64,1], [62,65,2], [60,67,1],
    [58,68,2], [57,70,2], [60,77,2], [58,79,1], [57,80,0.75], [53,80.75,0.25], [58,81,2], [57,83,1],
    [58,84,2], [58,87,1], [55,88,1], [60,89,2], [59,91,1], [60,92,2], [57,94,1], [57,95,1],
    [62,96,2], [60,98,1], [60,99,1], [63,100,3], [62,103,2], [60,105,1], [62,106,1], [60,107,0.5],
    [58,107.5,0.5], [60,108,1], [60,109,1], [58,110,2], [58,113,1], [60,114,2], [59,116,2], [55,119,1],
    [54,120,2], [55,122,4], [58,129,1], [65,130,1.5], [63,131.5,0.5], [62,132,1], [60,133,1], [62,134,1],
    [62,135,2], [60,137,1], [62,138,2], [55,140,1.5], [58,141.5,0.5], [57,142,1], [55,143,1], [54,144,2],
    [55,146,2], [57,150,1.5], [60,151.5,0.5], [58,152,1], [57,153,1.5], [55,154.5,0.5], [55,155,2], [54,157,1],
    [55,158,1], [54,159,2], [55,161,1], [57,162,1.5], [60,163.5,0.5], [58,164,1], [57,165,0.5], [55,165.5,0.5],
    [57,166,2], [55,168,4], [58,173,1], [60,174,2], [59,176,2], [55,179,1], [54,180,2], [55,182,4],
    [58,189,1], [65,190,1.5], [63,191.5,0.5], [62,192,1], [60,193,1], [62,194,1], [62,195,2], [60,197,1],
    [62,198,2], [55,200,1.5], [58,201.5,0.5], [57,202,1], [55,203,1], [54,204,2], [55,206,2], [57,210,1.5],
    [60,211.5,0.5], [58,212,1], [57,213,1.5], [55,214.5,0.5], [55,215,2], [54,217,1], [55,218,1], [54,219,2],
    [55,221,1], [57,222,1.5], [60,223.5,0.5], [58,224,1], [57,225,0.5], [55,225.5,0.5], [57,226,2], [55,228,2],
  ],
  bass: [
    [55,0,4], [50,4,2], [53,6,3], [51,9,1], [50,10,4], [55,14,2], [53,16,2], [46,18,1],
    [58,19,2], [57,21,1], [58,22,1], [46,23,1], [53,24,1.5], [51,25.5,0.25], [53,25.75,0.25], [55,26,1],
    [43,27,1], [50,28,2], [51,31,2], [50,33,1], [51,34,2], [46,36,3], [50,39,2], [48,41,1],
    [53,42,2], [41,44,2], [48,47,1], [55,48,2], [53,50,3], [46,53,1], [51,54,1.5], [51,55.5,0.5],
    [50,56,2], [48,59,2], [48,61,1], [53,62,2], [48,64,1], [46,65,2], [48,67,1], [50,68,1],
    [52,69,1], [53,70,2], [53,75,2], [51,77,1], [50,78,3], [46,81,1], [53,82,1.5], [53,83.5,0.5],
    [46,84,2], [51,87,2], [48,89,1], [55,90,2], [48,92,1], [53,93,2], [50,95,1], [46,96,2],
    [53,98,2], [48,101,1], [55,102,2], [53,104,1], [53,105,1], [53,106,3], [53,109,1], [46,110,2],
    [43,113,1], [48,114,2], [43,116,2], [43,119,1], [50,120,2], [43,122,1], [55,123,1], [58,124,3],
    [57,127,1], [55,128,2], [53,130,2], [53,132,2], [55,134,1.5], [53,135.5,0.5], [51,136,2], [50,138,2],
    [50,144,1.5], [53,145.5,0.5], [51,146,1.5], [50,147.5,0.5], [48,148,2], [50,150,2], [43,152,1], [50,153,1],
    [48,154,1], [46,155,1], [45,156,2], [43,158,1], [50,159,1.5], [53,160.5,0.5], [51,161,1], [50,162,1],
    [48,163,1], [50,164,1], [51,165,1], [50,166,2], [43,168,4], [43,173,1], [48,174,2], [43,176,2],
    [43,179,1], [50,180,2], [43,182,1], [55,183,1], [58,184,3], [57,187,1], [55,188,2], [53,190,2],
    [53,192,2], [55,194,1.5], [53,195.5,0.5], [51,196,2], [50,198,2], [50,204,1.5], [53,205.5,0.5], [51,206,1.5],
    [50,207.5,0.5], [48,208,2], [50,210,2], [43,212,1], [50,213,1], [48,214,1], [46,215,1], [45,216,2],
    [43,218,1], [50,219,1.5], [53,220.5,0.5], [51,221,1], [50,222,1], [48,223,1], [50,224,1], [51,225,1],
    [50,226,2], [43,228,2],
  ],
};

function titleTheme() {
  const soprano = track("breath_lead", 0, 52);
  const alto = track("warm_harmony", 1, 52);
  const tenor = track("warm_harmony", 2, 52);
  const bass = track("triangle_bass", 3, 53);
  const voices = [soprano, alto, tenor, bass];
  const score = [AVE_VERUM_VOICES.soprano, AVE_VERUM_VOICES.alto, AVE_VERUM_VOICES.tenor, AVE_VERUM_VOICES.bass];

  score.forEach((part, voiceIndex) => {
    const velocity = [0.52, 0.42, 0.4, 0.46][voiceIndex];
    part.forEach(([midi, start, duration]) => note(voices[voiceIndex], midi, start, duration, velocity));
  });

  return {
    filename: "title.mid",
    tempo: 76,
    title: "Ave Verum Corpus · William Byrd",
    tracks: voices,
  };
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

const songs = [titleTheme(), combatTheme(), brokenAxiomTheme(), hallOfNamesTheme()];
await mkdir(OUTPUT_DIR, { recursive: true });
await Promise.all(songs.map((song) => writeFile(resolve(OUTPUT_DIR, song.filename), encodeMidi(song))));
console.log(`Generated ${songs.length} MIDI tracks in ${OUTPUT_DIR}`);
