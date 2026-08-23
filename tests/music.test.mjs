import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { storySequences } from "../app/curriculum.ts";
import { musicCues, storyMusic } from "../app/music-manifest.ts";

const require = createRequire(import.meta.url);
const { Midi } = require("@tonejs/midi");

test("every game music cue is a populated, parseable MIDI file", async () => {
  for (const [id, cue] of Object.entries(musicCues)) {
    const midi = new Midi(await readFile(`public${cue.url}`));
    const noteCount = midi.tracks.reduce((total, track) => total + track.notes.length, 0);
    assert.ok(midi.tracks.length >= 3, `${id} should have a multi-voice arrangement`);
    assert.ok(noteCount >= 40, `${id} should contain a complete arrangement`);
    assert.ok(midi.duration > 4, `${id} should last longer than a sound effect`);
    if (cue.loop) {
      assert.ok(Math.abs(cue.loopSeconds - midi.duration) < 0.25, `${id} loop boundary should match its MIDI duration`);
    }
  }
});

test("music roles and story coverage stay complete", () => {
  assert.equal(musicCues.title.loop, true);
  assert.equal(musicCues.title.title, "Ave Verum Corpus · William Byrd");
  assert.equal(storyMusic["the-broken-axiom"], "title", "Opening story should continue the title music cue");
  assert.equal(musicCues.combat.loop, true);
  assert.equal(musicCues.combat.url, "/music/battle.mid");
  assert.equal(musicCues.victory.loop, false);
  assert.ok(Object.hasOwn(musicCues, "victory"));
  assert.ok(storySequences.length > 0);
  for (const story of storySequences) {
    assert.ok(storyMusic[story.id], `Story ${story.id} needs a music cue`);
    assert.ok(musicCues[storyMusic[story.id]], `Story ${story.id} references a missing music cue`);
  }
});

test("Ave Verum performs its repeat and loops at the Amen cutoff", async () => {
  const midi = new Midi(await readFile(`public${musicCues.title.url}`));
  const measureTicks = midi.header.ppq * 4;
  const firstRepeatStart = 28 * measureTicks;
  const firstRepeatEnd = 42 * measureTicks;
  const repeatedStart = 43 * measureTicks;

  assert.equal(midi.tracks.length, 4);
  for (const track of midi.tracks) {
    const firstPass = track.notes
      .filter((note) => note.ticks >= firstRepeatStart && note.ticks < firstRepeatEnd)
      .map((note) => [note.midi, note.ticks - firstRepeatStart, note.durationTicks]);
    const secondPass = track.notes
      .filter((note) => note.ticks >= repeatedStart && note.ticks < repeatedStart + firstRepeatEnd - firstRepeatStart)
      .map((note) => [note.midi, note.ticks - repeatedStart, note.durationTicks]);
    assert.deepEqual(secondPass, firstPass);
  }

  const finalMeasureStart = 57 * measureTicks;
  const [soprano, ...lowerVoices] = midi.tracks;
  assert.deepEqual(
    [soprano.notes.at(-1).name, soprano.notes.at(-1).ticks, soprano.notes.at(-1).durationTicks],
    ["G4", finalMeasureStart, measureTicks],
  );
  for (const voice of lowerVoices) {
    const finalNote = voice.notes.at(-1);
    assert.equal(finalNote.ticks, finalMeasureStart);
    assert.equal(finalNote.durationTicks, measureTicks / 2);
  }
  assert.equal(midi.durationTicks, 58 * measureTicks);
});

test("the victory fanfare is brief and self-contained", async () => {
  const midi = new Midi(await readFile(`public${musicCues.victory.url}`));
  assert.ok(midi.duration >= 4 && midi.duration <= 8);
});
