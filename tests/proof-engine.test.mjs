import assert from "node:assert/strict";
import test from "node:test";

import {
  curriculum,
  exercises,
  newMoveText,
  storySequences,
  unlockedMoves,
} from "../app/curriculum.ts";

import {
  contextLines,
  createProofState,
  currentModeLabel,
  currentTarget,
  getMoveChoices,
  isSolved,
  libraryTermTypes,
  normalizeFocusedHole,
  pendingArgumentType,
  renderProof,
  renderProofParts,
  renderTacticProofLines,
  termSyntaxKind,
} from "../app/proof-engine.ts";
import {
  attackDamageFor,
  hpAfterIntendedRoute,
  MAX_HP,
  MAX_MANA,
  MAX_VISION_POINTS,
  RESOURCE_CONSUMPTION_ENABLED,
  TARGET_RESERVE_MOVES,
  TACTIC_MANA_COSTS,
} from "../app/game-balance.ts";

test("the Warrior catalogue prompts the player to choose a move", () => {
  assert.equal(currentModeLabel(createProofState(exercises[1], "warrior"), "warrior"), "CHOOSE A MOVE");
});

function move(state, hero, level, label) {
  const choice = getMoveChoices(state, hero, level).find((item) => item.label === label);
  assert.ok(
    choice,
    `Expected ${JSON.stringify(label)} among ${getMoveChoices(state, hero, level).map((item) => item.label).join(", ")}`,
  );
  return choice.apply();
}

function inputMove(state, hero, level, label, value) {
  const choice = getMoveChoices(state, hero, level).find((item) => item.label === label);
  assert.ok(choice, `Expected input move ${JSON.stringify(label)}`);
  assert.equal(choice.input, "natural-number");
  return choice.apply(value);
}

function replayIntendedRoute(level, hero) {
  let state = createProofState(level.theorem, level.context);
  let mana = 0;
  for (const label of level[hero].selections) {
    const choices = getMoveChoices(state, hero, level.id);
    const choice = choices.find((candidate) => candidate.label === label) ??
      (/^\d+$/.test(label) ? choices.find((candidate) => candidate.input === "natural-number") : undefined);
    assert.ok(choice, `Expected ${JSON.stringify(label)} on ${hero} level ${level.id}; found ${choices.map((item) => item.label)}`);
    mana += choice.manaCost;
    state = choice.input === "natural-number" ? choice.apply(label) : choice.apply();
  }
  assert.equal(isSolved(state), true, `${hero} level ${level.id} should be solved by its intended route`);
  return { mana, selections: level[hero].selections.length };
}

test("curriculum data controls cumulative move unlocks and lesson callouts", () => {
  assert.equal(unlockedMoves(5, "warrior").has("catalogue.andIntro"), false);
  assert.equal(unlockedMoves(6, "warrior").has("catalogue.andIntro"), true);
  assert.equal(unlockedMoves(6, "mage").has("catalogue.andIntro"), false);
  assert.equal(unlockedMoves(4, "warrior").has("term.application"), true);
  assert.equal(unlockedMoves(4, "warrior").has("tactic.apply"), false);
  assert.equal(unlockedMoves(4, "mage").has("tactic.apply"), true);
  assert.equal(unlockedMoves(8, "mage").has("term.dot"), true);
  assert.equal(unlockedMoves(28, "mage").has("tactic.rewrite"), false);
  assert.equal(unlockedMoves(29, "mage").has("tactic.rewrite"), true);
  assert.equal(unlockedMoves(33, "mage").has("tactic.subst"), false);
  assert.equal(unlockedMoves(34, "mage").has("tactic.subst"), true);
  assert.equal(unlockedMoves(36, "mage").has("tactic.contradiction"), false);
  assert.equal(unlockedMoves(37, "mage").has("tactic.contradiction"), true);
  assert.equal(exercises[34].title, "Chain the Equalities");
  assert.equal(unlockedMoves(34, "mage").has("tactic.calc"), false);
  assert.equal(unlockedMoves(35, "mage").has("tactic.calc"), true);
  assert.equal(unlockedMoves(38, "warrior").has("catalogue.natAddZero"), false);
  assert.equal(unlockedMoves(39, "warrior").has("catalogue.natAddZero"), true);
  assert.equal(unlockedMoves(39, "warrior").has("catalogue.natZeroAdd"), false);
  assert.equal(unlockedMoves(40, "warrior").has("catalogue.natZeroAdd"), true);
  assert.equal(unlockedMoves(45, "mage").has("catalogue.listLengthAppend"), false);
  assert.equal(unlockedMoves(46, "mage").has("catalogue.listLengthAppend"), true);
  assert.match(newMoveText(exercises[3], "warrior"), /application/);
  assert.match(newMoveText(exercises[38], "warrior"), /Nat\.zero_add/);
  assert.match(newMoveText(exercises[38], "mage"), /without using any hypothesis or catalogue theorem/);

  const warriorOnlyProofTerms = [
    "catalogue.andIntro", "catalogue.orIntro", "catalogue.orElim", "catalogue.falseElim",
    "catalogue.iffIntro", "catalogue.byContradiction", "catalogue.eqRefl",
    "catalogue.existsIntro", "catalogue.existsElim", "catalogue.eqSymm",
    "catalogue.eqTrans", "catalogue.congrArg", "catalogue.eqMp",
    "catalogue.classicalEm", "catalogue.recursor", "catalogue.listPermRec",
  ];
  for (const moveId of warriorOnlyProofTerms) {
    assert.equal(unlockedMoves(50, "warrior").has(moveId), true, `${moveId} must remain available to Warrior`);
    assert.equal(unlockedMoves(50, "mage").has(moveId), false, `${moveId} must stay out of the Mage catalogue`);
  }
  assert.equal(unlockedMoves(50, "mage").has("catalogue.dataConstructors"), true);
  assert.equal(unlockedMoves(50, "mage").has("catalogue.natAddLeftComm"), true);

  const warriorOnlyNames = [
    "And.intro", "Or.inl", "Or.inr", "Or.elim", "False.elim", "Iff.intro",
    "Classical.byContradiction", "Eq.refl", "Exists.intro", "Exists.elim",
    "Eq.symm", "Eq.trans", "congrArg", "Eq.mp", "Classical.em",
    "Nat.rec", "List.rec", "List.Perm.rec",
  ];
  for (const exercise of exercises) {
    for (const name of warriorOnlyNames) {
      assert.equal(exercise.mage.proof.includes(name), false, `Mage level ${exercise.id} proof must not use ${name}`);
    }
  }

  const theoremRewards = [
    [38, "catalogue.natAddZero", "Nat.add_zero"],
    [39, "catalogue.natZeroAdd", "Nat.zero_add"],
    [40, "catalogue.natAddSucc", "Nat.add_succ"],
    [41, "catalogue.natAddAssoc", "Nat.add_assoc"],
    [42, "catalogue.natAddComm", "Nat.add_comm"],
    [43, "catalogue.listAppendNil", "List.append_nil"],
    [44, "catalogue.listAppendAssoc", "List.append_assoc"],
    [45, "catalogue.listLengthAppend", "List.length_append"],
    [46, "catalogue.sumAppend", "sum_append"],
    [49, "catalogue.sumReplicate", "sum_replicate"],
  ];
  for (const [level, moveId, theorem] of theoremRewards) {
    assert.equal(unlockedMoves(level, "warrior").has(moveId), false, `${theorem} must not prove itself`);
    assert.equal(unlockedMoves(level + 1, "warrior").has(moveId), true, `${theorem} must unlock after completion`);
    assert.match(newMoveText(exercises[level - 1], "warrior"), new RegExp(theorem.replace(".", "\\.")));
    assert.match(newMoveText(exercises[level - 1], "mage"), new RegExp(theorem.replace(".", "\\.")));
  }
});

test("catalogue moves expose class-appropriate mana costs", () => {
  const warriorState = createProofState("P → P", ["P : Prop"]);
  const warriorChoices = getMoveChoices(warriorState, "warrior", 2);
  assert.ok(warriorChoices.length > 0);
  assert.ok(warriorChoices.every((choice) => choice.category === "term" && choice.manaCost === 0));

  let mageState = createProofState("P → P", ["P : Prop"]);
  const intro = getMoveChoices(mageState, "mage", 2).find((choice) => choice.label.startsWith("intro "));
  assert.ok(intro);
  assert.equal(intro.manaCost, TACTIC_MANA_COSTS.intro);
  mageState = intro.apply();

  const exact = getMoveChoices(mageState, "mage", 2).find((choice) => choice.label === "exact □");
  assert.ok(exact);
  assert.equal(exact.manaCost, TACTIC_MANA_COSTS.exact);
  mageState = exact.apply();

  const argumentsChoices = getMoveChoices(mageState, "mage", 2);
  assert.ok(argumentsChoices.length > 0);
  assert.ok(argumentsChoices.every((choice) => choice.category === "argument" && choice.manaCost === 0));
});

test("level forty-eight provides sum_append through the catalogue, not the environment", () => {
  const level = exercises.find((exercise) => exercise.id === 48);
  const state = createProofState(level.theorem, level.context);

  assert.equal(level.context.some((declaration) => declaration.startsWith("sum_append :")), false);
  assert.equal(contextLines(state).some((line) => line.startsWith("sum_append :")), false);
  assert.equal(unlockedMoves(level.id, "warrior").has("catalogue.sumAppend"), true);

  let introduced = move(state, "warrior", level.id, "fun xs => □");
  introduced = move(introduced, "warrior", level.id, "fun ys => □");
  introduced = move(introduced, "warrior", level.id, "(□ □)");
  introduced = move(introduced, "warrior", level.id, "(□ □)");
  introduced = move(introduced, "warrior", level.id, "Eq.trans");
  introduced = move(introduced, "warrior", level.id, "(□ □)");
  introduced = move(introduced, "warrior", level.id, "(□ □)");
  assert.ok(getMoveChoices(introduced, "warrior", level.id).some((choice) => choice.label === "sum_append"));
});

test("shared story sequences are placed and rendered entirely from curriculum data", () => {
  assert.equal(curriculum[0].kind, "story");
  assert.equal(curriculum[0].id, "the-broken-axiom");
  assert.equal(curriculum[0].panels.length, 3);

  const level20Index = curriculum.findIndex((entry) => entry.kind === "level" && entry.id === 20);
  assert.equal(curriculum[level20Index + 1].kind, "story");
  assert.equal(curriculum[level20Index + 1].id, "the-hall-of-names");
  assert.equal(curriculum[level20Index + 2].kind, "level");
  assert.equal(curriculum[level20Index + 2].id, 21);

  assert.equal(storySequences.length, 2);
  assert.ok(storySequences.some((story) => story.panels.some((panel) => panel.layers.some((layer) => layer.frames.length === 2))));
  for (const story of storySequences) {
    for (const panel of story.panels) {
      for (const layer of panel.layers) {
        for (const frame of layer.frames) assert.match(frame, /^\/assets\/story\/.+\.png$/);
      }
    }
  }
});

