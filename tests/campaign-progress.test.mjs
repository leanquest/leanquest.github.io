// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import test from "node:test";

import { canSelectHero, destinationFromTitle } from "../app/campaign-progress.ts";

test("Apprentice is always selectable", () => {
  assert.equal(canSelectHero("apprentice", { apprentice: [], champion: [] }, 55), true);
});

test("Champion stays locked until the final Apprentice level is complete", () => {
  const completed = { apprentice: Array.from({ length: 54 }, (_, index) => index + 1), champion: [] };
  assert.equal(canSelectHero("champion", completed, 55), false);
});

test("completing the final Apprentice level unlocks Champion", () => {
  assert.equal(canSelectHero("champion", { apprentice: [55], champion: [] }, 55), true);
});

test("a fresh campaign enters the opening story from the title", () => {
  assert.equal(destinationFromTitle(true), "opening-story");
});

test("Continue reaches character selection after the opening story", () => {
  assert.equal(destinationFromTitle(false), "character-select");
});

test("Continue resumes a selected class after the opening story", () => {
  assert.equal(destinationFromTitle(false, "apprentice"), "saved-game");
});
