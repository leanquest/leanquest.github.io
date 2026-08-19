import assert from "node:assert/strict";
import test from "node:test";

import { canSelectHero, destinationFromTitle } from "../app/campaign-progress.ts";

test("Mage is always selectable", () => {
  assert.equal(canSelectHero("mage", { mage: [], warrior: [] }, 50), true);
});

test("Warrior stays locked until the final Mage level is complete", () => {
  const completed = { mage: Array.from({ length: 49 }, (_, index) => index + 1), warrior: [] };
  assert.equal(canSelectHero("warrior", completed, 50), false);
});

test("completing the final Mage level unlocks Warrior", () => {
  assert.equal(canSelectHero("warrior", { mage: [50], warrior: [] }, 50), true);
});

test("a fresh campaign enters the opening story from the title", () => {
  assert.equal(destinationFromTitle(true), "opening-story");
});

test("Continue reaches character selection after the opening story", () => {
  assert.equal(destinationFromTitle(false), "character-select");
});

test("Continue resumes a selected class after the opening story", () => {
  assert.equal(destinationFromTitle(false, "mage"), "saved-game");
});