test("every level specifies its monster sprite and class hue shifts", () => {
  for (const exercise of exercises) {
    for (const hero of ["warrior", "mage"]) {
      assert.ok(Number.isInteger(attackDamageFor(hero, exercise[hero].selections.length)));
      assert.ok(attackDamageFor(hero, exercise[hero].selections.length) > 0);
    }
    assert.match(exercise.monster.sprite.sheet, /^monsters(?:-[23])?\.png$/);
    assert.ok(exercise.monster.sprite.cell >= 0 && exercise.monster.sprite.cell <= 9);
    assert.equal(typeof exercise.monster.hueShift.warrior, "number");
    assert.equal(typeof exercise.monster.hueShift.mage, "number");
  }
  assert.deepEqual(exercises[30].monster.sprite, { sheet: "monsters-3.png", cell: 9 });
  assert.deepEqual(exercises[30].monster.hueShift, { warrior: 92, mage: 126 });
});

test("every intended proof route replays and the active economy is balanced from it", () => {
  assert.equal(RESOURCE_CONSUMPTION_ENABLED, true);
  assert.deepEqual(MAX_HP, { warrior: 480, mage: 210 });
  assert.deepEqual(MAX_MANA, { warrior: 0, mage: 30 });
  assert.deepEqual(TARGET_RESERVE_MOVES, { warrior: 4, mage: 2 });
  assert.equal(MAX_VISION_POINTS, 5);
  assert.ok(TACTIC_MANA_COSTS.exact < TACTIC_MANA_COSTS.apply);
  assert.ok(TACTIC_MANA_COSTS.apply < TACTIC_MANA_COSTS.cases);
  assert.ok(TACTIC_MANA_COSTS.cases < TACTIC_MANA_COSTS.induction);

  const manaByLevel = [];
  for (const level of exercises) {
    for (const hero of ["warrior", "mage"]) {
      const route = replayIntendedRoute(level, hero);
      if (hero === "mage") {
        assert.ok(route.mana <= MAX_MANA.mage, `Mage level ${level.id} costs ${route.mana} MP`);
        manaByLevel.push({ level: level.id, mana: route.mana });
      }

      const difficult = route.selections >= (hero === "warrior" ? 10 : 5);
      if (difficult) {
        const damage = attackDamageFor(hero, route.selections);
        const remaining = hpAfterIntendedRoute(hero, route.selections);
        assert.ok(remaining > 0, `${hero} level ${level.id} must remain survivable`);
        const reserve = remaining / damage;
        const tolerance = hero === "warrior" ? 1 : 0.5;
        assert.ok(
          Math.abs(reserve - TARGET_RESERVE_MOVES[hero]) <= tolerance,
          `${hero} level ${level.id} leaves ${reserve.toFixed(2)} reserve moves`,
        );
      }
    }
  }
  assert.equal(Math.max(...manaByLevel.filter(({ level }) => level >= 46).map(({ mana }) => mana)), MAX_MANA.mage);
});

test("warrior vision normalizes the focused hole without making a proof move", () => {
  const state = createProofState(
    "Nat.add head (sum tail + sum ys) = sum (head :: tail) + sum ys",
    ["head : Nat", "tail ys : List Nat"],
  );
  const normalized = normalizeFocusedHole(state);
  assert.notEqual(normalized, state);
  assert.equal(
    currentTarget(normalized),
    "head + (sum tail + sum ys) = head + sum tail + sum ys",
  );
  assert.deepEqual(normalized.moves, []);
  assert.equal(normalizeFocusedHole(normalized), normalized);
});

test("warrior vision preserves a substituted list constructor as one AST argument", () => {
  const state = createProofState(
    "sum ys + sum (head :: tail) = head + sum (tail ++ ys)",
    ["head : Nat", "tail ys : List Nat"],
  );

  assert.equal(
    currentTarget(normalizeFocusedHole(state)),
    "sum ys + (head + sum tail) = head + sum (tail ++ ys)",
  );
});

test("repeatEach unfolds one source-list constructor", () => {
  const state = createProofState(
    "sum (repeatEach n (head :: tail)) = sum (List.replicate n head ++ repeatEach n tail)",
    ["n head : Nat", "tail : List Nat"],
  );

  assert.equal(
    currentTarget(normalizeFocusedHole(state)),
    "sum (List.replicate n head ++ repeatEach n tail) = " +
      "sum (List.replicate n head ++ repeatEach n tail)",
  );
});

test("completed argument placeholders cannot reappear as selectable terms", () => {
  const level = exercises.find((exercise) => exercise.id === 48);
  let state = createProofState(level.theorem, level.context);
  const moves = [
    "fun xs => □", "fun ys => □",
    "(□ □)", "(□ □)", "Eq.trans",
    "(□ □)", "(□ □)", "sum_append", "xs", "ys",
    "(□ □)", "(□ □)", "(□ □)", "List.rec", "ys",
    "(□ □)", "Eq.refl", "sum xs",
    "fun head => □", "fun tail => □", "fun h => □",
    "(□ □)", "(□ □)", "Eq.trans",
    "(□ □)", "Eq.symm",
    "(□ □)", "(□ □)", "Nat.add_comm", "head + sum tail", "sum xs",
    "(□ □)",
  ];

  for (const label of moves) {
    const choice = getMoveChoices(state, "warrior", level.id).find((candidate) => candidate.label === label);
    assert.ok(choice, `Expected ${label} while replaying the stale-placeholder regression`);
    state = choice.apply();
  }

  const labels = getMoveChoices(state, "warrior", level.id).map((choice) => choice.label);
  assert.equal(labels.includes("Eq.refl"), false);
  assert.equal(labels.some((label) => /\?(?:a|u)\d+/.test(label)), false);
  assert.equal(isSolved(state), false);
});

test("proof completion rejects unresolved metas, constraints, and the wrong root type", () => {
  const base = createProofState("Nat", []);
  const closed = { ...base, root: { kind: "term", text: "0", type: "Nat" } };
  assert.equal(isSolved(closed), true);
  assert.equal(isSolved({ ...closed, root: { kind: "term", text: "?a1", type: "Nat" } }), false);
  assert.equal(isSolved({ ...closed, constraints: [{ left: "0", right: "1", context: [] }] }), false);
  assert.equal(isSolved({ ...closed, root: { kind: "term", text: "0", type: "Prop" } }), false);
});

test("dependent catalogue recursors are inferred from the target without context evidence", () => {
  let state = createProofState(exercises[46].theorem, exercises[46].context);
  state = move(state, "warrior", 47, "fun xs => □");
  state = move(state, "warrior", 47, "fun ys => □");
  for (let index = 0; index < 4; index += 1) state = move(state, "warrior", 47, "(□ □)");

  assert.equal(currentTarget(state), "(?3 → ?2 → ?1 → ?0 → List.Perm xs ys → sum xs = sum ys)");
  assert.ok(getMoveChoices(state, "warrior", 47).some((choice) => choice.label === "List.Perm.rec"));
  state = move(state, "warrior", 47, "List.Perm.rec");
  assert.equal(currentTarget(state), "sum [] = sum []");
});

test("congrArg infers a shared unary context from an equality target", () => {
  let state = createProofState(
    "(x + y) + sum l = (y + x) + sum l",
    ["x y : Nat", "l : List Nat"],
  );
  state = move(state, "warrior", 47, "(□ □)");
  state = move(state, "warrior", 47, "(□ □)");

  assert.ok(getMoveChoices(state, "warrior", 47).some((choice) => choice.label === "congrArg"));
  state = move(state, "warrior", 47, "congrArg");
  assert.equal(currentTarget(state), "Nat → ?3");
  assert.ok(
    getMoveChoices(state, "warrior", 47)
      .some((choice) => choice.label === "fun __leanquest_arg => __leanquest_arg + sum l"),
  );
});

test("the list-sum capstones use no more than two nested recursors", () => {
  const recursorCounts = exercises.slice(45).map((level) =>
    level.warrior.proof.match(/(?:Nat|List|List\.Perm)\.rec/g)?.length ?? 0
  );
  assert.deepEqual(recursorCounts, [1, 1, 0, 1, 2]);

  let appendState = createProofState(exercises[45].theorem, exercises[45].context);
  appendState = move(appendState, "mage", 46, "intro xs");
  appendState = move(appendState, "mage", 46, "intro ys");
  const appendChoices = getMoveChoices(appendState, "mage", 46).map((choice) => choice.label);
  assert.equal(appendChoices.includes("simp"), false);
  assert.ok(appendChoices.includes("induction □"));

  let replicateState = createProofState(exercises[48].theorem, exercises[48].context);
  replicateState = move(replicateState, "mage", 49, "intro n");
  replicateState = move(replicateState, "mage", 49, "intro x");
  assert.equal(getMoveChoices(replicateState, "mage", 49).some((choice) => choice.label === "simp"), false);
  assert.ok(getMoveChoices(replicateState, "mage", 49).some((choice) => choice.label === "induction □"));

  assert.deepEqual(
    exercises[49].mage.selections.filter((move) => move.startsWith("induction ")),
    ["induction □"],
  );
});

test("all five Mage capstones replay with their intended move and mana counts", () => {
  const routes = [
    { labels: exercises[45].mage.selections, mana: 24 },
    { labels: exercises[46].mage.selections, mana: 30 },
    { labels: exercises[47].mage.selections, mana: 12 },
    { labels: exercises[48].mage.selections, mana: 27 },
    { labels: exercises[49].mage.selections, mana: 27 },
  ];

  for (const [index, route] of routes.entries()) {
    const level = exercises[index + 45];
    let state = createProofState(level.theorem, level.context);
    let mana = 0;
    for (const label of route.labels) {
      const choice = getMoveChoices(state, "mage", level.id).find((candidate) => candidate.label === label);
      assert.ok(choice, `Expected ${label} on Mage level ${level.id}`);
      mana += choice.manaCost;
      state = choice.apply();
    }
    assert.equal(isSolved(state), true, `Mage level ${level.id} should be solved`);
    assert.equal(mana, route.mana);
  }
});

test("Mage induction chapter routes use explicit facts after restricted simp", () => {
  for (const level of exercises.slice(38, 45)) {
    let state = createProofState(level.theorem, level.context);
    for (const label of level.mage.selections) {
      state = move(state, "mage", level.id, label);
    }
    assert.equal(isSolved(state), true, `Mage level ${level.id} should be solved`);
  }
});

