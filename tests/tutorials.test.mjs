import assert from "node:assert/strict";
import test from "node:test";

import {
  levelTutorials,
  tutorialAllowsChoice,
  tutorialChoiceAdvances,
  tutorialForLevel,
} from "../app/tutorials.ts";

test("Mage level one defines the complete five-step onboarding tutorial", () => {
  const tutorial = tutorialForLevel("mage", 1);
  assert.ok(tutorial);
  assert.equal(levelTutorials.length, 1);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["guardian", "level-objective"],
    ["vitals"],
    ["move-catalogue"],
    ["move-catalogue"],
    ["proof-scroll", "next-level"],
  ]);
  assert.deepEqual(tutorial.steps.map((step) => step.action.type), [
    "continue",
    "continue",
    "choice",
    "natural-number",
    "next-level",
  ]);
  assert.equal(tutorialForLevel("warrior", 1), undefined);
  assert.equal(tutorialForLevel("mage", 2), undefined);
});

test("interactive tutorial steps permit and advance only their required moves", () => {
  const tutorial = tutorialForLevel("mage", 1);
  assert.ok(tutorial);
  const exactStep = tutorial.steps[2];
  const numberStep = tutorial.steps[3];

  assert.equal(tutorialAllowsChoice(exactStep, "tactic-exact"), true);
  assert.equal(tutorialAllowsChoice(exactStep, "term-natural-number"), false);
  assert.equal(tutorialChoiceAdvances(exactStep, "tactic-exact"), true);

  assert.equal(tutorialAllowsChoice(numberStep, "term-natural-number"), true);
  assert.equal(tutorialChoiceAdvances(numberStep, "term-natural-number"), false);
  assert.equal(tutorialChoiceAdvances(numberStep, "term-natural-number", "37"), true);
  assert.equal(tutorialChoiceAdvances(numberStep, "tactic-exact", "37"), false);
});
