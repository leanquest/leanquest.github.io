import assert from "node:assert/strict";
import test from "node:test";

import { createProofState, getMoveChoices, isSolved } from "../app/proof-engine.ts";
import {
  levelTutorials,
  tutorialAllowsChoice,
  tutorialChoiceAdvances,
  tutorialForLevel,
} from "../app/tutorials.ts";

test("Mage level one defines the complete seven-step onboarding tutorial", () => {
  const tutorial = tutorialForLevel("mage", 1);
  assert.ok(tutorial);
  assert.equal(levelTutorials.length, 6);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["guardian", "level-objective"],
    ["guardian", "level-objective"],
    ["vitals"],
    ["vitals"],
    ["move-catalogue"],
    ["move-catalogue"],
    ["proof-scroll", "next-level"],
  ]);
  assert.deepEqual(tutorial.steps.map((step) => step.action.type), [
    "continue",
    "continue",
    "continue",
    "continue",
    "choice",
    "natural-number",
    "next-level",
  ]);
  assert.equal(tutorialForLevel("warrior", 1), undefined);
});

test("Mage level two teaches exact with the natural number from the environment", () => {
  const tutorial = tutorialForLevel("mage", 2);
  assert.ok(tutorial);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["environment"],
    ["move-catalogue"],
    ["move-catalogue"],
  ]);
  assert.equal(tutorial.steps[0].placement, "top-left");
  assert.equal(tutorial.steps[0].compact, true);
  assert.deepEqual(tutorial.steps.map((step) => step.action), [
    { type: "continue", label: "USE THE ENVIRONMENT" },
    { type: "choice", choiceId: "tactic-exact" },
    { type: "choice", choiceId: "term-n" },
  ]);
  assert.equal(tutorialForLevel("warrior", 2), undefined);

  let proof = createProofState("Nat", ["n : Nat"]);
  const exact = getMoveChoices(proof, "mage", 2).find((choice) => choice.id === "tactic-exact");
  assert.ok(exact);
  proof = exact.apply();
  const environmentNat = getMoveChoices(proof, "mage", 2).find((choice) => choice.id === "term-n");
  assert.ok(environmentNat);
  assert.equal(isSolved(environmentNat.apply()), true);
});

test("Mage level three teaches exact with the empty list constructor", () => {
  const tutorial = tutorialForLevel("mage", 3);
  assert.ok(tutorial);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["level-objective"],
    ["move-catalogue"],
    ["move-catalogue"],
  ]);
  assert.deepEqual(tutorial.steps.map((step) => step.action), [
    { type: "continue", label: "BUILD A LIST" },
    { type: "choice", choiceId: "tactic-exact" },
    { type: "choice", choiceId: "term-[]" },
  ]);
  assert.equal(tutorialForLevel("warrior", 3), undefined);

  let proof = createProofState("List Nat", []);
  const exact = getMoveChoices(proof, "mage", 3).find((choice) => choice.id === "tactic-exact");
  assert.ok(exact);
  proof = exact.apply();
  const emptyList = getMoveChoices(proof, "mage", 3).find((choice) => choice.id === "term-[]");
  assert.ok(emptyList);
  assert.equal(isSolved(emptyList.apply()), true);
});

test("Mage level four explains Prop and accepts any proposition", () => {
  const tutorial = tutorialForLevel("mage", 4);
  assert.ok(tutorial);
  assert.match(tutorial.steps[0].text, /true or false/i);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["level-objective"],
    ["move-catalogue"],
    ["move-catalogue"],
  ]);
  assert.equal(tutorial.steps[1].action.type, "choice");
  assert.equal(tutorial.steps[1].action.choiceId, "tactic-exact");
  assert.equal(tutorial.steps[2].action.type, "one-of");
  assert.equal(tutorialForLevel("warrior", 4), undefined);

  let proof = createProofState("Prop", []);
  const exact = getMoveChoices(proof, "mage", 4).find((choice) => choice.id === "tactic-exact");
  assert.ok(exact);
  proof = exact.apply();
  const choices = getMoveChoices(proof, "mage", 4);
  const allowedIds = tutorial.steps[2].action.choiceIds;
  assert.deepEqual(choices.map((choice) => choice.id), allowedIds);
  for (const choice of choices) {
    assert.equal(tutorialAllowsChoice(tutorial.steps[2], choice.id), true);
    assert.equal(isSolved(choice.apply()), true);
  }
  assert.equal(tutorialAllowsChoice(tutorial.steps[2], "term-natural-number"), false);
});

test("Mage level five teaches exact with the True constructor", () => {
  const tutorial = tutorialForLevel("mage", 5);
  assert.ok(tutorial);
  assert.match(tutorial.steps[0].text, /term of that type is a proof/i);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["level-objective"],
    ["move-catalogue"],
    ["move-catalogue"],
  ]);
  assert.deepEqual(tutorial.steps.map((step) => step.action), [
    { type: "continue", label: "CONSTRUCT A PROOF" },
    { type: "choice", choiceId: "tactic-exact" },
    { type: "choice", choiceId: "term-True.intro" },
  ]);
  assert.equal(tutorialForLevel("warrior", 5), undefined);

  let proof = createProofState("True", []);
  const exact = getMoveChoices(proof, "mage", 5).find((choice) => choice.id === "tactic-exact");
  assert.ok(exact);
  proof = exact.apply();
  const trueIntro = getMoveChoices(proof, "mage", 5).find((choice) => choice.id === "term-True.intro");
  assert.ok(trueIntro);
  assert.equal(tutorialAllowsChoice(tutorial.steps[2], trueIntro.id), true);
  assert.equal(isSolved(trueIntro.apply()), true);
});

test("Mage level six explains navigation through an interactive Library visit", () => {
  const tutorial = tutorialForLevel("mage", 6);
  assert.ok(tutorial);
  assert.deepEqual(tutorial.steps.map((step) => step.targets), [
    ["undo"],
    ["restart-level"],
    ["lesson"],
    ["character-select"],
    ["map"],
    ["library-button"],
    ["library-view"],
    [],
  ]);
  assert.deepEqual(tutorial.steps.map((step) => step.action), [
    { type: "continue", label: "SHOW ME RESTART" },
    { type: "continue", label: "SHOW ME LEVEL INFO" },
    { type: "continue", label: "SHOW ME CHARACTER SELECT" },
    { type: "continue", label: "SHOW ME THE MAP" },
    { type: "continue", label: "SHOW ME THE LIBRARY" },
    { type: "open-library" },
    { type: "close-library" },
    { type: "continue", label: "CONTINUE LEVEL" },
  ]);
  assert.equal(tutorial.steps[6].placement, "top-center");
  assert.equal(tutorialForLevel("warrior", 6), undefined);
});

test("interactive tutorial steps permit and advance only their required moves", () => {
  const tutorial = tutorialForLevel("mage", 1);
  assert.ok(tutorial);
  const exactStep = tutorial.steps[4];
  const numberStep = tutorial.steps[5];

  assert.equal(tutorialAllowsChoice(exactStep, "tactic-exact"), true);
  assert.equal(tutorialAllowsChoice(exactStep, "term-natural-number"), false);
  assert.equal(tutorialChoiceAdvances(exactStep, "tactic-exact"), true);

  assert.equal(tutorialAllowsChoice(numberStep, "term-natural-number"), true);
  assert.equal(tutorialChoiceAdvances(numberStep, "term-natural-number"), false);
  assert.equal(tutorialChoiceAdvances(numberStep, "term-natural-number", "37"), true);
  assert.equal(tutorialChoiceAdvances(numberStep, "tactic-exact", "37"), false);
});