test("all five Warrior capstones replay with their intended selection counts", () => {
  const replay = (levelIndex, build) => {
    const level = exercises[levelIndex];
    let state = createProofState(level.theorem, level.context);
    let selections = 0;
    const exact = (label) => {
      const choices = getMoveChoices(state, "warrior", level.id);
      const choice = choices.find((candidate) => candidate.label === label);
      assert.ok(choice, `Expected ${label} on Warrior level ${level.id}; found ${choices.map((item) => item.label)}`);
      state = choice.apply();
      selections += 1;
    };
    const lambda = () => {
      const choice = getMoveChoices(state, "warrior", level.id).find((candidate) => candidate.label.startsWith("fun "));
      assert.ok(choice, `Expected a lambda on Warrior level ${level.id}`);
      exact(choice.label);
    };
    const direct = () => {
      const choice = getMoveChoices(state, "warrior", level.id).find((candidate) =>
        candidate.label !== "(□ □)" && !candidate.label.startsWith("fun ")
      );
      assert.ok(choice, `Expected a direct hypothesis on Warrior level ${level.id}`);
      exact(choice.label);
    };
    build({ exact, lambda, direct });
    assert.equal(isSolved(state), true, `Warrior level ${level.id} should be solved`);
    return selections;
  };

  const counts = [];
  counts.push(replay(45, ({ exact, lambda }) => {
    for (const label of ["fun xs => □", "fun ys => □", "(□ □)", "(□ □)", "(□ □)", "List.rec", "xs", "(□ □)", "Eq.symm", "(□ □)", "Nat.zero_add", "sum ys"]) exact(label);
    for (let index = 0; index < 3; index += 1) lambda();
    for (const label of ["(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "congrArg", "Nat.add head", "h", "(□ □)", "Eq.symm", "(□ □)", "(□ □)", "(□ □)", "Nat.add_assoc", "head", "sum tail", "sum ys"]) exact(label);
  }));
  counts.push(replay(46, ({ exact, lambda, direct }) => {
    for (const label of ["fun xs => □", "fun ys => □", "fun h => □"]) exact(label);
    for (let index = 0; index < 5; index += 1) exact("(□ □)");
    exact("List.Perm.rec");
    for (const label of ["(□ □)", "Eq.refl", "0"]) exact(label);
    for (let index = 0; index < 5; index += 1) lambda();
    for (const label of ["(□ □)", "(□ □)", "congrArg", "Nat.add x"]) exact(label);
    direct();
    for (let index = 0; index < 3; index += 1) lambda();
    for (const label of ["(□ □)", "(□ □)", "(□ □)", "Nat.add_left_comm", "y", "x", "sum l"]) exact(label);
    for (let index = 0; index < 7; index += 1) lambda();
    for (const label of ["(□ □)", "(□ □)", "Eq.trans"]) exact(label);
    direct();
    direct();
    exact("h");
  }));
  counts.push(replay(47, ({ exact }) => {
    for (const label of ["fun xs => □", "fun ys => □", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "sum_append", "xs", "ys", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "Nat.add_comm", "sum xs", "sum ys", "(□ □)", "Eq.symm", "(□ □)", "(□ □)", "sum_append", "ys", "xs"]) exact(label);
  }));
  counts.push(replay(48, ({ exact }) => {
    for (const label of ["fun n => □", "fun x => □", "(□ □)", "(□ □)", "(□ □)", "Nat.rec", "n", "(□ □)", "Eq.symm", "(□ □)", "Nat.zero_mul", "x", "fun n2 => □", "fun h => □", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "congrArg", "Nat.add x", "h", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "Nat.add_comm", "x", "n2 * x", "(□ □)", "Eq.symm", "(□ □)", "(□ □)", "Nat.succ_mul", "n2", "x"]) exact(label);
  }));
  counts.push(replay(49, ({ exact }) => {
    for (const label of ["fun xs => □", "(□ □)", "(□ □)", "(□ □)", "List.rec", "xs", "fun n => □", "(□ □)", "(□ □)", "(□ □)", "Nat.rec", "n", "(□ □)", "Eq.refl", "0", "fun n2 => □", "fun h => □", "h", "fun head => □", "fun tail => □", "fun hatil => □", "fun n => □", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "sum_append", "List.replicate n head", "repeatEach n tail", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "congrArg", "Nat.add (sum (List.replicate n head))", "(□ □)", "hatil", "n", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "Nat.add_comm", "sum (List.replicate n head)", "n * sum tail", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "congrArg", "Nat.add (n * sum tail)", "(□ □)", "(□ □)", "sum_replicate", "n", "head", "(□ □)", "(□ □)", "Eq.trans", "(□ □)", "(□ □)", "Nat.add_comm", "n * sum tail", "n * head", "(□ □)", "Eq.symm", "(□ □)", "(□ □)", "(□ □)", "Nat.mul_add", "n", "head", "sum tail"]) exact(label);
  }));

  assert.deepEqual(counts, [32, 45, 25, 37, 77]);
});

test("every monster name matches its sprite archetype", () => {
  const archetypes = {
    "monsters.png:0": /Eye/,
    "monsters.png:1": /Imp|Hoarder/,
    "monsters.png:2": /Lich/,
    "monsters.png:3": /Pair|Gnawer/,
    "monsters.png:4": /Gargoyle/,
    "monsters.png:5": /Troll/,
    "monsters.png:6": /Emberhorn/,
    "monsters.png:7": /Frosthorn/,
    "monsters.png:8": /Adder/,
    "monsters.png:9": /Wraith|Void Warden/,
    "monsters-2.png:0": /Mushroom|Fungal/,
    "monsters-2.png:1": /Book Mimic/,
    "monsters-2.png:2": /Beetle/,
    "monsters-2.png:3": /Raven/,
    "monsters-2.png:4": /Minotaur/,
    "monsters-2.png:5": /Ice Golem/,
    "monsters-2.png:6": /Spider/,
    "monsters-2.png:7": /Mummy/,
    "monsters-2.png:8": /Troll/,
    "monsters-2.png:9": /Knight/,
    "monsters-3.png:0": /Salamander/,
    "monsters-3.png:1": /Boneguard/,
    "monsters-3.png:2": /Witch/,
    "monsters-3.png:3": /Boar/,
    "monsters-3.png:4": /Eye|Orb/,
    "monsters-3.png:5": /Automaton/,
    "monsters-3.png:6": /Scorpion/,
    "monsters-3.png:7": /Djinn/,
    "monsters-3.png:8": /Hound/,
    "monsters-3.png:9": /Dragon/,
  };

  for (const exercise of exercises) {
    const sprite = exercise.monster.sprite;
    const archetype = archetypes[`${sprite.sheet}:${sprite.cell}`];
    assert.ok(archetype, `Missing archetype for ${sprite.sheet} cell ${sprite.cell}`);
    assert.match(exercise.monster.name, archetype, `Level ${exercise.id} uses the wrong monster art`);
  }
});

test("an environment term can close the first warrior level", () => {
  let state = createProofState("P", ["P : Prop", "hp : P"]);
  state = move(state, "warrior", 1, "hp");
  assert.equal(isSolved(state), true);
  assert.equal(renderProof(state), "hp");
});

test("intro extends the mage environment before exact chooses a term", () => {
  let state = createProofState("P → P", ["P : Prop"]);
  state = move(state, "mage", 2, "intro hP");
  assert.ok(contextLines(state).includes("hP : P"));
  state = move(state, "mage", 2, "exact □");
  assert.deepEqual(state.tacticScript, ["intro hP", "exact □"]);
  state = move(state, "mage", 2, "hP");
  assert.equal(isSolved(state), true);
  assert.deepEqual(state.tacticScript, ["intro hP", "exact hP"]);
  assert.deepEqual(state.moves, ["intro hP", "exact □", "hP"]);
});

test("mage tactic arguments fill their scroll holes without disappearing from move history", () => {
  let state = createProofState("P ∧ Q → P", ["P Q : Prop"]);
  state = move(state, "mage", 7, "intro h");
  state = move(state, "mage", 7, "apply □");
  state = move(state, "mage", 7, "And.left");
  assert.deepEqual(state.tacticScript, ["intro h", "apply And.left"]);
  assert.deepEqual(state.moves, ["intro h", "apply □", "And.left"]);
});

test("mage apply offers function-valued conjunction projections from the environment", () => {
  let state = createProofState("P ∧ ¬P → False", ["P : Prop"]);
  state = move(state, "mage", 14, "intro h");
  state = move(state, "mage", 14, "apply □");
  assert.ok(getMoveChoices(state, "mage", 14).some((choice) => choice.label === "h.right"));
  state = move(state, "mage", 14, "h.right");
  assert.equal(currentTarget(state), "P");
  state = move(state, "mage", 14, "exact □");
  assert.deepEqual(getMoveChoices(state, "mage", 14).map((choice) => choice.label), ["h.left"]);
  state = move(state, "mage", 14, "h.left");
  assert.equal(isSolved(state), true);
  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro h",
    "  apply h.right",
    "  exact h.left",
  ]);
});

test("mage apply offers function-valued equivalence projections from the environment", () => {
  let state = createProofState("(P ↔ Q) → P → Q", ["P Q : Prop"]);
  state = move(state, "mage", 13, "intro h");
  state = move(state, "mage", 13, "intro hP");
  state = move(state, "mage", 13, "apply □");
  assert.equal(pendingArgumentType(state), "?₁ → … → ?ₙ → Q");
  const forwardProjection = getMoveChoices(state, "mage", 13).find((choice) => choice.label === "h.mp");
  assert.equal(forwardProjection?.argumentType, "P → Q");
  state = move(state, "mage", 13, "h.mp");
  assert.equal(currentTarget(state), "P");
  state = move(state, "mage", 13, "exact □");
  state = move(state, "mage", 13, "hP");
  assert.equal(isSolved(state), true);
});

test("mage term-taking tactics stage and type-check their arguments", () => {
  let state = createProofState("a = b → b = c → a = c", ["α : Type", "a b c : α"]);
  state = move(state, "mage", 27, "intro h");
  state = move(state, "mage", 27, "intro h2");

  const tacticLabels = getMoveChoices(state, "mage", 27).map((choice) => choice.label);
  assert.ok(tacticLabels.includes("trans □"));
  assert.equal(tacticLabels.some((label) => label.startsWith("trans ") && label !== "trans □"), false);

  state = move(state, "mage", 27, "trans □");
  assert.equal(pendingArgumentType(state), "α");
  assert.deepEqual(
    getMoveChoices(state, "mage", 27).map((choice) => [choice.label, choice.argumentType]),
    [["b", "α"]],
  );
  state = move(state, "mage", 27, "b");
  assert.equal(currentTarget(state), "a = b");
  assert.deepEqual(renderTacticProofLines(state), ["by", "  intro h", "  intro h2", "  trans b"]);
});

