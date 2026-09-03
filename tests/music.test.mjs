import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { storySequences } from "../app/curriculum.ts";
import { musicCues, storyMusic } from "../app/music-manifest.ts";
import { MIN_TRIGGER_STEP_SECONDS, safeTriggerTime } from "../app/music-timing.ts";

const require = createRequire(import.meta.url);
const { Midi } = require("@tonejs/midi");

test("late and simultaneous drum hits receive strictly increasing start times", () => {
  const now = 12;
  const first = safeTriggerTime(11.9, now, null);
  const simultaneous = safeTriggerTime(11.9, now, first);
  const later = safeTriggerTime(12.5, now, simultaneous);

  assert.equal(first, now + MIN_TRIGGER_STEP_SECONDS);
  assert.equal(simultaneous, first + MIN_TRIGGER_STEP_SECONDS);
  assert.equal(later, 12.5);
  assert.ok(first > now);
  assert.ok(simultaneous > first);
  assert.ok(later > simultaneous);
});

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
  assert.equal(storyMusic["the-hollow"], "title", "Opening story should continue the title music cue");
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

test("battle and victory assign chiptune marimba above chiptune timpani", async () => {
  for (const cueId of ["combat", "victory"]) {
    const cue = musicCues[cueId];
    const midi = new Midi(await readFile(`public${cue.url}`));
    const audibleTrackCount = midi.tracks.filter((track) => track.notes.length).length;

    assert.equal(cue.trackVoices.length, audibleTrackCount);
    assert.deepEqual(cue.trackVoices.slice(0, -1), Array(audibleTrackCount - 1).fill("marimba"));
    assert.equal(cue.trackVoices.at(-1), "timpani");
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

test("the victory cue is brief and self-contained", async () => {
  const midi = new Midi(await readFile(`public${musicCues.victory.url}`));
  assert.ok(midi.duration >= 4 && midi.duration <= 8);
});