test("mage structural and equality tactics do not preselect context terms", () => {
  let casesState = createProofState("(P ∨ Q) → R", ["P Q R : Prop"]);
  casesState = move(casesState, "mage", 10, "intro h");
  casesState = move(casesState, "mage", 10, "cases □");
  assert.equal(pendingArgumentType(casesState), "P ∨ Q");
  assert.deepEqual(
    getMoveChoices(casesState, "mage", 10).map((choice) => [choice.label, choice.argumentType]),
    [["h", "P ∨ Q"]],
  );

  let rcasesState = createProofState("(∃ x : α, P x) → Q", [
    "α : Type", "P : α → Prop", "Q : Prop",
  ]);
  rcasesState = move(rcasesState, "mage", 24, "intro h");
  const rcases = getMoveChoices(rcasesState, "mage", 24).find((choice) => choice.label === "rcases □");
  assert.ok(rcases);
  rcasesState = rcases.apply();
  assert.equal(pendingArgumentType(rcasesState), "∃ x : α, P x");
  assert.deepEqual(getMoveChoices(rcasesState, "mage", 24).map((choice) => choice.label), ["h"]);

  let substState = createProofState("a = b → P a → P b", [
    "α : Type", "P : α → Prop", "a b : α",
  ]);
  substState = move(substState, "mage", 34, "intro h");
  substState = move(substState, "mage", 34, "intro h2");
  substState = move(substState, "mage", 34, "subst □");
  assert.equal(pendingArgumentType(substState), "α");
  assert.deepEqual(
    getMoveChoices(substState, "mage", 34).map((choice) => [choice.label, choice.argumentType]),
    [["a", "α"], ["b", "α"]],
  );
  substState = move(substState, "mage", 34, "b");
  assert.equal(currentTarget(substState), "P a");
  substState = move(substState, "mage", 34, "exact □");
  substState = move(substState, "mage", 34, "h2");
  assert.equal(isSolved(substState), true);

  let calcState = createProofState("a = b → b = c → f a = f c", [
    "α β : Type", "f : α → β", "a b c : α",
  ]);
  calcState = move(calcState, "mage", 35, "intro h");
  calcState = move(calcState, "mage", 35, "intro h2");
  calcState = move(calcState, "mage", 35, "calc … = □ := □");
  assert.equal(pendingArgumentType(calcState), "β");
  assert.deepEqual(
    getMoveChoices(calcState, "mage", 35).map((choice) => [choice.label, choice.argumentType]),
    [["f b", "β"]],
  );
  calcState = move(calcState, "mage", 35, "f b");
  assert.deepEqual(renderTacticProofLines(calcState), [
    "by",
    "  intro h",
    "  intro h2",
    "  calc",
    "    f a = f b := by",
    "      □",
    "    _ = f c := by",
    "      □",
  ]);

  let byCasesState = createProofState("P ∨ ¬P", ["P : Prop"]);
  byCasesState = move(byCasesState, "mage", 36, "by_cases □");
  assert.equal(pendingArgumentType(byCasesState), "Prop");
  assert.deepEqual(
    getMoveChoices(byCasesState, "mage", 36).map((choice) => [choice.label, choice.argumentType]),
    [["P", "Prop"]],
  );
});

test("mage subst offers every eliminable equality variable and rewrites the whole proof state", () => {
  let state = createProofState("a = b → b = c → f a = f c", [
    "α β : Type", "f : α → β", "a b c : α",
  ]);
  state = move(state, "mage", 35, "intro h");
  state = move(state, "mage", 35, "intro h2");
  state = move(state, "mage", 35, "subst □");

  assert.equal(pendingArgumentType(state), "α");
  assert.deepEqual(
    getMoveChoices(state, "mage", 35).map((choice) => [choice.label, choice.argumentType]),
    [["a", "α"], ["b", "α"], ["c", "α"]],
  );

  const eliminateA = move(state, "mage", 35, "a");
  assert.equal(currentTarget(eliminateA), "f b = f c");
  assert.ok(contextLines(eliminateA).includes("h2 : b = c"));
  assert.equal(contextLines(eliminateA).some((line) => line.startsWith("a :") || line.startsWith("h :")), false);

  const eliminateB = move(state, "mage", 35, "b");
  assert.equal(currentTarget(eliminateB), "f a = f c");
  assert.ok(contextLines(eliminateB).includes("h2 : a = c"));
  assert.equal(contextLines(eliminateB).some((line) => line.startsWith("b :") || line.startsWith("h :")), false);

  const eliminateC = move(state, "mage", 35, "c");
  assert.equal(currentTarget(eliminateC), "f a = f b");
  assert.ok(contextLines(eliminateC).includes("h : a = b"));
  assert.equal(contextLines(eliminateC).some((line) => line.startsWith("c :") || line.startsWith("h2 :")), false);
});

test("mage learns rewriting before substitution on the existing equality levels", () => {
  let rewriteState = createProofState("a = b → P a → P b", [
    "α : Type", "P : α → Prop", "a b : α",
  ]);
  rewriteState = move(rewriteState, "mage", 29, "intro h");
  rewriteState = move(rewriteState, "mage", 29, "intro h2");
  assert.equal(getMoveChoices(rewriteState, "mage", 29).some((choice) => choice.label === "subst □"), false);
  rewriteState = move(rewriteState, "mage", 29, "rw [← □]");
  rewriteState = move(rewriteState, "mage", 29, "h");
  rewriteState = move(rewriteState, "mage", 29, "exact □");
  rewriteState = move(rewriteState, "mage", 29, "h2");
  assert.equal(isSolved(rewriteState), true);

  let substState = createProofState("a = b → g (f a) = g (f b)", [
    "α β γ : Type", "f : α → β", "g : β → γ", "a b : α",
  ]);
  substState = move(substState, "mage", 34, "intro h");
  substState = move(substState, "mage", 34, "subst □");
  substState = move(substState, "mage", 34, "b");
  assert.equal(currentTarget(substState), "g (f a) = g (f a)");
  substState = move(substState, "mage", 34, "rfl");
  assert.equal(isSolved(substState), true);
});

test("mage proof scroll renders calc steps as Lean syntax", () => {
  let state = createProofState("a = b → b = c → f a = f c", [
    "α β : Type", "f : α → β", "a b c : α",
  ]);
  state = move(state, "mage", 35, "intro h");
  state = move(state, "mage", 35, "intro h2");
  state = move(state, "mage", 35, "calc … = □ := □");
  state = move(state, "mage", 35, "f b");
  state = move(state, "mage", 35, "congr");
  state = move(state, "mage", 35, "exact □");
  state = move(state, "mage", 35, "h");
  state = move(state, "mage", 35, "congr");
  state = move(state, "mage", 35, "exact □");
  state = move(state, "mage", 35, "h2");

  assert.equal(isSolved(state), true);
  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro h",
    "  intro h2",
    "  calc",
    "    f a = f b := by",
    "      congr",
    "      exact h",
    "    _ = f c := by",
    "      congr",
    "      exact h2",
  ]);
});

test("mage proof scroll nests calc syntax inside an ordinary tactic branch", () => {
  let state = createProofState("a = b → b = c → P → f a = f c ∧ P", [
    "α β : Type", "f : α → β", "a b c : α", "P : Prop",
  ]);
  state = move(state, "mage", 35, "intro h");
  state = move(state, "mage", 35, "intro h2");
  state = move(state, "mage", 35, "intro hP");
  state = move(state, "mage", 35, "constructor");
  state = move(state, "mage", 35, "calc … = □ := □");
  state = move(state, "mage", 35, "f b");
  state = move(state, "mage", 35, "congr");
  state = move(state, "mage", 35, "exact □");
  state = move(state, "mage", 35, "h");
  state = move(state, "mage", 35, "congr");
  state = move(state, "mage", 35, "exact □");
  state = move(state, "mage", 35, "h2");
  state = move(state, "mage", 35, "exact □");
  state = move(state, "mage", 35, "hP");

  assert.equal(isSolved(state), true);
  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro h",
    "  intro h2",
    "  intro hP",
    "  constructor",
    "  · calc",
    "      f a = f b := by",
    "        congr",
    "        exact h",
    "      _ = f c := by",
    "        congr",
    "        exact h2",
    "  · exact hP",
  ]);
});

test("mage proof scroll marks the goals created by constructor with bullets", () => {
  let state = createProofState("P ∧ Q → Q ∧ P", ["P Q : Prop"]);
  state = move(state, "mage", 8, "intro h");
  state = move(state, "mage", 8, "constructor");
  state = move(state, "mage", 8, "exact □");
  state = move(state, "mage", 8, "h.right");
  state = move(state, "mage", 8, "exact □");
  state = move(state, "mage", 8, "h.left");

  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro h",
    "  constructor",
    "  · exact h.right",
    "  · exact h.left",
  ]);
});

test("mage proof scroll indents tactics and bullets inside nested constructors", () => {
  let state = createProofState("P → Q → R → P ∧ (Q ∧ R)", ["P Q R : Prop"]);
  state = move(state, "mage", 31, "intro hP");
  state = move(state, "mage", 31, "intro hQ");
  state = move(state, "mage", 31, "intro hR");
  state = move(state, "mage", 31, "constructor");
  state = move(state, "mage", 31, "exact □");
  state = move(state, "mage", 31, "hP");
  state = move(state, "mage", 31, "constructor");
  state = move(state, "mage", 31, "exact □");
  state = move(state, "mage", 31, "hQ");
  state = move(state, "mage", 31, "exact □");
  state = move(state, "mage", 31, "hR");

  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro hP",
    "  intro hQ",
    "  intro hR",
    "  constructor",
    "  · exact hP",
    "  · constructor",
    "    · exact hQ",
    "    · exact hR",
  ]);
});

test("mage proof scroll marks every branch created by cases", () => {
  let state = createProofState("(P → R) → (Q → R) → P ∨ Q → R", ["P Q R : Prop"]);
  state = move(state, "mage", 10, "intro hPR");
  state = move(state, "mage", 10, "intro hQR");
  state = move(state, "mage", 10, "intro h");
  state = move(state, "mage", 10, "cases □");
  state = move(state, "mage", 10, "h");
  state = move(state, "mage", 10, "apply □");
  state = move(state, "mage", 10, "hPR");
  state = move(state, "mage", 10, "exact □");
  state = move(state, "mage", 10, "hP");
  state = move(state, "mage", 10, "apply □");
  state = move(state, "mage", 10, "hQR");
  state = move(state, "mage", 10, "exact □");
  state = move(state, "mage", 10, "hQ");

  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro hPR",
    "  intro hQR",
    "  intro h",
    "  cases h",
    "  · apply hPR",
    "    exact hP",
    "  · apply hQR",
    "    exact hQ",
  ]);
});

test("mage proof scroll marks every branch created by induction", () => {
  let state = createProofState("∀ n : Nat, 0 + n = n", []);
  state = move(state, "mage", 39, "intro n");
  state = move(state, "mage", 39, "induction □");
  state = move(state, "mage", 39, "n");
  state = move(state, "mage", 39, "rfl");
  state = move(state, "mage", 39, "simp");
  state = move(state, "mage", 39, "congr");
  state = move(state, "mage", 39, "exact □");
  state = move(state, "mage", 39, "ih");

  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro n",
    "  induction n",
    "  · rfl",
    "  · simp",
    "    congr",
    "    exact ih",
  ]);
});

test("mage simp performs reductions without using hypotheses or catalogue theorems", () => {
  const factGoal = createProofState("0 + n = n", [
    "n : Nat",
    "ih : 0 + n = n",
  ]);
  assert.equal(unlockedMoves(42, "mage").has("catalogue.natZeroAdd"), true);
  assert.equal(
    getMoveChoices(factGoal, "mage", 42).some((choice) => choice.label === "simp"),
    false,
  );

  let reduced = createProofState("0 + Nat.succ n = Nat.succ n", [
    "n : Nat",
    "ih : 0 + n = n",
  ]);
  reduced = move(reduced, "mage", 42, "simp");
  assert.equal(currentTarget(reduced), "Nat.succ (0 + n) = Nat.succ n");
  assert.equal(isSolved(reduced), false);

  let trivial = createProofState("n + 0 = n", ["n : Nat"]);
  trivial = move(trivial, "mage", 39, "simp");
  assert.equal(isSolved(trivial), true);
});

test("mage proof scroll marks multiple goals created after choosing an apply function", () => {
  let state = createProofState("(P → Q → R) → R", ["P Q R : Prop", "hP : P", "hQ : Q"]);
  state = move(state, "mage", 10, "intro hPQR");
  state = move(state, "mage", 10, "apply □");
  state = move(state, "mage", 10, "hPQR");
  state = move(state, "mage", 10, "exact □");
  state = move(state, "mage", 10, "hP");
  state = move(state, "mage", 10, "exact □");
  state = move(state, "mage", 10, "hQ");

  assert.deepEqual(renderTacticProofLines(state), [
    "by",
    "  intro hPQR",
    "  apply hPQR",
    "  · exact hP",
    "  · exact hQ",
  ]);
});

test("nested applications fill the focused hole instead of appending text", () => {
  let state = createProofState(
    "(P → Q) → (Q → R) → P → R",
    ["P Q R : Prop"],
  );
  state = move(state, "warrior", 5, "fun hPQ => □");
  state = move(state, "warrior", 5, "fun hQR => □");
  state = move(state, "warrior", 5, "fun hP => □");
  state = move(state, "warrior", 5, "(□ □)");
  assert.equal(currentTarget(state), "(?0 → R)");
  assert.deepEqual(
    renderProofParts(state).filter((part) => part.hole).map((part) => part.active),
    [true, false],
  );
  state = move(state, "warrior", 5, "hQR");
  state = move(state, "warrior", 5, "(□ □)");
  state = move(state, "warrior", 5, "hPQ");
  state = move(state, "warrior", 5, "hP");
  assert.equal(isSolved(state), true);
  assert.equal(renderProof(state), "fun hPQ => fun hQR => fun hP => hQR (hPQ hP)");
});

test("unresolved application types display stable numbered variables", () => {
  let state = createProofState("R", ["R : Prop"]);
  state = move(state, "warrior", 5, "(□ □)");
  assert.equal(currentTarget(state), "(?0 → R)");
  state = move(state, "warrior", 5, "(□ □)");
  assert.equal(currentTarget(state), "(?1 → ?0 → R)");
});

test("a multi-argument catalogue function is built with ordinary applications", () => {
  let state = createProofState("P → Q → P ∧ Q", ["P Q : Prop"]);
  state = move(state, "warrior", 6, "fun hP => □");
  state = move(state, "warrior", 6, "fun hQ => □");
  state = move(state, "warrior", 6, "(□ □)");
  state = move(state, "warrior", 6, "(□ □)");
  state = move(state, "warrior", 6, "And.intro");
  assert.deepEqual(
    renderProofParts(state).filter((part) => part.hole).map((part) => part.active),
    [true, false],
  );
  state = move(state, "warrior", 6, "hP");
  state = move(state, "warrior", 6, "hQ");
  assert.equal(renderProof(state), "fun hP => fun hQ => And.intro hP hQ");
  assert.equal(isSolved(state), true);
});

test("constructor functions are catalogue terms rather than pre-applied moves", () => {
  let state = createProofState("P → Q → P ∧ Q", ["P Q : Prop"]);
  assert.equal(getMoveChoices(state, "warrior", 6).some((move) => move.label.includes("And.intro □")), false);
  assert.equal(getMoveChoices(state, "mage", 6).some((move) => move.label === "constructor"), false);

  state = move(state, "warrior", 6, "fun hP => □");
  state = move(state, "warrior", 6, "fun hQ => □");
  assert.deepEqual(getMoveChoices(state, "warrior", 6).map((move) => move.label), ["(□ □)"]);
  state = move(state, "warrior", 6, "(□ □)");
  state = move(state, "warrior", 6, "(□ □)");
  assert.ok(getMoveChoices(state, "warrior", 6).some((move) => move.label === "And.intro"));
});

test("catalogue functions never arrive with pre-filled argument holes", () => {
  const cases = [
    { level: 6, theorem: "P → Q → P ∧ Q", expected: "And.intro" },
    { level: 9, theorem: "P → P ∨ Q", expected: "Or.inl" },
    { level: 10, theorem: "(P ∨ Q) → (P → R) → (Q → R) → R", expected: "Or.elim" },
    { level: 11, theorem: "False → P", expected: "False.elim" },
    { level: 12, theorem: "(P → Q) → (Q → P) → (P ↔ Q)", expected: "Iff.intro" },
    { level: 19, theorem: "(¬P → False) → P", expected: "Classical.byContradiction" },
    { level: 20, theorem: "∀ x : α, x = x", context: ["α : Type"], expected: "Eq.refl" },
    { level: 23, theorem: "∀ x : α, P x → ∃ y : α, P y", context: ["α : Type", "P : α → Prop"], expected: "Exists.intro" },
    { level: 24, theorem: "(∃ x : α, P x) → (∀ x : α, P x → Q) → Q", context: ["α : Type", "P : α → Prop", "Q : Prop"], expected: "Exists.elim" },
    { level: 26, theorem: "a = b → b = a", context: ["α : Type", "a b : α"], expected: "Eq.symm" },
    { level: 27, theorem: "a = b → b = c → a = c", context: ["α : Type", "a b c : α"], expected: "Eq.trans" },
    { level: 28, theorem: "(α → β) → a = b → f a = f b", context: ["α β : Type", "f : α → β", "a b : α"], expected: "congrArg" },
    { level: 29, theorem: "(P a = P b) → P a → P b", context: ["α : Type", "P : α → Prop", "a b : α", "hab : a = b"], expected: "Eq.mp" },
    { level: 36, theorem: "∀ p : Prop, p ∨ ¬p", context: [], expected: "Classical.em" },
    { level: 43, theorem: "∀ a b : Nat, a + b = b + a", context: [], expected: "Nat.add_comm" },
  ];

  for (const item of cases) {
    const state = createProofState(item.theorem, item.context ?? ["P Q R : Prop"]);
    const labels = getMoveChoices(state, "warrior", item.level).map((choice) => choice.label);
    assert.ok(labels.includes(item.expected), `Expected bare ${item.expected} in ${labels.join(", ")}`);
    assert.equal(labels.some((label) => label.startsWith(`${item.expected} `)), false);
  }
});

test("dependent applications instantiate later argument types from the chosen term", () => {
  let state = createProofState("P a → ∃ x, P x", ["α : Type", "P : α → Prop", "a : α"]);
  state = move(state, "warrior", 23, "fun h => □");
  state = move(state, "warrior", 23, "(□ □)");
  state = move(state, "warrior", 23, "(□ □)");
  state = move(state, "warrior", 23, "Exists.intro");
  assert.equal(currentTarget(state), "α");
  state = move(state, "warrior", 23, "a");
  assert.equal(currentTarget(state), "P a");
  state = move(state, "warrior", 23, "h");
  assert.equal(renderProof(state), "fun h => Exists.intro a h");
  assert.equal(isSolved(state), true);
});

test("level twenty-five unlocks natural number entry for terms and tactic arguments", () => {
  const locked = createProofState("Nat", []);
  assert.equal(
    getMoveChoices(locked, "warrior", 24).some((choice) => choice.label === "natural number"),
    false,
  );
  assert.equal(
    getMoveChoices(locked, "warrior", 25).some((choice) => choice.label === "natural number"),
    true,
  );

  let warrior = createProofState("∃ n : Nat, n = 0", []);
  warrior = move(warrior, "warrior", 25, "(□ □)");
  warrior = move(warrior, "warrior", 25, "(□ □)");
  warrior = move(warrior, "warrior", 25, "Exists.intro");
  warrior = inputMove(warrior, "warrior", 25, "natural number", "000");
  assert.equal(currentTarget(warrior), "0 = 0");
  warrior = move(warrior, "warrior", 25, "(□ □)");
  warrior = move(warrior, "warrior", 25, "Eq.refl");
  warrior = inputMove(warrior, "warrior", 25, "natural number", "0");
  assert.equal(renderProof(warrior), "Exists.intro 0 (Eq.refl 0)");
  assert.equal(isSolved(warrior), true);

  let mage = createProofState("∃ n : Nat, n = 0", []);
  mage = move(mage, "mage", 25, "use □");
  mage = inputMove(mage, "mage", 25, "natural number", "0");
  assert.equal(currentTarget(mage), "0 = 0");
  mage = move(mage, "mage", 25, "rfl");
  assert.equal(isSolved(mage), true);
});

test("level seven teaches And.left through ordinary application", () => {
  let state = createProofState("P ∧ Q → P", ["P Q : Prop"]);
  const openingLabels = getMoveChoices(state, "warrior", 7).map((choice) => choice.label);
  assert.ok(openingLabels.includes("And.left"));
  assert.equal(openingLabels.includes("And.left □"), false);

  const direct = move(state, "warrior", 7, "And.left");
  assert.equal(renderProof(direct), "And.left");
  assert.equal(isSolved(direct), true);

  state = move(state, "warrior", 7, "fun h => □");
  const initialLabels = getMoveChoices(state, "warrior", 7).map((choice) => choice.label);
  assert.ok(initialLabels.includes("(□ □)"));
  assert.equal(initialLabels.includes("□.□"), false);
  assert.equal(initialLabels.includes("h.left"), false);

  state = move(state, "warrior", 7, "(□ □)");
  assert.ok(getMoveChoices(state, "warrior", 7).some((choice) => choice.label === "And.left"));
  state = move(state, "warrior", 7, "And.left");
  assert.ok(getMoveChoices(state, "warrior", 7).some((choice) => choice.label === "h"));
  state = move(state, "warrior", 7, "h");
  assert.equal(renderProof(state), "fun h => And.left h");
  assert.equal(isSolved(state), true);
});

test("goal-derived projection functions appear before their inputs are introduced", () => {
  const rightState = createProofState("P ∧ Q → Q", ["P Q : Prop"]);
  assert.ok(getMoveChoices(rightState, "warrior", 8).some((choice) => choice.label === "And.right"));

  const iffState = createProofState("(P ↔ Q) → P → Q", ["P Q : Prop"]);
  assert.ok(getMoveChoices(iffState, "warrior", 13).some((choice) => choice.label === "Iff.mp"));
});

test("level eight dot notation fills its source and function separately", () => {
  let state = createProofState("P ∧ Q → P", ["P Q : Prop"]);
  state = move(state, "warrior", 8, "fun h => □");
  const initialLabels = getMoveChoices(state, "warrior", 8).map((choice) => choice.label);
  assert.ok(initialLabels.includes("□.□"));
  assert.equal(initialLabels.includes("h.left"), false);

  state = move(state, "warrior", 8, "□.□");
  assert.equal(renderProof(state), "fun h => □.□");
  assert.deepEqual(getMoveChoices(state, "warrior", 8).map((choice) => choice.label), ["h"]);
  state = move(state, "warrior", 8, "h");
  assert.equal(renderProof(state), "fun h => h.□");
  assert.deepEqual(getMoveChoices(state, "warrior", 8).map((choice) => choice.label), ["left"]);
  state = move(state, "warrior", 8, "left");
  assert.equal(renderProof(state), "fun h => h.left");
  assert.equal(isSolved(state), true);
});

test("dot notation excludes arbitrary namespaced functions", () => {
  const state = createProofState("P", [
    "Box : Type",
    "P : Prop",
    "x : Box",
    "Box.open : Box → P",
  ]);
  const labels = getMoveChoices(state, "warrior", 8).map((choice) => choice.label);
  assert.equal(labels.includes("□.□"), false);
  assert.equal(labels.includes("x.open"), false);
});

test("dot notation retains both Iff projections", () => {
  let state = createProofState("(P ↔ Q) → (P → Q)", ["P Q : Prop"]);
  state = move(state, "warrior", 13, "fun h => □");
  state = move(state, "warrior", 13, "□.□");
  state = move(state, "warrior", 13, "h");
  state = move(state, "warrior", 13, "mp");
  assert.equal(renderProof(state), "fun h => h.mp");
  assert.equal(isSolved(state), true);

  state = createProofState("(P ↔ Q) → (Q → P)", ["P Q : Prop"]);
  state = move(state, "warrior", 13, "fun h => □");
  state = move(state, "warrior", 13, "□.□");
  state = move(state, "warrior", 13, "h");
  state = move(state, "warrior", 13, "mpr");
  assert.equal(renderProof(state), "fun h => h.mpr");
  assert.equal(isSolved(state), true);
});

test("application metavariables resolve across linked holes on level fourteen", () => {
  let state = createProofState("P ∧ ¬P → False", ["P : Prop"]);
  state = move(state, "warrior", 14, "fun h => □");
  state = move(state, "warrior", 14, "(□ □)");

  assert.equal(currentTarget(state), "(?0 → False)");
  assert.ok(getMoveChoices(state, "warrior", 14).some((choice) => choice.label.startsWith("fun ")));

  state = move(state, "warrior", 14, "□.□");
  state = move(state, "warrior", 14, "h");
  state = move(state, "warrior", 14, "right");

  assert.equal(currentTarget(state), "P");
  state = move(state, "warrior", 14, "□.□");
  state = move(state, "warrior", 14, "h");
  state = move(state, "warrior", 14, "left");
  assert.equal(renderProof(state), "fun h => h.right h.left");
  assert.equal(isSolved(state), true);
});

test("Or.elim is supplied through three ordinary applications", () => {
  let state = createProofState(
    "(P → R) → (Q → R) → P ∨ Q → R",
    ["P Q R : Prop"],
  );
  state = move(state, "warrior", 10, "fun hPR => □");
  state = move(state, "warrior", 10, "fun hQR => □");
  state = move(state, "warrior", 10, "fun h => □");
  state = move(state, "warrior", 10, "(□ □)");
  state = move(state, "warrior", 10, "(□ □)");
  state = move(state, "warrior", 10, "(□ □)");
  state = move(state, "warrior", 10, "Or.elim");
  assert.equal(renderProof(state), "fun hPR => fun hQR => fun h => Or.elim □ □ □");
  assert.deepEqual(
    renderProofParts(state).filter((part) => part.hole).map((part) => part.active),
    [true, false, false],
  );
  assert.ok(getMoveChoices(state, "warrior", 10).some((choice) => choice.label === "h"));
  state = move(state, "warrior", 10, "h");
  state = move(state, "warrior", 10, "hPR");
  state = move(state, "warrior", 10, "hQR");
  assert.equal(renderProof(state), "fun hPR => fun hQR => fun h => Or.elim h hPR hQR");
  assert.equal(isSolved(state), true);
});

test("Or.elim introduces fresh alternatives resolved by its disjunction argument", () => {
  let state = createProofState("(P ∨ Q) ∨ R → R ∨ Q ∨ P", ["P Q R : Prop"]);
  state = move(state, "warrior", 32, "fun h => □");
  state = move(state, "warrior", 32, "(□ □)");
  state = move(state, "warrior", 32, "(□ □)");
  state = move(state, "warrior", 32, "(□ □)");
  state = move(state, "warrior", 32, "Or.elim");
  assert.equal(currentTarget(state), "?3 ∨ ?4");
  state = move(state, "warrior", 32, "h");
  assert.equal(currentTarget(state), "(P ∨ Q) → R ∨ Q ∨ P");
  state = move(state, "warrior", 32, "fun h2 => □");
  state = move(state, "warrior", 32, "(□ □)");
  state = move(state, "warrior", 32, "(□ □)");
  state = move(state, "warrior", 32, "(□ □)");
  state = move(state, "warrior", 32, "Or.elim");
  state = move(state, "warrior", 32, "h2");
  assert.equal(currentTarget(state), "P → R ∨ Q ∨ P");
});

test("proof rendering keeps parentheses around a lambda used as a function", () => {
  let state = createProofState("P", ["P : Prop", "hp : P"]);
  state = move(state, "warrior", 4, "(□ □)");
  state = move(state, "warrior", 4, "fun h => □");
  state = move(state, "warrior", 4, "hp");
  state = move(state, "warrior", 4, "hp");
  assert.equal(renderProof(state), "(fun h => hp) hp");
});

test("dependent universal application infers and filters its argument", () => {
  let state = createProofState(
    "(∀ x, P x) → P a",
    ["α : Type", "P : α → Prop", "a : α"],
  );
  state = move(state, "warrior", 21, "fun h_Px => □");
  state = move(state, "warrior", 21, "(□ □)");
  state = move(state, "warrior", 21, "h_Px");
  assert.ok(getMoveChoices(state, "warrior", 21).some((item) => item.label === "a"));
  state = move(state, "warrior", 21, "a");
  assert.equal(isSolved(state), true);
});

test("Eq.refl matches a goal modulo definitional equality on level thirty-eight", () => {
  let state = createProofState("∀ n : Nat, n + 0 = n", []);
  state = move(state, "warrior", 38, "fun n => □");
  state = move(state, "warrior", 38, "(□ □)");
  assert.ok(getMoveChoices(state, "warrior", 38).some((choice) => choice.label === "Eq.refl"));
  state = move(state, "warrior", 38, "Eq.refl");
  assert.equal(currentTarget(state), "Nat");
  assert.deepEqual(getMoveChoices(state, "warrior", 38).map((choice) => choice.label), ["n"]);
  state = move(state, "warrior", 38, "n");
  assert.equal(renderProof(state), "fun n => Eq.refl n");
  assert.equal(isSolved(state), true);
});

test("Eq.trans introduces a fresh middle term instead of choosing one from the environment", () => {
  let state = createProofState("0 + Nat.succ k = Nat.succ k", ["k n : Nat"]);
  state = move(state, "warrior", 39, "(□ □)");
  state = move(state, "warrior", 39, "(□ □)");
  state = move(state, "warrior", 39, "Eq.trans");
  assert.match(currentTarget(state), /^0 \+ Nat\.succ k = \?\d+$/);
});

test("congrArg unifies with a partially unknown equality result", () => {
  let state = createProofState("Nat.succ k = ?u7", ["k : Nat"]);
  state = move(state, "warrior", 39, "(□ □)");
  state = move(state, "warrior", 39, "(□ □)");
  assert.ok(getMoveChoices(state, "warrior", 39).some((choice) => choice.label === "congrArg"));

  state = move(state, "warrior", 39, "congrArg");
  assert.equal(currentTarget(state), "Nat → Nat");
  assert.ok(getMoveChoices(state, "warrior", 39).some((choice) => choice.label === "Nat.succ"));

  state = move(state, "warrior", 39, "Nat.succ");
  assert.match(currentTarget(state), /^k = \?\d+$/);
  assert.match(renderProof(state), /^congrArg Nat\.succ /);
});

test("catalogue unification normalizes recursive terms before offering congrArg", () => {
  let state = createProofState(
    "0 + Nat.succ k = Nat.succ k",
    ["k : Nat", "ih : 0 + k = k"],
  );
  state = move(state, "warrior", 39, "(□ □)");
  state = move(state, "warrior", 39, "(□ □)");
  assert.ok(getMoveChoices(state, "warrior", 39).some((choice) => choice.label === "congrArg"));

  state = move(state, "warrior", 39, "congrArg");
  assert.equal(currentTarget(state), "Nat → Nat");
  state = move(state, "warrior", 39, "Nat.succ");
  assert.equal(currentTarget(state), "0 + k = k");
  state = move(state, "warrior", 39, "ih");
  assert.equal(renderProof(state), "congrArg Nat.succ ih");
  assert.equal(isSolved(state), true);
});

test("congrArg is offered for a normalized list constructor application", () => {
  let state = createProofState(
    "(head :: tail) ++ [] = ?u10",
    ["α : Type", "head : α", "tail : List α", "h : tail ++ [] = tail"],
  );
  state = move(state, "warrior", 43, "(□ □)");
  state = move(state, "warrior", 43, "(□ □)");

  assert.ok(getMoveChoices(state, "warrior", 43).some((choice) => choice.label === "congrArg"));
  state = move(state, "warrior", 43, "congrArg");
  assert.equal(currentTarget(state), "List α → List α");
  assert.ok(getMoveChoices(state, "warrior", 43).some((choice) => choice.label === "List.cons head"));
  state = move(state, "warrior", 43, "List.cons head");
  assert.match(currentTarget(state), /^tail \+\+ \[\] = \?\d+$/);
  state = move(state, "warrior", 43, "h");

  assert.equal(renderProof(state), "congrArg (List.cons head) h");
  assert.equal(isSolved(state), true);
});

test("Eq.refl sees the definitional reduction of List.length on level forty-five", () => {
  let state = createProofState(
    "([] ++ []).length = [].length + [].length",
    ["α : Type"],
  );
  state = move(state, "warrior", 45, "(□ □)");

  assert.ok(getMoveChoices(state, "warrior", 45).some((choice) => choice.label === "Eq.refl"));
  state = move(state, "warrior", 45, "Eq.refl");
  assert.equal(currentTarget(state), "Nat");
  assert.ok(getMoveChoices(state, "warrior", 45).some((choice) => choice.label === "0"));
  state = move(state, "warrior", 45, "0");

  assert.equal(renderProof(state), "Eq.refl 0");
  assert.equal(isSolved(state), true);
});

test("a level forty-five hypothesis unifies across length notation and application form", () => {
  const state = createProofState(
    "List.length tail = 0 + List.length tail",
    [
      "α : Type",
      "tail : List α",
      "h : ([] ++ tail).length = [].length + tail.length",
    ],
  );

  assert.equal(termSyntaxKind("List.length tail"), "application");
  assert.ok(getMoveChoices(state, "warrior", 45).some((choice) => choice.label === "h"));
  const solved = move(state, "warrior", 45, "h");
  assert.equal(renderProof(solved), "h");
  assert.equal(isSolved(solved), true);
});

test("unification normalizes terms inside applications and list expressions", () => {
  const nested = createProofState(
    "P (0 + Nat.succ k)",
    ["P : Nat → Prop", "k : Nat", "h : P (Nat.succ (0 + k))"],
  );
  assert.ok(getMoveChoices(nested, "warrior", 39).some((choice) => choice.label === "h"));

  let list = createProofState(
    "[] ++ xs = xs",
    ["α : Type", "xs : List α"],
  );
  list = move(list, "warrior", 43, "(□ □)");
  assert.ok(getMoveChoices(list, "warrior", 43).some((choice) => choice.label === "Eq.refl"));
});

test("definitional normalization follows recursive equations without algebraic reassociation", () => {
  const offersEqRefl = (theorem, context = []) => {
    let state = createProofState(theorem, context);
    state = move(state, "warrior", 43, "(□ □)");
    return getMoveChoices(state, "warrior", 43).some((choice) => choice.label === "Eq.refl");
  };

  assert.equal(offersEqRefl("n + 0 = n", ["n : Nat"]), true);
  assert.equal(
    offersEqRefl("n + Nat.succ m = Nat.succ (n + m)", ["n m : Nat"]),
    true,
  );
  assert.equal(offersEqRefl("0 + n = n", ["n : Nat"]), false);
  assert.equal(
    offersEqRefl("(a + b) + c = a + (b + c)", ["a b c : Nat"]),
    false,
  );
  assert.equal(offersEqRefl("[] ++ xs = xs", ["α : Type", "xs : List α"]), true);
  assert.equal(offersEqRefl("xs ++ [] = xs", ["α : Type", "xs : List α"]), false);
  assert.equal(offersEqRefl("[].length = 0", ["α : Type"]), true);
  assert.equal(
    offersEqRefl(
      "(head :: tail).length = Nat.succ tail.length",
      ["α : Type", "head : α", "tail : List α"],
    ),
    true,
  );
});

test("Eq.refl offers only the inferred normal-form argument", () => {
  let state = createProofState(
    "∀ n m : Nat, n + Nat.succ m = Nat.succ (n + m)",
    [],
  );
  state = move(state, "warrior", 40, "fun n => □");
  state = move(state, "warrior", 40, "fun m => □");
  state = move(state, "warrior", 40, "(□ □)");
  state = move(state, "warrior", 40, "Eq.refl");

  assert.deepEqual(
    getMoveChoices(state, "warrior", 40).map((choice) => choice.label),
    ["Nat.succ (n + m)"],
  );
  state = move(state, "warrior", 40, "Nat.succ (n + m)");
  assert.equal(renderProof(state), "fun n => fun m => Eq.refl (Nat.succ (n + m))");
  assert.equal(isSolved(state), true);
});

test("Nat.rec chooses its induction variable in the final argument", () => {
  let state = createProofState(
    "∀ c b a : Nat, (a + b) + c = a + (b + c)",
    [],
  );
  state = move(state, "warrior", 41, "fun c => □");
  state = move(state, "warrior", 41, "fun b => □");
  state = move(state, "warrior", 41, "fun a => □");
  state = move(state, "warrior", 41, "(□ □)");
  state = move(state, "warrior", 41, "(□ □)");
  state = move(state, "warrior", 41, "(□ □)");
  state = move(state, "warrior", 41, "Nat.rec");

  assert.equal(currentTarget(state), "Nat");
  assert.deepEqual(
    getMoveChoices(state, "warrior", 41).map((choice) => choice.label),
    ["c", "b", "a"],
  );
  state = move(state, "warrior", 41, "c");
  assert.equal(currentTarget(state), "a + b + 0 = a + (b + 0)");
  assert.equal(renderProof(state), "fun c => fun b => fun a => Nat.rec □ □ c");
});

test("Nat.rec uses its genuine dependent type before later theorem binders are introduced", () => {
  assert.equal(
    libraryTermTypes["Nat.rec"],
    "∀ {motive : Nat → Sort u}, motive 0 → " +
      "(∀ n : Nat, motive n → motive (Nat.succ n)) → ∀ value : Nat, motive value",
  );

  let state = createProofState(
    "∀ c b a : Nat, (a + b) + c = a + (b + c)",
    [],
  );
  state = move(state, "warrior", 41, "fun c => □");
  state = move(state, "warrior", 41, "(□ □)");
  state = move(state, "warrior", 41, "(□ □)");
  state = move(state, "warrior", 41, "(□ □)");

  assert.equal(currentTarget(state), "(?2 → ?1 → ?0 → ∀ b : Nat, ∀ a : Nat, a + b + c = a + (b + c))");
  assert.ok(getMoveChoices(state, "warrior", 41).some((choice) => choice.label === "Nat.rec"));
  state = move(state, "warrior", 41, "Nat.rec");
  assert.deepEqual(getMoveChoices(state, "warrior", 41).map((choice) => choice.label), ["c"]);
  state = move(state, "warrior", 41, "c");
  assert.equal(
    currentTarget(state),
    "∀ b : Nat, ∀ a : Nat, a + b + 0 = a + (b + 0)",
  );
});

test("List.rec uses its genuine dependent type before the list binder is introduced", () => {
  assert.equal(
    libraryTermTypes["List.rec"],
    "∀ {α : Type u}, ∀ {motive : List α → Sort v}, motive [] → " +
      "(∀ head : α, ∀ tail : List α, motive tail → motive (head :: tail)) → " +
      "∀ value : List α, motive value",
  );

  let state = createProofState("∀ xs : List α, xs ++ [] = xs", ["α : Type"]);
  state = move(state, "warrior", 43, "(□ □)");
  state = move(state, "warrior", 43, "(□ □)");

  assert.ok(getMoveChoices(state, "warrior", 43).some((choice) => choice.label === "List.rec"));
  state = move(state, "warrior", 43, "List.rec");
  assert.equal(currentTarget(state), "[] ++ [] = []");
  assert.equal(renderProof(state), "List.rec □ □");
});

test("term syntax keeps list append distinct from natural addition", () => {
  assert.equal(termSyntaxKind("[] ++ []"), "append");
  assert.equal(termSyntaxKind("n + m"), "add");

  let state = createProofState("∀ xs : List α, xs ++ [] = xs", ["α : Type"]);
  for (const label of ["(□ □)", "(□ □)", "List.rec", "(□ □)", "Eq.refl"]) {
    state = move(state, "warrior", 43, label);
  }
  assert.equal(renderProof(state), "List.rec (Eq.refl □) □");
  assert.equal(currentTarget(state), "List α");
  assert.deepEqual(getMoveChoices(state, "warrior", 43).map((choice) => choice.label), ["[]"]);
  state = move(state, "warrior", 43, "[]");
  assert.equal(
    currentTarget(state),
    "∀ head : α, ∀ tail : List α, (tail ++ [] = tail) → (head :: tail) ++ [] = head :: tail",
  );
  assert.doesNotMatch(currentTarget(state), /\?\d+/);
});

test("metavariable beta reduction traverses operator-bearing arguments", () => {
  const cases = [
    {
      goal: "?u0 (head :: tail)",
      replacement: "fun value => value ++ [] = value",
      expected: "(head :: tail) ++ [] = head :: tail",
    },
    {
      goal: "?u0 (head :: tail)",
      replacement: "fun value => sum value = 0",
      expected: "sum (head :: tail) = 0",
    },
    {
      goal: "?u0 (xs ++ ys)",
      replacement: "fun value => P value",
      expected: "P (xs ++ ys)",
    },
    {
      goal: "?u0 (a + b)",
      replacement: "fun value => value = value",
      expected: "a + b = a + b",
    },
    {
      goal: "?u0 xs.length",
      replacement: "fun value => value = 0",
      expected: "List.length xs = 0",
    },
  ];
  const context = [
    "α : Type", "head : α", "tail xs ys : List α", "a b : Nat", "P : List α → Prop",
  ];
  for (const item of cases) {
    const state = createProofState(item.goal, context);
    state.substitutions[0] = item.replacement;
    assert.equal(currentTarget(state), item.expected);
  }
});

test("every named catalogue constant has one fixed polymorphic type", () => {
  assert.deepEqual(Object.keys(libraryTermTypes), [
    "And.intro", "And.left", "And.right",
    "Or.inl", "Or.inr", "Or.elim", "False.elim",
    "Iff.intro", "Iff.mp", "Iff.mpr", "Classical.byContradiction",
    "Eq.refl", "Exists.intro", "Exists.elim", "Eq.symm", "Eq.trans",
    "congrArg", "Eq.mp", "Classical.em",
    "Nat.rec", "List.rec", "Nat.succ", "List.cons",
    "Nat.add_zero", "Nat.add_succ", "Nat.succ_add", "Nat.add_comm",
    "List.append_nil", "List.append_assoc", "List.length_append",
    "sum", "sum_append", "Nat.add", "Nat.zero_add", "Nat.add_assoc", "Nat.add_left_comm",
    "List.Perm.rec", "List.replicate", "Nat.mul", "Nat.zero_mul", "Nat.succ_mul", "sum_replicate", "repeatEach", "Nat.mul_add",
  ]);
  for (const type of Object.values(libraryTermTypes)) {
    assert.doesNotMatch(type, /\?u\d+/);
  }
});

test("implicit list theorem arguments are inferred from the goal", () => {
  const state = createProofState(
    "(xs ++ ys).length = xs.length + ys.length",
    ["α : Type", "xs ys : List α"],
  );
  assert.ok(
    getMoveChoices(state, "warrior", 46).some((choice) => choice.label === "List.length_append"),
  );
});

test("mage apply instantiates canonical implicit catalogue parameters", () => {
  let state = createProofState("P ∧ Q → P", ["P Q : Prop"]);
  state = move(state, "mage", 7, "intro h");
  state = move(state, "mage", 7, "apply □");
  state = move(state, "mage", 7, "And.left");
  assert.match(currentTarget(state), /^P ∧ \?\d+$/);
  state = move(state, "mage", 7, "exact □");
  state = move(state, "mage", 7, "h");
  assert.equal(isSolved(state), true);
});

test("mage apply jointly infers explicit dependent theorem arguments", () => {
  let state = createProofState(
    "x + (sum xs + sum ys) = x + sum xs + sum ys",
    ["x : Nat", "xs ys : List Nat"],
  );
  state = move(state, "mage", 46, "symm");
  state = move(state, "mage", 46, "apply □");
  assert.ok(getMoveChoices(state, "mage", 46).some((choice) => choice.label === "Nat.add_assoc"));
  state = move(state, "mage", 46, "Nat.add_assoc");
  assert.equal(isSolved(state), true);
  assert.deepEqual(renderTacticProofLines(state), ["by", "  symm", "  apply Nat.add_assoc"]);
});

test("mage apply offers only arithmetic theorems whose conclusions strictly unify", () => {
  let state = createProofState(
    "sum l + y = y + sum l",
    ["x y : Nat", "l : List Nat"],
  );
  state = move(state, "mage", 47, "apply □");
  const labels = getMoveChoices(state, "mage", 47).map((choice) => choice.label);
  assert.ok(labels.includes("Nat.add_comm"));
  assert.equal(labels.includes("Nat.add_assoc"), false);
  assert.equal(labels.includes("Nat.add_left_comm"), false);
  assert.equal(labels.some((label) => label !== "Nat.add_comm" && label.endsWith(".add_comm")), false);
});

test("ordinary metavariables can be function-typed and solved by application", () => {
  let state = createProofState("?u0 a", [
    "α : Type",
    "P : α → Prop",
    "a : α",
    "h : P a",
  ]);
  state = {
    ...state,
    nextMetaId: 1,
    metaTypes: { 0: "α → Prop" },
  };

  state = move(state, "warrior", 41, "h");
  assert.equal(state.substitutions[0], "fun a => P a");
  assert.equal(isSolved(state), true);
});

test("application arguments are inferred jointly across dependent binders", () => {
  let state = createProofState(
    "(a + b) + n = a + (b + n)",
    [
      "a b n : Nat",
      "hatbn : ∀ b : Nat, ∀ a : Nat, (a + b) + n = a + (b + n)",
    ],
  );
  state = move(state, "warrior", 41, "(□ □)");
  state = move(state, "warrior", 41, "(□ □)");

  assert.equal(currentTarget(state), "(?1 → ?0 → (a + b) + n = a + (b + n))");
  assert.ok(getMoveChoices(state, "warrior", 41).some((choice) => choice.label === "hatbn"));
  state = move(state, "warrior", 41, "hatbn");
  assert.deepEqual(getMoveChoices(state, "warrior", 41).map((choice) => choice.label), ["b"]);
  state = move(state, "warrior", 41, "b");
  assert.deepEqual(getMoveChoices(state, "warrior", 41).map((choice) => choice.label), ["a"]);
  state = move(state, "warrior", 41, "a");

  assert.equal(renderProof(state), "hatbn b a");
  assert.equal(isSolved(state), true);
});

test("catalogue terms are not offered when their explicit arity cannot unify", () => {
  const state = createProofState("?u8 → Nat.succ k = ?u7", ["k : Nat"]);
  assert.equal(
    getMoveChoices(state, "warrior", 39).some((choice) => choice.label === "congrArg"),
    false,
  );
});

test("other polymorphic eliminators remain generic until their arguments are supplied", () => {
  let conjunction = createProofState("P ∧ Q → P", ["P Q : Prop"]);
  conjunction = move(conjunction, "warrior", 7, "fun h => □");
  conjunction = move(conjunction, "warrior", 7, "(□ □)");
  conjunction = move(conjunction, "warrior", 7, "And.left");
  assert.match(currentTarget(conjunction), /^P ∧ \?\d+$/);
  conjunction = move(conjunction, "warrior", 7, "h");
  assert.equal(isSolved(conjunction), true);

  let iff = createProofState("Q", ["P Q : Prop", "hIff : P ↔ Q", "hP : P"]);
  iff = move(iff, "warrior", 13, "(□ □)");
  iff = move(iff, "warrior", 13, "(□ □)");
  iff = move(iff, "warrior", 13, "Iff.mp");
  assert.match(currentTarget(iff), /^\?\d+ ↔ Q$/);
  iff = move(iff, "warrior", 13, "hIff");
  assert.equal(currentTarget(iff), "P");

  let exists = createProofState("Q", [
    "α : Type", "P : α → Prop", "Q : Prop",
    "hEx : ∃ x : α, P x", "hRule : ∀ x : α, P x → Q",
  ]);
  exists = move(exists, "warrior", 24, "(□ □)");
  exists = move(exists, "warrior", 24, "(□ □)");
  exists = move(exists, "warrior", 24, "Exists.elim");
  assert.match(currentTarget(exists), /^∃ x : \?\d+, \?\d+ x$/);
  exists = move(exists, "warrior", 24, "hEx");
  assert.equal(currentTarget(exists), "∀ a : α, P a → Q");

  let transport = createProofState("P b", [
    "α : Type", "P : α → Prop", "a b : α",
    "hEq : P a = P b", "hPa : P a",
  ]);
  transport = move(transport, "warrior", 29, "(□ □)");
  transport = move(transport, "warrior", 29, "(□ □)");
  transport = move(transport, "warrior", 29, "Eq.mp");
  assert.match(currentTarget(transport), /^\?\d+ = P b$/);
  transport = move(transport, "warrior", 29, "hEq");
  assert.equal(currentTarget(transport), "P a");
});

test("the mage handles falsehood with tactics and a simple hypothesis term", () => {
  let state = createProofState("False → P", ["P : Prop"]);
  state = move(state, "mage", 11, "intro hFalse");
  state = move(state, "mage", 11, "exfalso");
  state = move(state, "mage", 11, "exact □");
  state = move(state, "mage", 11, "hFalse");
  assert.equal(isSolved(state), true);

  let disjunctionState = createProofState("P ∨ False → P", ["P : Prop"]);
  disjunctionState = move(disjunctionState, "mage", 18, "intro h");
  disjunctionState = move(disjunctionState, "mage", 18, "cases □");
  disjunctionState = move(disjunctionState, "mage", 18, "h");
  disjunctionState = move(disjunctionState, "mage", 18, "exact □");
  disjunctionState = move(disjunctionState, "mage", 18, "hP");
  assert.equal(
    getMoveChoices(disjunctionState, "mage", 18).some((choice) => choice.label === "contradiction"),
    false,
  );
  disjunctionState = move(disjunctionState, "mage", 18, "exfalso");
  disjunctionState = move(disjunctionState, "mage", 18, "exact □");
  disjunctionState = move(disjunctionState, "mage", 18, "hFalse");
  assert.equal(isSolved(disjunctionState), true);

  let contradictionState = createProofState("¬P → P → Q", ["P Q : Prop"]);
  contradictionState = move(contradictionState, "mage", 37, "intro hnP");
  contradictionState = move(contradictionState, "mage", 37, "intro hP");
  contradictionState = move(contradictionState, "mage", 37, "contradiction");
  assert.equal(isSolved(contradictionState), true);
});

test("rewrite levels require rewriting beyond their earlier direct tactic patterns", () => {
  let iffState = createProofState(
    "(P ↔ Q) → P ∨ R → Q ∨ R",
    ["P Q R : Prop"],
  );
  iffState = move(iffState, "mage", 33, "intro h");
  iffState = move(iffState, "mage", 33, "intro h2");
  assert.equal(currentTarget(iffState), "Q ∨ R");
  assert.equal(getMoveChoices(iffState, "mage", 33).some((choice) => choice.label === "exact □"), false);
  assert.ok(getMoveChoices(iffState, "mage", 33).some((choice) => choice.label === "rw [← □]"));
  iffState = move(iffState, "mage", 33, "rw [← □]");
  iffState = move(iffState, "mage", 33, "h");
  assert.equal(currentTarget(iffState), "P ∨ R");
  iffState = move(iffState, "mage", 33, "exact □");
  iffState = move(iffState, "mage", 33, "h2");
  assert.equal(isSolved(iffState), true);

  let equalityState = createProofState(
    "a = b → g (f a) = g (f b)",
    ["α β γ : Type", "f : α → β", "g : β → γ", "a b : α"],
  );
  equalityState = move(equalityState, "mage", 34, "intro h");
  const oldCongruenceStep = move(equalityState, "mage", 34, "congr");
  assert.equal(currentTarget(oldCongruenceStep), "f a = f b");
  assert.equal(
    getMoveChoices(oldCongruenceStep, "mage", 34).some((choice) => choice.label === "exact □"),
    false,
  );
  assert.ok(getMoveChoices(equalityState, "mage", 34).some((choice) => choice.label === "rw [□]"));
  equalityState = move(equalityState, "mage", 34, "rw [□]");
  equalityState = move(equalityState, "mage", 34, "h");
  equalityState = move(equalityState, "mage", 34, "rfl");
  assert.equal(isSolved(equalityState), true);

  let compoundEqualityState = createProofState("sum l1 = sum l3", [
    "l1 l2 l3 : List Nat",
    "ih1 : sum l1 = sum l2",
    "ih2 : sum l2 = sum l3",
  ]);
  assert.ok(getMoveChoices(compoundEqualityState, "mage", 47).some((choice) => choice.label === "rw [□]"));
  const forwardRewrite = move(compoundEqualityState, "mage", 47, "rw [□]");
  assert.deepEqual(getMoveChoices(forwardRewrite, "mage", 47).map((choice) => choice.label), ["ih1"]);
  compoundEqualityState = move(forwardRewrite, "mage", 47, "ih1");
  assert.equal(currentTarget(compoundEqualityState), "sum l2 = sum l3");

  let reverseCompoundEqualityState = createProofState("sum l1 = sum l3", [
    "l1 l2 l3 : List Nat",
    "ih1 : sum l1 = sum l2",
    "ih2 : sum l2 = sum l3",
  ]);
  const reverseRewrite = move(reverseCompoundEqualityState, "mage", 47, "rw [← □]");
  assert.ok(getMoveChoices(reverseRewrite, "mage", 47).some((choice) => choice.label === "ih2"));
  reverseCompoundEqualityState = move(reverseRewrite, "mage", 47, "ih2");
  assert.equal(currentTarget(reverseCompoundEqualityState), "sum l1 = sum l2");

  let compoundPropositionState = createProofState("P (f a)", [
    "α β : Type", "P : β → Prop", "f : α → β", "a b : α",
    "hEq : f a = f b", "hProof : P (f b)",
  ]);
  compoundPropositionState = move(compoundPropositionState, "mage", 47, "rw [□]");
  compoundPropositionState = move(compoundPropositionState, "mage", 47, "hEq");
  assert.equal(currentTarget(compoundPropositionState), "P (f b)");

  let iffTermState = createProofState(
    "(P ↔ Q) → P ∨ R → Q ∨ R",
    ["P Q R : Prop"],
  );
  for (const label of [
    "fun h => □", "fun h2 => □",
    "(□ □)", "(□ □)", "(□ □)", "Or.elim", "h2",
    "fun hP => □", "(□ □)", "Or.inl", "(□ □)",
    "□.□", "h", "mp", "hP", "Or.inr",
  ]) {
    iffTermState = move(iffTermState, "warrior", 33, label);
  }
  assert.equal(
    renderProof(iffTermState),
    "fun h => fun h2 => Or.elim h2 (fun hP => Or.inl (h.mp hP)) Or.inr",
  );
  assert.equal(isSolved(iffTermState), true);

  let equalityTermState = createProofState(
    "a = b → g (f a) = g (f b)",
    ["α β γ : Type", "f : α → β", "g : β → γ", "a b : α"],
  );
  for (const label of [
    "fun h => □", "(□ □)", "(□ □)", "congrArg", "g",
    "(□ □)", "(□ □)", "congrArg", "f", "h",
  ]) {
    equalityTermState = move(equalityTermState, "warrior", 34, label);
  }
  assert.equal(renderProof(equalityTermState), "fun h => congrArg g (congrArg f h)");
  assert.equal(isSolved(equalityTermState), true);
});
