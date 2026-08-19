import { selectionsForLevel } from "./intended-selections.ts";

export type HeroClass = "warrior" | "mage";

export type MoveId =
  | "term.context" | "term.lambda" | "term.application" | "term.dot" | "term.naturalNumber"
  | "catalogue.andIntro" | "catalogue.andLeft" | "catalogue.andRight"
  | "catalogue.orIntro" | "catalogue.orElim" | "catalogue.falseElim"
  | "catalogue.iffIntro" | "catalogue.iffProjection" | "catalogue.byContradiction"
  | "catalogue.eqRefl" | "catalogue.existsIntro" | "catalogue.existsElim"
  | "catalogue.eqSymm" | "catalogue.eqTrans" | "catalogue.congrArg" | "catalogue.eqMp"
  | "catalogue.classicalEm" | "catalogue.recursor" | "catalogue.dataConstructors"
  | "catalogue.natAddZero" | "catalogue.natZeroAdd" | "catalogue.natAddSucc" | "catalogue.natSuccAdd"
  | "catalogue.natAddAssoc" | "catalogue.natAddComm"
  | "catalogue.listAppendNil" | "catalogue.listAppendAssoc" | "catalogue.listLengthAppend"
  | "catalogue.sum" | "catalogue.sumAppend" | "catalogue.natAddLemmas"
  | "catalogue.listPermRec" | "catalogue.natAddLeftComm"
  | "catalogue.listReplicate" | "catalogue.sumReplicate" | "catalogue.repeatEach"
  | "tactic.exact" | "tactic.intro" | "tactic.apply" | "tactic.constructor"
  | "tactic.orSides" | "tactic.cases" | "tactic.exfalso" | "tactic.contradiction"
  | "tactic.byContra" | "tactic.rfl" | "tactic.use" | "tactic.rcases"
  | "tactic.symm" | "tactic.trans" | "tactic.congr" | "tactic.subst"
  | "tactic.rewrite" | "tactic.byCases" | "tactic.induction" | "tactic.simp"
  | "tactic.simpa" | "tactic.calc";

export type CatalogueTermEntry = { name: string; type: string; group?: string };
export type CatalogueMoveDefinition =
  | { kind: "term"; group: string; entries: CatalogueTermEntry[] }
  | { kind: "tactic"; group: string; label: string; description: string };

// Unlock IDs control availability; this registry controls how unlocked moves are
// described in the library. New moves added to MoveId must add an entry here.
export const catalogueMoveDefinitions: Record<MoveId, CatalogueMoveDefinition> = {
  "term.context": { kind: "term", group: "Term building", entries: [{ name: "Environment term", type: "Any local term whose type matches the focused hole" }] },
  "term.lambda": { kind: "term", group: "Term building", entries: [{ name: "Function term", type: "A → B  becomes  fun x => proof-of-B" }] },
  "term.application": { kind: "term", group: "Term building", entries: [{ name: "Application", type: "(A → B) → A → B" }] },
  "term.dot": { kind: "term", group: "Term building", entries: [{ name: "Projection dot notation", type: "h.left, h.right, h.mp, and h.mpr abbreviate logical projections" }] },
  "term.naturalNumber": { kind: "term", group: "Term building", entries: [{ name: "Natural number", type: "Nat" }] },

  "catalogue.andIntro": { kind: "term", group: "Logic", entries: [{ name: "And.intro", type: "∀ {a b : Prop}, a → b → a ∧ b" }] },
  "catalogue.andLeft": { kind: "term", group: "Logic", entries: [{ name: "And.left", type: "∀ {a b : Prop}, a ∧ b → a" }] },
  "catalogue.andRight": { kind: "term", group: "Logic", entries: [{ name: "And.right", type: "∀ {a b : Prop}, a ∧ b → b" }] },
  "catalogue.orIntro": { kind: "term", group: "Logic", entries: [
    { name: "Or.inl", type: "∀ {a b : Prop}, a → a ∨ b" },
    { name: "Or.inr", type: "∀ {a b : Prop}, b → a ∨ b" },
  ] },
  "catalogue.orElim": { kind: "term", group: "Logic", entries: [{ name: "Or.elim", type: "∀ {a b c : Prop}, a ∨ b → (a → c) → (b → c) → c" }] },
  "catalogue.falseElim": { kind: "term", group: "Logic", entries: [{ name: "False.elim", type: "∀ {C : Sort u}, False → C" }] },
  "catalogue.iffIntro": { kind: "term", group: "Logic", entries: [{ name: "Iff.intro", type: "∀ {a b : Prop}, (a → b) → (b → a) → (a ↔ b)" }] },
  "catalogue.iffProjection": { kind: "term", group: "Logic", entries: [
    { name: "Iff.mp", type: "∀ {a b : Prop}, (a ↔ b) → a → b" },
    { name: "Iff.mpr", type: "∀ {a b : Prop}, (a ↔ b) → b → a" },
  ] },
  "catalogue.byContradiction": { kind: "term", group: "Logic", entries: [{ name: "Classical.byContradiction", type: "∀ {p : Prop}, (¬p → False) → p" }] },
  "catalogue.eqRefl": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "Eq.refl", type: "∀ {α : Sort u}, ∀ a : α, a = a" }] },
  "catalogue.existsIntro": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "Exists.intro", type: "∀ {α : Sort u}, ∀ {p : α → Prop}, ∀ w : α, p w → ∃ x : α, p x" }] },
  "catalogue.existsElim": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "Exists.elim", type: "∀ {α : Sort u}, ∀ {p : α → Prop}, ∀ {b : Prop}, (∃ x : α, p x) → (∀ a : α, p a → b) → b" }] },
  "catalogue.eqSymm": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "Eq.symm", type: "∀ {α : Sort u}, ∀ {a b : α}, a = b → b = a" }] },
  "catalogue.eqTrans": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "Eq.trans", type: "∀ {α : Sort u}, ∀ {a b c : α}, a = b → b = c → a = c" }] },
  "catalogue.congrArg": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "congrArg", type: "∀ {α : Sort u}, ∀ {β : Sort v}, ∀ {a1 a2 : α}, ∀ f : α → β, a1 = a2 → f a1 = f a2" }] },
  "catalogue.eqMp": { kind: "term", group: "Equality & quantifiers", entries: [{ name: "Eq.mp", type: "∀ {α β : Sort u}, α = β → α → β" }] },
  "catalogue.classicalEm": { kind: "term", group: "Logic", entries: [{ name: "Classical.em", type: "∀ p : Prop, p ∨ ¬p" }] },
  "catalogue.recursor": { kind: "term", group: "Recursion", entries: [
    { name: "Nat.rec", group: "Nat", type: "∀ {motive : Nat → Sort u}, motive 0 → (∀ n : Nat, motive n → motive (Nat.succ n)) → ∀ value : Nat, motive value" },
    { name: "List.rec", group: "List", type: "∀ {α : Type u}, ∀ {motive : List α → Sort v}, motive [] → (∀ head : α, ∀ tail : List α, motive tail → motive (head :: tail)) → ∀ value : List α, motive value" },
  ] },
  "catalogue.dataConstructors": { kind: "term", group: "Recursion", entries: [
    { name: "Nat.succ", group: "Nat", type: "Nat → Nat" },
    { name: "List.cons", group: "List", type: "∀ {α : Type u}, α → List α → List α" },
  ] },

  "catalogue.natAddZero": { kind: "term", group: "Nat", entries: [{ name: "Nat.add_zero", type: "∀ n : Nat, n + 0 = n" }] },
  "catalogue.natZeroAdd": { kind: "term", group: "Nat", entries: [{ name: "Nat.zero_add", type: "∀ n : Nat, 0 + n = n" }] },
  "catalogue.natAddSucc": { kind: "term", group: "Nat", entries: [{ name: "Nat.add_succ", type: "∀ n m : Nat, n + Nat.succ m = Nat.succ (n + m)" }] },
  "catalogue.natSuccAdd": { kind: "term", group: "Nat", entries: [{ name: "Nat.succ_add", type: "∀ n m : Nat, Nat.succ n + m = Nat.succ (n + m)" }] },
  "catalogue.natAddAssoc": { kind: "term", group: "Nat", entries: [{ name: "Nat.add_assoc", type: "∀ a b c : Nat, (a + b) + c = a + (b + c)" }] },
  "catalogue.natAddComm": { kind: "term", group: "Nat", entries: [{ name: "Nat.add_comm", type: "∀ n m : Nat, n + m = m + n" }] },
  "catalogue.listAppendNil": { kind: "term", group: "List", entries: [{ name: "List.append_nil", type: "∀ {α : Type u}, ∀ as : List α, as ++ [] = as" }] },
  "catalogue.listAppendAssoc": { kind: "term", group: "List", entries: [{ name: "List.append_assoc", type: "∀ {α : Type u}, ∀ as bs cs : List α, (as ++ bs) ++ cs = as ++ (bs ++ cs)" }] },
  "catalogue.listLengthAppend": { kind: "term", group: "List", entries: [{ name: "List.length_append", type: "∀ {α : Type u}, ∀ {as bs : List α}, (as ++ bs).length = as.length + bs.length" }] },
  "catalogue.sum": { kind: "term", group: "List", entries: [{ name: "sum", type: "List Nat → Nat" }] },
  "catalogue.sumAppend": { kind: "term", group: "List", entries: [{ name: "sum_append", type: "∀ xs ys : List Nat, sum (xs ++ ys) = sum xs + sum ys" }] },
  "catalogue.natAddLemmas": { kind: "term", group: "Nat", entries: [
    { name: "Nat.add", type: "Nat → Nat → Nat" },
    { name: "Nat.zero_add", type: "∀ n : Nat, 0 + n = n" },
    { name: "Nat.add_assoc", type: "∀ a b c : Nat, (a + b) + c = a + (b + c)" },
  ] },
  "catalogue.listPermRec": { kind: "term", group: "List", entries: [
    { name: "List.Perm.rec", group: "List", type: "∀ {α : Type u}, ∀ {motive : ∀ xs ys : List α, List.Perm xs ys → Prop}, motive [] [] (List.Perm.refl []) → (∀ x : α, ∀ {l1 l2 : List α}, ∀ h : List.Perm l1 l2, motive l1 l2 h → motive (x :: l1) (x :: l2) (List.Perm.cons x h)) → (∀ x y : α, ∀ l : List α, motive (y :: x :: l) (x :: y :: l) (List.Perm.swap x y l)) → (∀ {l1 l2 l3 : List α}, ∀ h1 : List.Perm l1 l2, ∀ h2 : List.Perm l2 l3, motive l1 l2 h1 → motive l2 l3 h2 → motive l1 l3 (List.Perm.trans h1 h2)) → ∀ {xs ys : List α}, ∀ h : List.Perm xs ys, motive xs ys h" },
  ] },
  "catalogue.natAddLeftComm": { kind: "term", group: "Nat", entries: [
    { name: "Nat.add_left_comm", group: "Nat", type: "∀ a b c : Nat, a + (b + c) = b + (a + c)" },
  ] },
  "catalogue.listReplicate": { kind: "term", group: "List", entries: [
    { name: "List.replicate", group: "List", type: "∀ {α : Type u}, Nat → α → List α" },
    { name: "Nat.mul", group: "Nat", type: "Nat → Nat → Nat" },
    { name: "Nat.zero_mul", group: "Nat", type: "∀ n : Nat, 0 * n = 0" },
    { name: "Nat.succ_mul", group: "Nat", type: "∀ n x : Nat, Nat.succ n * x = n * x + x" },
  ] },
  "catalogue.sumReplicate": { kind: "term", group: "List", entries: [
    { name: "sum_replicate", type: "∀ n x : Nat, sum (List.replicate n x) = n * x" },
  ] },
  "catalogue.repeatEach": { kind: "term", group: "List", entries: [
    { name: "repeatEach", type: "Nat → List Nat → List Nat" },
    { name: "Nat.mul_add", group: "Nat", type: "∀ n a b : Nat, n * (a + b) = n * a + n * b" },
  ] },

  "tactic.exact": { kind: "tactic", group: "Core tactics", label: "exact", description: "Closes the current goal with a term of exactly the required type." },
  "tactic.intro": { kind: "tactic", group: "Core tactics", label: "intro", description: "Introduces an implication premise or universally quantified value into the context." },
  "tactic.apply": { kind: "tactic", group: "Core tactics", label: "apply", description: "Uses a function whose conclusion matches the goal and creates goals for its premises." },
  "tactic.constructor": { kind: "tactic", group: "Logic", label: "constructor", description: "Builds a conjunction or equivalence by opening one goal for each constructor field." },
  "tactic.orSides": { kind: "tactic", group: "Logic", label: "left / right", description: "Chooses the left or right branch when proving a disjunction." },
  "tactic.cases": { kind: "tactic", group: "Logic", label: "cases", description: "Splits structured evidence into one goal for each possible constructor." },
  "tactic.exfalso": { kind: "tactic", group: "Logic", label: "exfalso", description: "Changes the current goal to False, which can prove any proposition." },
  "tactic.contradiction": { kind: "tactic", group: "Logic", label: "contradiction", description: "Closes a goal when the context contains incompatible evidence." },
  "tactic.byContra": { kind: "tactic", group: "Logic", label: "by_contra", description: "Assumes the negation of the goal and asks you to derive False." },
  "tactic.rfl": { kind: "tactic", group: "Equality", label: "rfl", description: "Closes an equality whose two sides become definitionally equal." },
  "tactic.use": { kind: "tactic", group: "Quantifiers", label: "use", description: "Chooses a witness for an existential goal, leaving its property to prove." },
  "tactic.rcases": { kind: "tactic", group: "Quantifiers", label: "rcases", description: "Unpacks structured evidence and names its contained values and proofs." },
  "tactic.symm": { kind: "tactic", group: "Equality", label: "symm", description: "Reverses the two sides of an equality goal." },
  "tactic.trans": { kind: "tactic", group: "Equality", label: "trans", description: "Splits an equality goal through a chosen intermediate expression." },
  "tactic.congr": { kind: "tactic", group: "Equality", label: "congr", description: "Reduces equality between matching function applications to equality of their arguments." },
  "tactic.subst": { kind: "tactic", group: "Equality", label: "subst", description: "Replaces an equal value throughout the goal and local context." },
  "tactic.rewrite": { kind: "tactic", group: "Equality", label: "rw", description: "Rewrites matching expressions with an equality or equivalence, in either direction." },
  "tactic.byCases": { kind: "tactic", group: "Logic", label: "by_cases", description: "Creates one branch assuming a proposition and another assuming its negation." },
  "tactic.induction": { kind: "tactic", group: "Recursion", label: "induction", description: "Creates constructor cases and an induction hypothesis for a recursive value." },
  "tactic.simp": { kind: "tactic", group: "Recursion", label: "simp", description: "Performs built-in reductions without using hypotheses or catalogue theorems, closing the goal only when those reductions make it trivial." },
  "tactic.simpa": { kind: "tactic", group: "Recursion", label: "simpa", description: "Simplifies a supplied proof and the goal before checking that they match." },
  "tactic.calc": { kind: "tactic", group: "Equality", label: "calc", description: "Records an intermediate equality and asks for evidence for each step." },
};

export type MoveUnlock = { moves: MoveId[]; text?: string };
export type LevelUnlocks = {
  shared?: MoveId[];
  completion?: MoveId[];
  warrior?: MoveUnlock;
  mage?: MoveUnlock;
};

export type MonsterSpec = {
  name: string;
  lore: string;
  sprite: { sheet: "monsters.png" | "monsters-2.png" | "monsters-3.png"; cell: number };
  hueShift: Record<HeroClass, number>;
};

export type ProofRoute = {
  moves: string[];
  selections: readonly string[];
  targets: string[];
  proof: string;
  contextOverrides?: Record<number, string[]>;
};

export type Exercise = {
  kind: "level";
  id: number;
  depth: number;
  chapter: string;
  title: string;
  topic: string;
  theorem: string;
  context: string[];
  intro: string;
  lesson: Record<HeroClass, string[]>;
  unlocks?: LevelUnlocks;
  warrior: ProofRoute;
  mage: ProofRoute;
  monster: MonsterSpec;
};

export type StoryLayerLayout = {
  inset?: string;
  left?: string;
  top?: string;
  width?: string;
  height?: string;
  objectFit?: "cover" | "contain";
  opacity?: number;
};

export type StoryImageLayer = {
  id: string;
  frames: [string] | [string, string];
  alt?: string;
  frameDurationMs?: number;
  layout?: StoryLayerLayout;
};

export type StoryPanel = {
  title: string;
  text: string[];
  layers: StoryImageLayer[];
};

export type StorySequence = {
  kind: "story";
  id: string;
  title: string;
  panels: StoryPanel[];
};

export type CurriculumEntry = Exercise | StorySequence;

const route = (
  moves: string[],
  targets: string[],
  proof: string,
  contextOverrides?: Record<number, string[]>,
): ProofRoute => ({
  moves,
  selections: [],
  targets,
  proof,
  contextOverrides,
});

export function buildTermProof(moves: string[]) {
  return moves.reduce((proof, move) => {
    const holeIndex = proof.indexOf("□");
    if (holeIndex < 0) {
      throw new Error(`Term move ${move} has no open proof hole to fill.`);
    }
    return `${proof.slice(0, holeIndex)}${move}${proof.slice(holeIndex + 1)}`;
  }, "□");
}

const lesson = (
  termMeaning: string,
  tacticMeaning: string,
): Record<HeroClass, string[]> => ({
  warrior: [termMeaning],
  mage: [tacticMeaning],
});

const monster = (
  name: string,
  lore: string,
  sheet: MonsterSpec["sprite"]["sheet"],
  cell: number,
  warriorHue: number,
  mageHue: number,
): MonsterSpec => ({
  name,
  lore,
  sprite: { sheet, cell },
  hueShift: { warrior: warriorHue, mage: mageHue },
});

const sumAppendTheorem = "∀ xs ys : List Nat, sum (xs ++ ys) = sum xs + sum ys";
const sumAppendProof = "fun xs ys => List.rec " +
  "(motive := fun xs => sum (xs ++ ys) = sum xs + sum ys) " +
  "(Eq.symm (Nat.zero_add (sum ys))) " +
  "(fun x xs ih => Eq.trans (congrArg (Nat.add x) ih) " +
    "(Eq.symm (Nat.add_assoc x (sum xs) (sum ys)))) xs";

const sumReplicateProofBody = "Nat.rec " +
  "(motive := fun n => sum (List.replicate n x) = n * x) " +
  "(Eq.symm (Nat.zero_mul x)) " +
  "(fun n ih => Eq.trans (congrArg (Nat.add x) ih) " +
    "(Eq.trans (Nat.add_comm x (n * x)) (Eq.symm (Nat.succ_mul n x)))) n";

const sumRepeatEachProof = "fun xs => List.rec " +
  "(fun n => Nat.rec (Eq.refl 0) (fun _ ih => ih) n) " +
  "(fun head tail ih => fun n => " +
    "Eq.trans (sum_append (List.replicate n head) (repeatEach n tail)) " +
      "(Eq.trans (congrArg (Nat.add (sum (List.replicate n head))) (ih n)) " +
        "(Eq.trans (Nat.add_comm (sum (List.replicate n head)) (n * sum tail)) " +
          "(Eq.trans (congrArg (Nat.add (n * sum tail)) (sum_replicate n head)) " +
            "(Eq.trans (Nat.add_comm (n * sum tail) (n * head)) " +
              "(Eq.symm (Nat.mul_add n head (sum tail))))))) xs";

const levelEntries = [
  {
    id: 1, depth: 1, chapter: "Propositions as Types", title: "The Given Proof", topic: "Using a hypothesis",
    theorem: "P", context: ["P : Prop", "hp : P"],
    intro: "The proof environment lists the declarations and hypotheses currently available to you.",
    // Intended Warrior term (shortest lesson route): `hp`.
    // Intended Mage moves (shortest lesson route): `exact hp`.
    lesson: lesson("The environment lists available declarations and hypotheses. An entry `hp : P` is already a proof of `P`, so the term `hp` can fill any hole expecting that type.", "The environment lists available declarations and hypotheses. The `exact` tactic closes the current goal whenever the supplied term has exactly the required type."),
    unlocks: {
      warrior: { moves: ["term.context"], text: "New moves: choose any environment term whose type matches the focused hole." },
      mage: { moves: ["tactic.exact"], text: "New move: `exact □` opens a term-selection view and closes the goal when the chosen term has the required type." },
    },
    warrior: route(["hp"], ["P"], "hp"),
    mage: route(["exact hp"], ["P"], "by\n  exact hp"),
    monster: monster("Chalk Imp", "The proof you need is already written on its stolen slate.", "monsters.png", 1, 0, 34),
  },
  {
    id: 2, depth: 1, chapter: "Propositions as Types", title: "The First Assumption", topic: "Identity",
    theorem: "P → P", context: ["P : Prop"],
    intro: "A proposition is a type, and a proof is a term inhabiting that type.",
    // Intended Warrior term (shortest lesson route): `fun hP => hP`.
    // Intended Mage moves (shortest lesson route): `intro hP → exact hP`.
    lesson: lesson("A function term such as `fun hP => ...` turns an implication into a proof body where its premise is available under the chosen name.", "The `intro hP` tactic changes an implication goal into its conclusion and adds the premise to the environment under the chosen name."),
    unlocks: {
      warrior: { moves: ["term.lambda"], text: "New move: `fun x => □` introduces a suitably named variable when the hole expects a function." },
      mage: { moves: ["tactic.intro"], text: "New move: `intro x` moves a function premise into the environment using a suitable name." },
    },
    warrior: route(["fun hP => □", "hP"], ["P → P", "P"], "fun hP => hP"),
    mage: route(["intro hP", "exact hP"], ["P → P", "P"], "by\n  intro hP\n  exact hP"),
    monster: monster("Mossbound Eye", "It watches for the first unguarded assumption.", "monsters.png", 0, 0, 34),
  },
  {
    id: 3, depth: 1, chapter: "Propositions as Types", title: "Keep the First", topic: "Nested implication",
    theorem: "P → Q → P", context: ["P Q : Prop"],
    intro: "Arrows associate to the right, so this theorem accepts two proofs in sequence.",
    // Intended Warrior term (shortest lesson route): `fun hP hQ => hP`.
    // Intended Mage moves (shortest lesson route): `intro hP → intro hQ → exact hP`.
    lesson: lesson("Because implication arrows associate to the right, nested function terms introduce one premise for each successive arrow.", "Repeated `intro` tactics peel implication goals from left to right, adding one local hypothesis at a time."),
    warrior: route(["fun hP => □", "fun hQ => □", "hP"], ["P → Q → P", "Q → P", "P"], "fun hP hQ => hP"),
    mage: route(["intro hP", "intro hQ", "exact hP"], ["P → Q → P", "Q → P", "P"], "by\n  intro hP\n  intro hQ\n  exact hP"),
    monster: monster("Grix the Hoarder", "It keeps the first treasure and ignores the second.", "monsters.png", 1, 46, 70),
  },
  {
    id: 4, depth: 1, chapter: "Propositions as Types", title: "The Relay", topic: "Application",
    theorem: "P → (P → Q) → Q", context: ["P Q : Prop"],
    intro: "A proof of an implication behaves like a function from proofs to proofs.",
    // Intended Warrior term (shortest lesson route): `fun hP hPQ => hPQ hP`.
    // Intended Mage moves (shortest lesson route): `intro hP → intro hPQ → apply hPQ → exact hP`.
    lesson: lesson("A proof of `A → B` behaves like a function: applying it to a proof of `A` produces a proof of `B`. Metavariables such as `?0` stand for types that have not yet been determined and are resolved when later choices provide enough information.", "The `apply` tactic works backward from a proof whose conclusion matches the goal, replacing that goal with the proof's required premises. Metavariables such as `?0` stand for types that have not yet been determined and are resolved when later choices provide enough information."),
    unlocks: {
      warrior: { moves: ["term.application"], text: "New move: `(□ □)` builds an application, then asks for a compatible function and its argument." },
      mage: { moves: ["tactic.apply"], text: "New move: `apply □` asks for a compatible function and creates goals for all of its premises." },
    },
    warrior: route(["fun hP => □", "fun hPQ => □", "hPQ hP"], ["P → (P → Q) → Q", "(P → Q) → Q", "Q"], "fun hP hPQ => hPQ hP"),
    mage: route(["intro hP", "intro hPQ", "apply hPQ", "exact hP"], ["P → (P → Q) → Q", "(P → Q) → Q", "Q", "P"], "by\n  intro hP hPQ\n  apply hPQ\n  exact hP"),
    monster: monster("Relay Lich", "Every spell it receives is passed deeper into the crypt.", "monsters.png", 2, 0, 34),
  },
  {
    id: 5, depth: 1, chapter: "Propositions as Types", title: "Chain of Three", topic: "Composition",
    theorem: "(P → Q) → (Q → R) → P → R", context: ["P Q R : Prop"],
    intro: "Implications compose just like ordinary functions.",
    // Intended Warrior term (shortest lesson route): `fun hPQ hQR hP => hQR (hPQ hP)`.
    // Intended Mage moves (shortest lesson route): `intro hPQ → intro hQR → intro hP → apply hQR → apply hPQ → exact hP`.
    lesson: lesson("Function applications can be nested, allowing the output type of one implication to become the input type of the next.", "Repeated `apply` tactics follow a chain of implications backward, exposing each intermediate premise as a new goal."),
    warrior: route(["fun hPQ => □", "fun hQR => □", "fun hP => □", "hQR (hPQ hP)"], ["(P → Q) → (Q → R) → P → R", "(Q → R) → P → R", "P → R", "R"], "fun hPQ hQR hP => hQR (hPQ hP)"),
    mage: route(["intro hPQ", "intro hQR", "intro hP", "apply hQR", "apply hPQ", "exact hP"], ["(P → Q) → (Q → R) → P → R", "(Q → R) → P → R", "P → R", "R", "Q", "P"], "by\n  intro hPQ hQR hP\n  apply hQR\n  apply hPQ\n  exact hP"),
    monster: monster("Three-Link Wraith", "Three spectral chains bind its victim to the wall.", "monsters.png", 9, 0, 34),
  },
  {
    id: 6, depth: 1, chapter: "Propositions as Types", title: "Forge a Pair", topic: "Conjunction introduction",
    theorem: "P → Q → P ∧ Q", context: ["P Q : Prop"],
    intro: "A conjunction packages two proofs together.",
    // Intended Warrior term (shortest lesson route): `And.intro`.
    // Intended Mage moves (shortest lesson route): `intro hP → intro hQ → constructor → exact hP → exact hQ`.
    lesson: lesson("`And.intro` builds a conjunction from one proof of its left side and one proof of its right side.", "On a conjunction goal, `constructor` creates separate goals for the left and right components."),
    unlocks: {
      warrior: { moves: ["catalogue.andIntro"], text: "New catalogue term: `And.intro` is a function that accepts proofs of both sides of a conjunction; use ordinary application to supply them." },
      mage: { moves: ["tactic.constructor"], text: "New move: `constructor` creates one goal for each component of a constructor-shaped target." },
    },
    warrior: route(["And.intro"], ["P → Q → P ∧ Q"], "And.intro"),
    mage: route(["intro hP", "intro hQ", "constructor", "exact hP", "exact hQ"], ["P → Q → P ∧ Q", "Q → P ∧ Q", "P ∧ Q", "P", "Q"], "by\n  intro hP hQ\n  constructor\n  · exact hP\n  · exact hQ"),
    monster: monster("Stitched Pair", "Two creatures were sewn into one proposition.", "monsters.png", 3, 0, 34),
  },
  {
    id: 7, depth: 1, chapter: "Propositions as Types", title: "Open the Left Seal", topic: "Projection",
    theorem: "P ∧ Q → P", context: ["P Q : Prop"],
    intro: "A conjunction's projections retrieve the proofs stored inside it.",
    // Intended Warrior term (shortest lesson route): `And.left`.
    // Intended Mage moves (shortest lesson route): `intro h → apply □ → And.left → exact □ → h`.
    lesson: lesson("`And.left` is a function that accepts evidence of a conjunction and returns the evidence stored on its left side.", "`And.left` can be supplied to `apply`, turning a left-component goal into a goal for the whole conjunction."),
    unlocks: {
      shared: ["catalogue.andLeft"],
      warrior: { moves: [], text: "New catalogue term: `And.left` is a function from a conjunction proof to its left component, so it can be used through application." },
    },
    warrior: route(["And.left"], ["P ∧ Q → P"], "And.left"),
    mage: route(["intro h", "apply □", "And.left", "exact □", "h"], ["P ∧ Q → P", "P", "(? → P)", "P ∧ Q", "P ∧ Q"], "by\n  intro h\n  apply And.left\n  exact h"),
    monster: monster("Left-Locked Gnawer", "Its first mouth guards the only useful key.", "monsters.png", 3, 46, 70),
  },
  {
    id: 8, depth: 1, chapter: "Propositions as Types", title: "Turn the Seal", topic: "Conjunction symmetry",
    theorem: "P ∧ Q → Q ∧ P", context: ["P Q : Prop"],
    intro: "Conjunctions can be rebuilt with their components reversed.",
    // Intended Warrior term (shortest lesson route): `fun h => And.intro h.right h.left`.
    // Intended Mage moves (shortest lesson route): `intro h → constructor → exact □ → h.right → exact □ → h.left`.
    lesson: lesson("Lean's dot notation can write `value.function` when the value is the function's first explicit argument. Thus `h.left` means `And.left h`, while `h.right` means `And.right h`.", "Lean's dot notation can write `value.function` when the value is the function's first explicit argument. Thus `h.left` means `And.left h`; after `constructor`, these terms can provide the matching components."),
    unlocks: {
      shared: ["catalogue.andRight", "term.dot"],
      warrior: { moves: [], text: "New move: `□.□` builds projection notation such as `h.left` and `h.right`; equivalence proofs later add `h.mp` and `h.mpr`." },
    },
    warrior: route(["fun h => □", "And.intro □ □", "□.□", "h", "right", "□.□", "h", "left"], ["P ∧ Q → Q ∧ P", "Q ∧ P", "Q", "Q", "Q", "P", "P", "P"], "fun h => And.intro h.right h.left"),
    mage: route(["intro h", "constructor", "exact □", "h.right", "exact □", "h.left"], ["P ∧ Q → Q ∧ P", "Q ∧ P", "Q", "Q", "P", "P"], "by\n  intro h\n  constructor\n  · exact h.right\n  · exact h.left"),
    monster: monster("Mirror Gargoyle", "Everything shown to it returns in reverse.", "monsters.png", 4, 0, 34),
  },
  {
    id: 9, depth: 1, chapter: "Propositions as Types", title: "Take the Left Path", topic: "Disjunction introduction",
    theorem: "P → P ∨ Q", context: ["P Q : Prop"],
    intro: "A disjunction is proved by providing evidence for either one of its alternatives.",
    // Intended Warrior term (shortest lesson route): `Or.inl`.
    // Intended Mage moves (shortest lesson route): `intro hP → left → exact hP`.
    lesson: lesson("`Or.inl` and `Or.inr` embed evidence into the left or right alternative of a disjunction.", "The `left` and `right` tactics select which alternative of a disjunction will be proved."),
    unlocks: {
      warrior: { moves: ["catalogue.orIntro"], text: "New catalogue terms: `Or.inl` and `Or.inr` are functions that embed evidence into either side of a disjunction." },
      mage: { moves: ["tactic.orSides"], text: "New moves: `left` and `right` select a side of a disjunction goal." },
    },
    warrior: route(["Or.inl"], ["P → P ∨ Q"], "Or.inl"),
    mage: route(["intro hP", "left", "exact hP"], ["P → P ∨ Q", "P ∨ Q", "P"], "by\n  intro hP\n  left\n  exact hP"),
    monster: monster("Emberhorn", "The left-hand tunnel is scorched by its passing.", "monsters.png", 6, 0, 34),
  },
  {
    id: 10, depth: 1, chapter: "Propositions as Types", title: "Answer Both Heads", topic: "Disjunction elimination",
    theorem: "(P → R) → (Q → R) → P ∨ Q → R", context: ["P Q R : Prop"],
    intro: "Using a disjunction requires handling both possible forms of evidence.",
    // Intended Warrior term (shortest lesson route): `fun hPR hQR h => Or.elim h hPR hQR`.
    // Intended Mage moves: `intro hPR → intro hQR → intro h → cases □ → h → exact hPR hP → exact hQR hQ`.
    lesson: lesson("`Or.elim` first accepts evidence of a disjunction, then a result-producing function for each possible alternative.", "The `cases` tactic splits a disjunction hypothesis into branches, adding the corresponding alternative to each branch's environment."),
    unlocks: {
      warrior: { moves: ["catalogue.orElim"], text: "New catalogue term: `Or.elim` is a function accepting disjunction evidence and one result-producing function for each alternative." },
      mage: { moves: ["tactic.cases"], text: "New move: `cases h` creates one branch for each possible form of disjunction evidence." },
    },
    warrior: route(["fun hPR => □", "fun hQR => □", "fun h => □", "Or.elim □ □ □", "h", "hPR", "hQR"], ["(P → R) → (Q → R) → P ∨ Q → R", "(Q → R) → P ∨ Q → R", "P ∨ Q → R", "R", "P ∨ Q", "P → R", "Q → R"], "fun hPR hQR h => Or.elim h hPR hQR"),
    mage: route(["intro hPR", "intro hQR", "intro h", "cases □", "h", "exact hPR hP", "exact hQR hQ"], ["(P → R) → (Q → R) → P ∨ Q → R", "(Q → R) → P ∨ Q → R", "P ∨ Q → R", "R", "R", "R", "R"], "by\n  intro hPR hQR h\n  cases h with\n  | inl hP => exact hPR hP\n  | inr hQ => exact hQR hQ", {
      4: ["hPR : P → R", "hQR : Q → R", "hP : P"],
      5: ["hPR : P → R", "hQR : Q → R", "hQ : Q"],
    }),
    monster: monster("Forked Adder", "Whichever head strikes, the answer must be ready.", "monsters.png", 8, 0, 34),
  },
  {
    id: 11, depth: 1, chapter: "Propositions as Types", title: "Empty the Void", topic: "False elimination",
    theorem: "False → P", context: ["P : Prop"],
    intro: "False has no constructors, so evidence for it can eliminate any goal.",
    // Intended Warrior term (shortest lesson route): `False.elim`.
    // Intended Mage moves (shortest lesson route): `intro hFalse → exfalso → exact hFalse`.
    lesson: lesson("`False.elim` converts a proof of `False` into a proof of any proposition, reflecting that an impossible case has no inhabitants.", "A term produced by `False.elim` has whatever target type the current impossible branch requires."),
    unlocks: {
      warrior: { moves: ["catalogue.falseElim"], text: "New catalogue term: `False.elim` is a function from `False` to any required proposition." },
      mage: { moves: ["tactic.exfalso"], text: "New move: `exfalso` changes the current goal to `False`, whose evidence can produce any proposition." },
    },
    warrior: route(["False.elim"], ["False → P"], "False.elim"),
    mage: route(["intro hFalse", "exfalso", "exact hFalse"], ["False → P", "P", "False"], "by\n  intro hFalse\n  exfalso\n  exact hFalse"),
    monster: monster("Void Warden", "Its heart contains evidence that cannot exist.", "monsters.png", 9, 46, 70),
  },
  {
    id: 12, depth: 2, chapter: "Logical Connectives", title: "Bind Both Directions", topic: "Biconditional",
    theorem: "(P → Q) → (Q → P) → (P ↔ Q)", context: ["P Q : Prop"],
    intro: "A biconditional packages implications in both directions.",
    // Intended Warrior term (shortest lesson route): `Iff.intro`.
    // Intended Mage moves (shortest lesson route): `intro hPQ → intro hQP → constructor → exact hPQ → exact hQP`.
    lesson: lesson("`Iff.intro` builds an equivalence from implications in both the forward and backward directions.", "On an equivalence goal, `constructor` creates one goal for each direction of the equivalence."),
    unlocks: {
      warrior: { moves: ["catalogue.iffIntro"], text: "New catalogue term: `Iff.intro` is a function accepting proofs of both directions of an equivalence." },
    },
    warrior: route(["Iff.intro"], ["(P → Q) → (Q → P) → P ↔ Q"], "Iff.intro"),
    mage: route(["intro hPQ", "intro hQP", "constructor", "exact hPQ", "exact hQP"], ["(P → Q) → (Q → P) → P ↔ Q", "(Q → P) → P ↔ Q", "P ↔ Q", "P → Q", "Q → P"], "by\n  intro hPQ hQP\n  constructor\n  · exact hPQ\n  · exact hQP"),
    monster: monster("Mushroom Sentinel", "Its shield opens only when both runes agree.", "monsters-2.png", 0, 0, 34),
  },
  {
    id: 13, depth: 2, chapter: "Logical Connectives", title: "Use the Forward Rune", topic: "Iff elimination",
    theorem: "(P ↔ Q) → P → Q", context: ["P Q : Prop"],
    intro: "Each direction of an equivalence can be projected and applied.",
    // Intended Warrior term (shortest lesson route): `Iff.mp`.
    // Intended Mage moves (shortest lesson route): `intro hIff → intro hP → apply hIff.mp → exact hP`.
    lesson: lesson("An equivalence proof contains two functions: `.mp` applies the forward direction and `.mpr` applies the backward direction.", "The `.mp` and `.mpr` projections of an equivalence may be used with tactics just like other implication proofs."),
    unlocks: {
      shared: ["catalogue.iffProjection"],
      warrior: { moves: [], text: "New moves: `.mp` and `.mpr` project the forward and backward functions from an equivalence." },
    },
    warrior: route(["Iff.mp"], ["(P ↔ Q) → P → Q"], "Iff.mp"),
    mage: route(["intro hIff", "intro hP", "apply hIff.mp", "exact hP"], ["(P ↔ Q) → P → Q", "P → Q", "Q", "P"], "by\n  intro hIff hP\n  apply hIff.mp\n  exact hP"),
    monster: monster("Book Mimic", "Only the forward page contains the needed incantation.", "monsters-2.png", 1, 0, 34),
  },
  {
    id: 14, depth: 2, chapter: "Logical Connectives", title: "Meet Contradiction", topic: "Negation",
    theorem: "P ∧ ¬P → False", context: ["P : Prop"],
    intro: "Negation `¬P` is definitionally the function type `P → False`.",
    // Intended Warrior term (shortest lesson route): `fun h => h.right h.left`.
    // Intended Mage moves (shortest lesson route): `intro h → apply h.right → exact h.left`.
    lesson: lesson("Negation `¬P` is notation for the function type `P → False`, so a negative proof can be applied to positive evidence.", "A projected negated hypothesis can be supplied to `apply`, changing a `False` goal into a goal for the matching positive evidence."),
    warrior: route(["fun h => □", "h.right h.left"], ["P ∧ ¬P → False", "False"], "fun h => h.right h.left"),
    mage: route(["intro h", "apply □", "h.right", "exact □", "h.left"], ["P ∧ ¬P → False", "False", "(? → False)", "P", "P"], "by\n  intro h\n  apply h.right\n  exact h.left"),
    monster: monster("Boneplate Beetle", "Its shell bears two mutually impossible sigils.", "monsters-2.png", 2, 0, 34),
  },
  {
    id: 15, depth: 2, chapter: "Logical Connectives", title: "Turn the Arrow Back", topic: "Contraposition",
    theorem: "(P → Q) → ¬Q → ¬P", context: ["P Q : Prop"],
    intro: "Contraposition converts a route from `P` to `Q` into a route from `¬Q` to `¬P`.",
    // Intended Warrior term (shortest lesson route): `fun hPQ hnQ hP => hnQ (hPQ hP)`.
    // Intended Mage moves (shortest lesson route): `intro hPQ → intro hnQ → intro hP → apply hnQ → apply hPQ → exact hP`.
    lesson: lesson("Constructing a negation means constructing a function whose assumed input leads to `False`; implication proofs may be composed inside that function.", "Introducing a negation goal adds its positive proposition to the environment and changes the goal to `False`."),
    warrior: route(["fun hPQ => □", "fun hnQ => □", "fun hP => □", "hnQ (hPQ hP)"], ["(P → Q) → ¬Q → ¬P", "¬Q → ¬P", "¬P", "False"], "fun hPQ hnQ hP => hnQ (hPQ hP)"),
    mage: route(["intro hPQ", "intro hnQ", "intro hP", "apply hnQ", "apply hPQ", "exact hP"], ["(P → Q) → ¬Q → ¬P", "¬Q → ¬P", "¬P", "False", "Q", "P"], "by\n  intro hPQ hnQ hP\n  apply hnQ\n  apply hPQ\n  exact hP"),
    monster: monster("Raven Contrarian", "Every path toward it becomes a path away.", "monsters-2.png", 3, 0, 34),
  },
  {
    id: 16, depth: 2, chapter: "Logical Connectives", title: "Deny Both Doors", topic: "De Morgan",
    theorem: "¬(P ∨ Q) → ¬P ∧ ¬Q", context: ["P Q : Prop"],
    intro: "To deny a disjunction constructively, deny each alternative separately.",
    // Intended Warrior term (shortest lesson route): `fun hn => And.intro (fun hP => hn (Or.inl hP)) (fun hQ => hn (Or.inr hQ))`.
    // Intended Mage moves (shortest lesson route): `intro hn → constructor → intro hP → apply hn → left → exact hP → intro hQ → apply hn → right → exact hQ`.
    lesson: lesson("Compound logical proofs can be assembled by nesting previously learned constructors, functions, and eliminators according to the target's shape.", "When `constructor` produces negation goals, each branch can introduce its own local assumption before deriving a contradiction."),
    warrior: route(["fun hn => □", "And.intro □ □", "fun hP => hn (Or.inl hP)", "fun hQ => hn (Or.inr hQ)"], ["¬(P ∨ Q) → ¬P ∧ ¬Q", "¬P ∧ ¬Q", "¬P", "¬Q"], "fun hn => And.intro (fun hP => hn (Or.inl hP)) (fun hQ => hn (Or.inr hQ))"),
    mage: route(["intro hn", "constructor", "intro hP", "apply hn", "left", "exact hP", "intro hQ", "apply hn", "right", "exact hQ"], ["¬(P ∨ Q) → ¬P ∧ ¬Q", "¬P ∧ ¬Q", "¬P", "False", "P ∨ Q", "P", "¬Q", "False", "P ∨ Q", "Q"], "by\n  intro hn\n  constructor\n  · intro hP\n    apply hn\n    left\n    exact hP\n  · intro hQ\n    apply hn\n    right\n    exact hQ", {
      6: ["hn : ¬(P ∨ Q)"],
      7: ["hn : ¬(P ∨ Q)", "hQ : Q"],
      8: ["hn : ¬(P ∨ Q)", "hQ : Q"],
      9: ["hn : ¬(P ∨ Q)", "hQ : Q"],
    }),
    monster: monster("Bronze Minotaur", "It bars both exits of the logical maze.", "monsters-2.png", 4, 0, 34),
  },
  {
    id: 17, depth: 2, chapter: "Logical Connectives", title: "Curry the Pair", topic: "Currying",
    theorem: "(P ∧ Q → R) → P → Q → R", context: ["P Q R : Prop"],
    intro: "Curried assumptions can be packaged when a function expects a conjunction.",
    // Intended Warrior term (shortest lesson route): `fun h hP hQ => h (And.intro hP hQ)`.
    // Intended Mage moves (shortest lesson route): `intro h → intro hP → intro hQ → apply h → constructor → exact hP → exact hQ`.
    lesson: lesson("A constructed proof term can be supplied directly as the argument to another proof function, without first giving it a name.", "If `apply` exposes a conjunction as a premise, that new goal can be decomposed with `constructor` like any other conjunction goal."),
    warrior: route(["fun h => □", "fun hP => □", "fun hQ => □", "h (And.intro hP hQ)"], ["(P ∧ Q → R) → P → Q → R", "P → Q → R", "Q → R", "R"], "fun h hP hQ => h (And.intro hP hQ)"),
    mage: route(["intro h", "intro hP", "intro hQ", "apply h", "constructor", "exact hP", "exact hQ"], ["(P ∧ Q → R) → P → Q → R", "P → Q → R", "Q → R", "R", "P ∧ Q", "P", "Q"], "by\n  intro h hP hQ\n  apply h\n  constructor\n  · exact hP\n  · exact hQ"),
    monster: monster("Ice Golem", "Two frozen shards combine into its single heart.", "monsters-2.png", 5, 0, 34),
  },
  {
    id: 18, depth: 2, chapter: "Logical Connectives", title: "Discard the Empty Branch", topic: "False in disjunction",
    theorem: "P ∨ False → P", context: ["P : Prop"],
    intro: "A disjunction with `False` contains useful evidence only in its other branch.",
    // Intended Warrior term (shortest lesson route): `fun h => Or.elim h (fun hP => hP) False.elim`.
    // Intended Mage moves: `intro h → cases □ → h → exact hP → exfalso → exact hFalse`.
    lesson: lesson("Different branches of an eliminator may be handled differently; a branch carrying `False` can produce the common result through `False.elim`.", "In the impossible branch, `exfalso` changes the goal to `False`, allowing the branch's `False` hypothesis to close it directly."),
    warrior: route(["fun h => □", "Or.elim h (fun hP => hP) False.elim"], ["P ∨ False → P", "P"], "fun h => Or.elim h (fun hP => hP) False.elim"),
    mage: route(["intro h", "cases □", "h", "exact hP", "exfalso", "exact hFalse"], ["P ∨ False → P", "P", "P", "P", "P", "False"], "by\n  intro h\n  cases h with\n  | inl hP => exact hP\n  | inr hFalse =>\n      exfalso\n      exact hFalse", {
      2: ["hP : P"],
      3: ["hFalse : False"],
      4: ["hFalse : False"],
      5: ["hFalse : False"],
    }),
    monster: monster("Skullweb Spider", "One strand is silk; the other leads nowhere.", "monsters-2.png", 6, 0, 34),
  },
  {
    id: 19, depth: 2, chapter: "Logical Connectives", title: "Break Double Negation", topic: "Classical logic",
    theorem: "¬¬P → P", context: ["P : Prop"],
    intro: "Double-negation elimination requires classical reasoning in Lean.",
    // Intended Warrior term (shortest lesson route): `Classical.byContradiction`.
    // Intended Mage moves (shortest lesson route): `intro hnnP → by_contra hnP → exact hnnP hnP`.
    lesson: lesson("`Classical.byContradiction` proves a proposition by accepting a function that turns its negation into `False`.", "The classical tactic `by_contra` replaces a proposition goal with `False` and adds the negation of the original goal to the environment."),
    unlocks: {
      warrior: { moves: ["catalogue.byContradiction"], text: "New catalogue term: `Classical.byContradiction` accepts a function from the goal's negation to `False`." },
      mage: { moves: ["tactic.byContra"], text: "New move: `by_contra h` adds the negated goal and changes the target to `False`." },
    },
    warrior: route(["Classical.byContradiction"], ["¬¬P → P"], "Classical.byContradiction"),
    mage: route(["intro hnnP", "by_contra hnP", "exact hnnP hnP"], ["¬¬P → P", "P", "False"], "by\n  intro hnnP\n  by_contra hnP\n  exact hnnP hnP"),
    monster: monster("Mummy Scholar", "Two layers of denial wrap the truth in linen.", "monsters-2.png", 7, 0, 34),
  },
  {
    id: 20, depth: 3, chapter: "Quantifiers and Equality", title: "Name the Arbitrary", topic: "Universal introduction",
    theorem: "∀ x : α, x = x", context: ["α : Type"],
    intro: "A universal statement is a dependent function accepting an arbitrary value.",
    // Intended Warrior term (shortest lesson route): `Eq.refl`.
    // Intended Mage moves (shortest lesson route): `intro x → rfl`.
    lesson: lesson("A proof of `∀ x, P x` is a dependent function that accepts an arbitrary value `x` and returns evidence of `P x`. `Eq.refl x` is the canonical proof that `x = x`.", "The `intro` tactic also introduces universally quantified values. The `rfl` tactic proves equality goals whose two sides are definitionally the same."),
    unlocks: {
      warrior: { moves: ["catalogue.eqRefl"], text: "New catalogue term: `Eq.refl` accepts a value and proves that it equals itself." },
      mage: { moves: ["tactic.rfl"], text: "New move: `rfl` closes equality goals whose two sides are definitionally equal." },
    },
    warrior: route(["Eq.refl"], ["∀ x : α, x = x"], "Eq.refl"),
    mage: route(["intro x", "rfl"], ["∀ x : α, x = x", "x = x"], "by\n  intro x\n  rfl"),
    monster: monster("Thorn Troll", "Every thorn is equal only to itself.", "monsters-2.png", 8, 0, 34),
  },
  {
    id: 21, depth: 3, chapter: "Quantifiers and Equality", title: "Choose an Instance", topic: "Universal elimination",
    theorem: "(∀ x : α, P x) → P a", context: ["α : Type", "P : α → Prop", "a : α"],
    intro: "A universal proof can be applied to any concrete value of the quantified type.",
    // Intended Warrior term (shortest lesson route): `fun hAll => hAll a`.
    // Intended Mage moves (shortest lesson route): `intro hAll → exact hAll a`.
    lesson: lesson("A universally quantified proof behaves like a function and can be applied to any value of the quantified type.", "Supplying a value to a universal hypothesis specializes it, producing evidence for that particular value."),
    warrior: route(["fun hAll => □", "hAll a"], ["(∀ x, P x) → P a", "P a"], "fun hAll => hAll a"),
    mage: route(["intro hAll", "exact hAll a"], ["(∀ x, P x) → P a", "P a"], "by\n  intro hAll\n  exact hAll a"),
    monster: monster("Spectral Knight", "Its universal oath applies to every challenger.", "monsters-2.png", 9, 0, 34),
  },
  {
    id: 22, depth: 3, chapter: "Quantifiers and Equality", title: "Lift the Rule", topic: "Quantified implication",
    theorem: "(∀ x : α, P x → Q x) → (∀ x : α, P x) → ∀ x : α, Q x", context: ["α : Type", "P Q : α → Prop"],
    intro: "Pointwise implications can transform a universal family of proofs.",
    // Intended Warrior term (shortest lesson route): `fun hPQ hP x => hPQ x (hP x)`.
    // Intended Mage moves (shortest lesson route): `intro hPQ → intro hP → intro x → apply hPQ x → exact hP x`.
    lesson: lesson("Quantified implications can be specialized at an arbitrary value and then used as ordinary proof functions.", "A tactic argument may specialize a universal hypothesis before `apply` uses its resulting implication."),
    warrior: route(["fun hPQ => □", "fun hP => □", "fun x => □", "hPQ x (hP x)"], ["(∀ x, P x → Q x) → (∀ x, P x) → ∀ x, Q x", "(∀ x, P x) → ∀ x, Q x", "∀ x, Q x", "Q x"], "fun hPQ hP x => hPQ x (hP x)"),
    mage: route(["intro hPQ", "intro hP", "intro x", "apply hPQ x", "exact hP x"], ["(∀ x, P x → Q x) → (∀ x, P x) → ∀ x, Q x", "(∀ x, P x) → ∀ x, Q x", "∀ x, Q x", "Q x", "P x"], "by\n  intro hPQ hP x\n  apply hPQ x\n  exact hP x"),
    monster: monster("Cinder Salamander", "Its rule spreads from one scale to every scale.", "monsters-3.png", 0, 0, 34),
  },
  {
    id: 23, depth: 3, chapter: "Quantifiers and Equality", title: "Offer a Witness", topic: "Existential introduction",
    theorem: "P a → ∃ x : α, P x", context: ["α : Type", "P : α → Prop", "a : α"],
    intro: "An existential proof contains a witness together with evidence about it.",
    // Intended Warrior term (shortest lesson route): `fun hPa => Exists.intro a hPa`.
    // Intended Mage moves (shortest lesson route): `intro hPa → use a → exact hPa`.
    lesson: lesson("`Exists.intro` builds an existential proof by packaging a witness together with evidence that the witness has the required property.", "The `use` tactic chooses a witness for an existential goal and leaves its required property as the new goal."),
    unlocks: {
      warrior: { moves: ["catalogue.existsIntro"], text: "New catalogue term: `Exists.intro` accepts a witness and then evidence about that witness." },
      mage: { moves: ["tactic.use"], text: "New move: `use □` chooses a witness and leaves its required property as the goal." },
    },
    warrior: route(["fun hPa => □", "Exists.intro a hPa"], ["P a → ∃ x, P x", "∃ x, P x"], "fun hPa => Exists.intro a hPa"),
    mage: route(["intro hPa", "use a", "exact hPa"], ["P a → ∃ x, P x", "∃ x, P x", "P a"], "by\n  intro hPa\n  use a\n  exact hPa"),
    monster: monster("Horned Boneguard", "No one passes without presenting a witness.", "monsters-3.png", 1, 0, 34),
  },
  {
    id: 24, depth: 3, chapter: "Quantifiers and Equality", title: "Open the Witness", topic: "Existential elimination",
    theorem: "(∃ x : α, P x) → (∀ x : α, P x → Q) → Q", context: ["α : Type", "P : α → Prop", "Q : Prop"],
    intro: "Using an existential means reasoning from an arbitrary hidden witness and its evidence.",
    // Intended Warrior term (shortest lesson route): `Exists.elim`.
    // Intended Mage moves: `intro hEx → intro hRule → rcases □ → hEx → exact hRule x hx`.
    lesson: lesson("`Exists.elim` consumes an existential proof by providing its hidden witness and evidence to a function that handles any such pair.", "The `rcases` tactic unpacks structured evidence, introducing names for an existential witness and its accompanying proof."),
    unlocks: {
      warrior: { moves: ["catalogue.existsElim"], text: "New catalogue term: `Exists.elim` accepts existential evidence and a function handling any witness." },
      mage: { moves: ["tactic.rcases"], text: "New move: `rcases h with ⟨x, hx⟩` unpacks a witness and its evidence." },
    },
    warrior: route(["Exists.elim"], ["(∃ x, P x) → (∀ x, P x → Q) → Q"], "Exists.elim"),
    mage: route(["intro hEx", "intro hRule", "rcases □", "hEx", "exact hRule x hx"], ["(∃ x, P x) → (∀ x, P x → Q) → Q", "(∀ x, P x → Q) → Q", "Q", "Q", "Q"], "by\n  intro hEx hRule\n  rcases hEx with ⟨x, hx⟩\n  exact hRule x hx", {
      3: ["hRule : ∀ x, P x → Q", "x : α", "hx : P x"],
    }),
    monster: monster("Lantern Bog Witch", "A hidden name flickers inside her lantern.", "monsters-3.png", 2, 0, 34),
  },
  {
    id: 25, depth: 3, chapter: "Quantifiers and Equality", title: "Find Zero", topic: "Concrete witness",
    theorem: "∃ n : Nat, n = 0", context: [],
    intro: "Existential witnesses may be concrete data such as a natural number.",
    // Intended Warrior term (shortest lesson route): `Exists.intro 0 (Eq.refl 0)`.
    // Intended Mage moves (shortest lesson route): `use 0 → rfl`.
    lesson: lesson("An existential witness may be a concrete value; after choosing it, the remaining term must prove the property specialized to that value.", "The `use` tactic accepts concrete expressions as witnesses, and later tactics operate on the resulting specialized goal."),
    unlocks: {
      shared: ["term.naturalNumber"],
      warrior: { moves: [], text: "New move: `natural number` accepts one or more decimal digits and inserts the resulting `Nat` term into the focused hole." },
      mage: { moves: [], text: "New term choice: `natural number` accepts one or more decimal digits when a tactic needs a `Nat` argument." },
    },
    warrior: route(["Exists.intro 0 □", "Eq.refl 0"], ["∃ n : Nat, n = 0", "0 = 0"], "Exists.intro 0 (Eq.refl 0)"),
    mage: route(["use 0", "rfl"], ["∃ n : Nat, n = 0", "0 = 0"], "by\n  use 0\n  rfl"),
    monster: monster("Iron Boar", "The zero carved into its plate is the only clue.", "monsters-3.png", 3, 0, 34),
  },
  {
    id: 26, depth: 3, chapter: "Quantifiers and Equality", title: "Reverse Equality", topic: "Symmetry",
    theorem: "a = b → b = a", context: ["α : Type", "a b : α"],
    intro: "Equality is symmetric: evidence can be reversed.",
    // Intended Warrior term (shortest lesson route): `Eq.symm`.
    // Intended Mage moves (shortest lesson route): `intro h → symm → exact h`.
    lesson: lesson("`Eq.symm` transforms evidence of `a = b` into evidence of `b = a`.", "The `symm` tactic reverses the two sides of an equality goal."),
    unlocks: {
      warrior: { moves: ["catalogue.eqSymm"], text: "New catalogue term: `Eq.symm` accepts equality evidence and reverses it." },
      mage: { moves: ["tactic.symm"], text: "New move: `symm` reverses an equality goal." },
    },
    warrior: route(["Eq.symm"], ["a = b → b = a"], "Eq.symm"),
    mage: route(["intro h", "symm", "exact h"], ["a = b → b = a", "b = a", "a = b"], "by\n  intro h\n  symm\n  exact h"),
    monster: monster("Many-Eyed Orb", "Every gaze returns along the direction it came.", "monsters-3.png", 4, 0, 34),
  },
  {
    id: 27, depth: 3, chapter: "Quantifiers and Equality", title: "Cross Two Equalities", topic: "Transitivity",
    theorem: "a = b → b = c → a = c", context: ["α : Type", "a b c : α"],
    intro: "Equality evidence composes through an intermediate value.",
    // Intended Warrior term (shortest lesson route): `Eq.trans`.
    // Intended Mage moves: `intro hab → intro hbc → trans □ → b → exact hab → exact hbc`.
    lesson: lesson("`Eq.trans` composes two equalities that share a middle expression.", "The `trans` tactic chooses an intermediate expression and splits an equality goal into the two equalities on either side of it."),
    unlocks: {
      warrior: { moves: ["catalogue.eqTrans"], text: "New catalogue term: `Eq.trans` accepts two equalities that share a middle term." },
      mage: { moves: ["tactic.trans"], text: "New move: `trans x` splits an equality through a chosen middle expression." },
    },
    warrior: route(["Eq.trans"], ["a = b → b = c → a = c"], "Eq.trans"),
    mage: route(["intro hab", "intro hbc", "trans □", "b", "exact hab", "exact hbc"], ["a = b → b = c → a = c", "b = c → a = c", "a = c", "a = c", "a = b", "b = c"], "by\n  intro hab hbc\n  trans b\n  · exact hab\n  · exact hbc"),
    monster: monster("Ivy Automaton", "Two wooden bridges meet at its iron core.", "monsters-3.png", 5, 0, 34),
  },
  {
    id: 28, depth: 3, chapter: "Quantifiers and Equality", title: "Carry Equality Through", topic: "Congruence",
    theorem: "a = b → f a = f b", context: ["α β : Type", "f : α → β", "a b : α"],
    intro: "Equal inputs remain equal when passed through the same function.",
    // Intended Warrior term (shortest lesson route): `fun h => congrArg f h`.
    // Intended Mage moves (shortest lesson route): `intro h → congr → exact h`.
    lesson: lesson("`congrArg` transports equality through a function: equal inputs produce equal outputs under the same function.", "The `congr` tactic reduces equality between matching function applications to equality between their corresponding arguments."),
    unlocks: {
      warrior: { moves: ["catalogue.congrArg"], text: "New catalogue term: `congrArg` accepts a function and equality evidence, transporting the equality through that function." },
      mage: { moves: ["tactic.congr"], text: "New move: `congr` reduces equality between matching applications to equality between their arguments." },
    },
    warrior: route(["fun h => □", "congrArg f h"], ["a = b → f a = f b", "f a = f b"], "fun h => congrArg f h"),
    mage: route(["intro h", "congr", "exact h"], ["a = b → f a = f b", "f a = f b", "a = b"], "by\n  intro h\n  congr\n  exact h"),
    monster: monster("Crimson Scorpion", "Its mirrored claws move as one function.", "monsters-3.png", 6, 0, 34),
  },
  {
    id: 29, depth: 3, chapter: "Quantifiers and Equality", title: "Rewrite the Equal", topic: "Equality rewriting",
    theorem: "a = b → P a → P b", context: ["α : Type", "P : α → Prop", "a b : α"],
    intro: "Equality can rewrite a goal from one equal value to another.",
    // Intended Warrior term (shortest lesson route): `fun hab hPa => Eq.mp (congrArg P hab) hPa`.
    // Intended Mage moves: `intro hab → intro hPa → rw [← □] → hab → exact hPa`.
    lesson: lesson("Equality can transport evidence between propositions obtained by substituting equal values; `Eq.mp` performs that transport across an equality of types.", "The `rw` tactic rewrites matching expressions in a chosen direction. Using `←` rewrites from the equality's right side to its left while keeping the original variables and equality available."),
    unlocks: {
      warrior: { moves: ["catalogue.eqMp"], text: "New catalogue term: `Eq.mp` accepts an equality of propositions and evidence to transport across it." },
      mage: { moves: ["tactic.rewrite"], text: "New moves: `rw [h]` and `rw [← h]` rewrite with equality evidence in either direction." },
    },
    warrior: route(["fun hab => □", "fun hPa => □", "Eq.mp (congrArg P hab) hPa"], ["a = b → P a → P b", "P a → P b", "P b"], "fun hab hPa => Eq.mp (congrArg P hab) hPa"),
    mage: route(["intro hab", "intro hPa", "rw [← □]", "hab", "exact hPa"], ["a = b → P a → P b", "P a → P b", "P b", "P b", "P a"], "by\n  intro hab hPa\n  rw [← hab]\n  exact hPa"),
    monster: monster("Masked Djinn", "It changes one true name into another without loss.", "monsters-3.png", 7, 0, 34),
  },
  {
    id: 30, depth: 4, chapter: "Tactic Craft", title: "Long Application", topic: "Apply chains",
    theorem: "(P → Q) → (Q → R) → (R → S) → P → S", context: ["P Q R S : Prop"],
    intro: "Long implication chains are ordinary function composition viewed as proof search.",
    // Intended Warrior term (shortest lesson route): `fun hPQ hQR hRS hP => hRS (hQR (hPQ hP))`.
    // Intended Mage moves (shortest lesson route): `intro hPQ → intro hQR → intro hRS → intro hP → apply hRS → apply hQR → apply hPQ → exact hP`.
    lesson: lesson("Long implication chains use the same application rule repeatedly, with intermediate proof terms nested from the inside outward.", "On a long chain, repeated `apply` continues working backward through one required premise at a time."),
    warrior: route(["fun hPQ => □", "fun hQR => □", "fun hRS => □", "fun hP => □", "hRS (hQR (hPQ hP))"], ["(P → Q) → (Q → R) → (R → S) → P → S", "(Q → R) → (R → S) → P → S", "(R → S) → P → S", "P → S", "S"], "fun hPQ hQR hRS hP => hRS (hQR (hPQ hP))"),
    mage: route(["intro hPQ", "intro hQR", "intro hRS", "intro hP", "apply hRS", "apply hQR", "apply hPQ", "exact hP"], ["(P → Q) → (Q → R) → (R → S) → P → S", "(Q → R) → (R → S) → P → S", "(R → S) → P → S", "P → S", "S", "R", "Q", "P"], "by\n  intro hPQ hQR hRS hP\n  apply hRS\n  apply hQR\n  apply hPQ\n  exact hP"),
    monster: monster("Three-Headed Hound", "Each throat guards the premise of the next.", "monsters-3.png", 8, 0, 34),
  },
  {
    id: 31, depth: 4, chapter: "Tactic Craft", title: "Nested Pair", topic: "Nested constructors",
    theorem: "P → Q → R → P ∧ (Q ∧ R)", context: ["P Q R : Prop"],
    intro: "Nested conjunctions are trees whose constructors determine their shape.",
    // Intended Warrior term (shortest lesson route): `fun hP hQ hR => And.intro hP (And.intro hQ hR)`.
    // Intended Mage moves (shortest lesson route): `intro hP → intro hQ → intro hR → constructor → exact hP → constructor → exact hQ → exact hR`.
    lesson: lesson("Nested conjunctions are tree-shaped proof data, so each layer requires its own `And.intro` constructor.", "Each `constructor` tactic handles one outer layer of a nested conjunction before its component goals are considered."),
    warrior: route(["fun hP => □", "fun hQ => □", "fun hR => □", "And.intro hP (And.intro hQ hR)"], ["P → Q → R → P ∧ (Q ∧ R)", "Q → R → P ∧ (Q ∧ R)", "R → P ∧ (Q ∧ R)", "P ∧ (Q ∧ R)"], "fun hP hQ hR => And.intro hP (And.intro hQ hR)"),
    mage: route(["intro hP", "intro hQ", "intro hR", "constructor", "exact hP", "constructor", "exact hQ", "exact hR"], ["P → Q → R → P ∧ (Q ∧ R)", "Q → R → P ∧ (Q ∧ R)", "R → P ∧ (Q ∧ R)", "P ∧ (Q ∧ R)", "P", "Q ∧ R", "Q", "R"], "by\n  intro hP hQ hR\n  constructor\n  · exact hP\n  · constructor\n    · exact hQ\n    · exact hR"),
    monster: monster("White Dragonling", "Three nested scales protect its small bright heart.", "monsters-3.png", 9, 92, 126),
  },
  {
    id: 32, depth: 4, chapter: "Tactic Craft", title: "Unwind the Forks", topic: "Nested cases",
    theorem: "(P ∨ Q) ∨ R → R ∨ Q ∨ P", context: ["P Q R : Prop"],
    intro: "Nested disjunctions require nested elimination, with one branch for every possible constructor.",
    // Intended Warrior term (shortest lesson route): `fun h => Or.elim h (fun hpq => Or.elim hpq (fun hP => Or.inr (Or.inr hP)) (fun hQ => Or.inr (Or.inl hQ))) Or.inl`.
    // Intended Mage moves: `intro h → cases □ → h → cases □ → hPQ → right → right → exact hP → right → left → exact hQ → left → exact hR`.
    lesson: lesson("Nested disjunctions can be eliminated one layer at a time, with every possible constructor receiving its own result-producing branch.", "The `cases` tactic can be used again inside a branch when that branch hypothesis is itself a disjunction."),
    warrior: route(["fun h => □", "Or.elim h □ Or.inl", "fun hpq => Or.elim hpq □ □", "fun hP => Or.inr (Or.inr hP)", "fun hQ => Or.inr (Or.inl hQ)"], ["(P ∨ Q) ∨ R → R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P"], "fun h => Or.elim h (fun hpq => Or.elim hpq (fun hP => Or.inr (Or.inr hP)) (fun hQ => Or.inr (Or.inl hQ))) Or.inl"),
    mage: route(["intro h", "cases □", "h", "cases □", "hPQ", "right", "right", "exact hP", "right", "left", "exact hQ", "left", "exact hR"], ["(P ∨ Q) ∨ R → R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P", "R ∨ Q ∨ P", "Q ∨ P", "P", "R ∨ Q ∨ P", "Q ∨ P", "Q", "R ∨ Q ∨ P", "R"], "by\n  intro h\n  cases h with\n  | inl hPQ =>\n    cases hPQ with\n    | inl hP =>\n      right\n      right\n      exact hP\n    | inr hQ =>\n      right\n      left\n      exact hQ\n  | inr hR =>\n    left\n    exact hR", {
      2: ["hPQ : P ∨ Q"],
      3: ["hP : P"],
      4: ["hP : P"],
      5: ["hP : P"],
      6: ["hQ : Q"],
      7: ["hQ : Q"],
      8: ["hQ : Q"],
      9: ["hR : R"],
      10: ["hR : R"],
    }),
    monster: monster("Ashen Eye", "Every pupil opens into another forked corridor.", "monsters-3.png", 4, 92, 126),
  },
  {
    id: 33, depth: 4, chapter: "Tactic Craft", title: "Rewrite by Equivalence", topic: "Iff rewriting",
    theorem: "(P ↔ Q) → P ∨ R → Q ∨ R", context: ["P Q R : Prop"],
    intro: "An equivalence can replace a proposition even when it occurs inside a larger expression.",
    // Intended Warrior term (shortest lesson route): `fun h h2 => Or.elim h2 (fun hP => Or.inl (h.mp hP)) Or.inr`.
    // Intended Mage moves: `intro h → intro h2 → rw [← □] → h → exact h2`.
    lesson: lesson("An equivalence can transport one branch of a larger proposition while the surrounding structure is preserved.", "The previously learned `rw` tactic also accepts equivalence evidence and can rewrite a matching proposition inside a larger goal; `←` still requests the reverse direction."),
    warrior: route(["fun h => □", "fun h2 => □", "Or.elim h2 (fun hP => Or.inl (h.mp hP)) Or.inr"], ["(P ↔ Q) → P ∨ R → Q ∨ R", "P ∨ R → Q ∨ R", "Q ∨ R"], "fun h h2 => Or.elim h2 (fun hP => Or.inl (h.mp hP)) Or.inr"),
    mage: route(["intro h", "intro h2", "rw [← □]", "h", "exact h2"], ["(P ↔ Q) → P ∨ R → Q ∨ R", "P ∨ R → Q ∨ R", "Q ∨ R", "Q ∨ R", "P ∨ R"], "by\n  intro h h2\n  rw [← h]\n  exact h2"),
    monster: monster("Azure Hoarder", "Its stolen rune rewrites the door behind it.", "monsters.png", 1, 92, 126),
  },
  {
    id: 34, depth: 4, chapter: "Tactic Craft", title: "Eliminate the Equal", topic: "Variable elimination",
    theorem: "a = b → g (f a) = g (f b)", context: ["α β γ : Type", "f : α → β", "g : β → γ", "a b : α"],
    intro: "An equality can eliminate one variable by replacing it everywhere with its equal value.",
    // Intended Warrior term (shortest lesson route): `fun h => congrArg g (congrArg f h)`.
    // Intended Mage moves: `intro h → subst □ → b → rfl`.
    lesson: lesson("Congruence can be composed to transport equality through several surrounding functions.", "Unlike `rw`, which performs a directed rewrite while preserving the declarations, `subst b` finds an equality involving `b`, replaces `b` throughout the goal and context, and removes both `b` and the equality."),
    unlocks: { mage: { moves: ["tactic.subst"], text: "New move: `subst x` eliminates a variable using an equality and rewrites the entire goal and environment." } },
    warrior: route(["fun h => □", "congrArg g (congrArg f h)"], ["a = b → g (f a) = g (f b)", "g (f a) = g (f b)"], "fun h => congrArg g (congrArg f h)"),
    mage: route(["intro h", "subst □", "b", "rfl"], ["a = b → g (f a) = g (f b)", "g (f a) = g (f b)", "g (f a) = g (f b)", "g (f a) = g (f a)"], "by\n  intro h\n  subst b\n  rfl"),
    monster: monster("Violet Relay Lich", "Its wand changes every symbol caught in the beam.", "monsters.png", 2, 92, 126),
  },
  {
    id: 35, depth: 4, chapter: "Tactic Craft", title: "Chain the Equalities", topic: "Calculational proofs",
    theorem: "a = b → b = c → f a = f c", context: ["α β : Type", "f : α → β", "a b c : α"],
    intro: "A calculation records intermediate equalities while congruence transports the result through a function.",
    // Intended Warrior term (shortest lesson route): `fun hab hbc => congrArg f (Eq.trans hab hbc)`.
    // Intended Mage moves (shortest lesson route): introduce both equalities, start a calculation through `f b`, and use `congr` in both steps.
    lesson: lesson("Larger equality proofs can compose transitivity and congruence, using the output of one proof term as input to another.", "A `calc` block presents a chain of intermediate expressions and requires evidence for each adjacent equality in the chain."),
    unlocks: { mage: { moves: ["tactic.calc"], text: "New move: a `calc` step records an intermediate equality and asks for its supporting evidence." } },
    warrior: route(["fun hab => □", "fun hbc => □", "congrArg f (Eq.trans hab hbc)"], ["a = b → b = c → f a = f c", "b = c → f a = f c", "f a = f c"], "fun hab hbc => congrArg f (Eq.trans hab hbc)"),
    mage: route(["intro hab", "intro hbc", "calc … = □ := □", "f b", "congr", "exact hab", "congr", "exact hbc"], ["a = b → b = c → f a = f c", "b = c → f a = f c", "f a = f c", "f a = f c", "f a = f b", "a = b", "f b = f c", "b = c"], "by\n  intro hab hbc\n  calc\n    f a = f b := by\n      congr\n    _ = f c := by\n      congr"),
    monster: monster("Crowned Proof-Knight", "Every equality in the dungeon ends at its throne.", "monsters-2.png", 9, 92, 126),
  },
  {
    id: 36, depth: 4, chapter: "Tactic Craft", title: "Split on Truth", topic: "Excluded middle",
    theorem: "P ∨ ¬P", context: ["P : Prop"],
    intro: "Classical excluded middle states that every proposition is true or false.",
    // Intended Warrior term (shortest lesson route): `Classical.em P`.
    // Intended Mage moves: `by_cases □ → P → left → exact hP → right → exact hP`.
    lesson: lesson("`Classical.em P` provides a disjunction expressing that a proposition either holds or does not hold.", "The classical `by_cases` tactic creates two branches: one with evidence for the chosen proposition and one with evidence for its negation."),
    unlocks: {
      warrior: { moves: ["catalogue.classicalEm"], text: "New catalogue term: `Classical.em` accepts a proposition and supplies its two alternatives." },
      mage: { moves: ["tactic.byCases"], text: "New move: `by_cases h : P` creates branches for positive and negative evidence." },
    },
    warrior: route(["Classical.em P"], ["P ∨ ¬P"], "Classical.em P"),
    mage: route(["by_cases □", "P", "left", "exact hP", "right", "exact hP"], ["P ∨ ¬P", "P ∨ ¬P", "P ∨ ¬P", "P", "P ∨ ¬P", "¬P"], "by\n  by_cases hP : P\n  · left; exact hP\n  · right; exact hP", {
      1: ["hP : P"],
      2: ["hP : P"],
      3: ["hP : ¬P"],
      4: ["hP : ¬P"],
    }),
    monster: monster("Copper Mirror Gargoyle", "Its mirror always shows one of two possible worlds.", "monsters.png", 4, 92, 126),
  },
  {
    id: 37, depth: 4, chapter: "Tactic Craft", title: "Explode the Clash", topic: "Contradiction tactic",
    theorem: "¬P → P → Q", context: ["P Q : Prop"],
    intro: "Once both `P` and `¬P` are present, the contradiction proves any target.",
    // Intended Warrior term (shortest lesson route): `fun hnP hP => False.elim (hnP hP)`.
    // Intended Mage moves (shortest lesson route): `intro hnP → intro hP → contradiction`.
    lesson: lesson("When positive and negative evidence for the same proposition are both available, applying the negative proof to the positive one produces `False`.", "The `contradiction` tactic searches the local environment for evidence that cannot consistently coexist."),
    unlocks: { mage: { moves: ["tactic.contradiction"], text: "New move: `contradiction` closes a goal when the environment contains incompatible evidence." } },
    warrior: route(["fun hnP => □", "fun hP => □", "False.elim (hnP hP)"], ["¬P → P → Q", "P → Q", "Q"], "fun hnP hP => False.elim (hnP hP)"),
    mage: route(["intro hnP", "intro hP", "contradiction"], ["¬P → P → Q", "P → Q", "Q"], "by\n  intro hnP hP\n  contradiction"),
    monster: monster("Frozen Stitched Pair", "The seams cannot contain its opposing halves.", "monsters.png", 3, 92, 126),
  },
  {
    id: 38, depth: 4, chapter: "Tactic Craft", title: "Close by Reduction", topic: "Definitional equality",
    theorem: "∀ n : Nat, n + 0 = n", context: [],
    intro: "Some equalities hold because both sides reduce to the same expression by definition.",
    // Intended Warrior term (shortest lesson route): `Eq.refl`.
    // Intended Mage moves (shortest lesson route): `intro n → rfl`.
    lesson: lesson("`Eq.refl` can prove equalities whose sides reduce to the same expression by computation, even when they are written differently.", "The `rfl` tactic unfolds definitions as needed and closes an equality when both sides are definitionally equal."),
    unlocks: {
      completion: ["catalogue.natAddZero"],
      warrior: { moves: [], text: "Completion reward: `Nat.add_zero` records this fact as a reusable catalogue theorem." },
      mage: { moves: [], text: "Completion reward: `Nat.add_zero` records this fact as a reusable catalogue theorem." },
    },
    warrior: route(["Eq.refl"], ["∀ n : Nat, n + 0 = n"], "Eq.refl"),
    mage: route(["intro n", "rfl"], ["∀ n : Nat, n + 0 = n", "n + 0 = n"], "by\n  intro n\n  rfl"),
    monster: monster("Amber Emberhorn", "Its final step vanishes by simple reduction.", "monsters.png", 6, 92, 126),
  },
  {
    id: 39, depth: 5, chapter: "Induction and Calculation", title: "Zero on the Left", topic: "Natural-number induction",
    theorem: "∀ n : Nat, 0 + n = n", context: [],
    intro: "When computation follows a recursive argument, induction mirrors the definition's two cases.",
    // Intended Warrior term (shortest lesson route): `fun n => Nat.rec (motive := fun n => 0 + n = n) (Eq.refl 0) (fun k ih => congrArg Nat.succ ih) n`.
    // Intended Mage moves: introduce and induct on `n`; use `rfl` at zero, then reduce the successor case and prove the reduced argument equality with `ih`.
    lesson: lesson("`Nat.rec` proves a property of every natural number from a proof at zero and a step that extends the property from one number to its successor.", "The `induction` tactic creates constructor cases and an induction hypothesis. LeanQuest's restricted `simp` performs built-in reductions only: it never uses hypotheses or catalogue theorems, closes a goal made trivial by reduction, and otherwise leaves the reduced goal for explicit tactics."),
    unlocks: {
      shared: ["catalogue.dataConstructors"],
      completion: ["catalogue.natZeroAdd"],
      warrior: { moves: ["catalogue.recursor"], text: "New catalogue terms: recursors are functions accepting base, step, and data arguments. Completion adds the proved theorem `Nat.zero_add`." },
      mage: { moves: ["tactic.induction", "tactic.simp"], text: "New moves: `induction x` creates constructor cases. `simp` performs built-in reductions without using any hypothesis or catalogue theorem; it closes a goal made trivial by reduction and otherwise leaves the reduced goal. Completion adds the proved theorem `Nat.zero_add`." },
    },
    warrior: route(["fun n => □", "Nat.rec □ □ n", "Eq.refl 0", "fun k ih => congrArg Nat.succ ih"], ["∀ n : Nat, 0 + n = n", "0 + n = n", "0 + 0 = 0", "0 + Nat.succ k = Nat.succ k"], "fun n => Nat.rec (motive := fun n => 0 + n = n) (Eq.refl 0) (fun k ih => congrArg Nat.succ ih) n"),
    mage: route(["intro n", "induction □", "n", "rfl", "simp", "congr", "exact □", "ih"], ["∀ n : Nat, 0 + n = n", "0 + n = n", "0 + n = n", "0 + 0 = 0", "0 + Nat.succ n = Nat.succ n", "Nat.succ (0 + n) = Nat.succ n", "0 + n = n", "0 + n = n"], "by\n  intro n\n  induction n with\n  | zero => rfl\n  | succ n ih =>\n      change Nat.succ (0 + n) = Nat.succ n\n      congr\n      exact ih", {
      2: [],
      3: ["n : Nat", "ih : 0 + n = n"],
    }),
    monster: monster("Glacial Frosthorn", "It returns once for zero and once for every successor.", "monsters.png", 7, 92, 126),
  },
  {
    id: 40, depth: 5, chapter: "Induction and Calculation", title: "Successor Addition", topic: "Recursive reduction",
    theorem: "∀ n m : Nat, n + Nat.succ m = Nat.succ (n + m)", context: [],
    intro: "Natural-number addition is defined by recursion on its second argument.",
    // Intended Warrior term (shortest lesson route): `fun n m => Eq.refl (n + Nat.succ m)`.
    // Intended Mage moves (shortest lesson route): `intro n → intro m → rfl`.
    lesson: lesson("A recursive definition may compute immediately when its recursive argument is already in constructor form, making reflexivity sufficient.", "The `rfl` tactic performs definitional reduction, so a single recursive computation step does not necessarily require induction."),
    unlocks: {
      completion: ["catalogue.natAddSucc"],
      warrior: { moves: [], text: "Completion reward: `Nat.add_succ` records this reduction rule as a reusable catalogue theorem." },
      mage: { moves: [], text: "Completion reward: `Nat.add_succ` records this reduction rule as a reusable catalogue theorem." },
    },
    warrior: route(["fun n => □", "fun m => □", "Eq.refl (n + Nat.succ m)"], ["∀ n m : Nat, n + Nat.succ m = Nat.succ (n + m)", "∀ m : Nat, n + Nat.succ m = Nat.succ (n + m)", "n + Nat.succ m = Nat.succ (n + m)"], "fun n m => Eq.refl (n + Nat.succ m)"),
    mage: route(["intro n", "intro m", "rfl"], ["∀ n m : Nat, n + Nat.succ m = Nat.succ (n + m)", "∀ m : Nat, n + Nat.succ m = Nat.succ (n + m)", "n + Nat.succ m = Nat.succ (n + m)"], "by\n  intro n m\n  rfl"),
    monster: monster("Teal Forked Adder", "The second head always reveals the next successor.", "monsters.png", 8, 92, 126),
  },
  {
    id: 41, depth: 5, chapter: "Induction and Calculation", title: "Associate the Sums", topic: "Inductive equality",
    theorem: "∀ c b a : Nat, (a + b) + c = a + (b + c)", context: [],
    intro: "Associativity follows by induction on the recursive final argument.",
    // Intended Warrior term (shortest lesson route): `fun c b a => Nat.rec (motive := fun c => (a + b) + c = a + (b + c)) (Eq.refl ((a + b) + 0)) (fun k ih => congrArg Nat.succ ih) c`.
    // Intended Mage moves: introduce the values, induct on `c`, use `rfl` at zero, then reduce, use congruence, and supply `ih`.
    lesson: lesson("In an inductive step, the induction hypothesis is ordinary equality evidence and can be transported through surrounding functions with `congrArg`.", "After `induction`, the successor branch may use its induction hypothesis just like any other local hypothesis."),
    unlocks: {
      completion: ["catalogue.natAddAssoc"],
      warrior: { moves: [], text: "Completion reward: `Nat.add_assoc` adds the proved associativity fact to the catalogue." },
      mage: { moves: [], text: "Completion reward: `Nat.add_assoc` adds the proved associativity fact to the catalogue." },
    },
    warrior: route(["fun c => □", "fun b => □", "fun a => □", "Nat.rec □ □ c", "Eq.refl ((a + b) + 0)", "fun k ih => congrArg Nat.succ ih"], ["∀ c b a, (a + b) + c = a + (b + c)", "∀ b a, (a + b) + c = a + (b + c)", "∀ a, (a + b) + c = a + (b + c)", "(a + b) + c = a + (b + c)", "(a + b) + 0 = a + (b + 0)", "(a + b) + Nat.succ k = a + (b + Nat.succ k)"], "fun c b a => Nat.rec (motive := fun c => (a + b) + c = a + (b + c)) (Eq.refl ((a + b) + 0)) (fun k ih => congrArg Nat.succ ih) c"),
    mage: route(["intro c", "intro b", "intro a", "induction □", "c", "rfl", "simp", "congr", "exact □", "ih"], ["∀ c b a, (a + b) + c = a + (b + c)", "∀ b a, (a + b) + c = a + (b + c)", "∀ a, (a + b) + c = a + (b + c)", "(a + b) + c = a + (b + c)", "(a + b) + c = a + (b + c)", "(a + b) + 0 = a + (b + 0)", "(a + b) + Nat.succ c = a + (b + Nat.succ c)", "Nat.succ ((a + b) + c) = Nat.succ (a + (b + c))", "(a + b) + c = a + (b + c)", "(a + b) + c = a + (b + c)"], "by\n  intro c b a\n  induction c with\n  | zero => rfl\n  | succ c ih =>\n      change Nat.succ ((a + b) + c) = Nat.succ (a + (b + c))\n      congr\n      exact ih", {
      4: ["a : Nat", "b : Nat"],
      5: ["a : Nat", "b : Nat", "c : Nat", "ih : (a + b) + c = a + (b + c)"],
    }),
    monster: monster("Elder Void Warden", "Three sums bend around its ancient shadow.", "monsters.png", 9, 92, 126),
  },
  {
    id: 42, depth: 5, chapter: "Induction and Calculation", title: "Commute the Sums", topic: "Using proved theorems",
    theorem: "∀ a b : Nat, a + b = b + a", context: [],
    intro: "Larger developments reuse earlier theorems rather than reconstructing every proof.",
    // Intended Warrior term: induction on `b`, using `Nat.zero_add`, `Nat.succ_add`, and congruence in the two cases.
    // Intended Mage route: introduce both numbers, induct on `b`, reduce each case, and explicitly rewrite with the proved zero fact, `ih`, and `Nat.succ_add`.
    lesson: lesson("Previously proved theorems can handle the zero case, while `Nat.succ_add` and congruence align the successor case.", "Induction reduces commutativity to the previously proved zero facts and the supporting rule `Nat.succ_add`."),
    unlocks: {
      shared: ["catalogue.natSuccAdd"],
      completion: ["catalogue.natAddComm"],
      warrior: { moves: [], text: "New supporting theorem: `Nat.succ_add`. Completion adds the proved theorem `Nat.add_comm` to the catalogue." },
      mage: { moves: [], text: "New supporting theorem: `Nat.succ_add`. Completion adds the proved theorem `Nat.add_comm` to the catalogue." },
    },
    warrior: route(["fun a => □", "fun b => □", "Nat.rec □ □ b", "Eq.symm (Nat.zero_add a)", "fun k ih => Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add k a))"], ["∀ a b : Nat, a + b = b + a", "∀ b : Nat, a + b = b + a", "a + b = b + a", "a + 0 = 0 + a", "a + Nat.succ k = Nat.succ k + a"], "fun a b => Nat.rec (motive := fun b => a + b = b + a) (Eq.symm (Nat.zero_add a)) (fun k ih => Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add k a))) b"),
    mage: route(["intro a", "intro b", "induction □", "b", "simp", "rw [□]", "Nat.zero_add", "rfl", "simp", "rw [□]", "ih", "rw [□]", "Nat.succ_add", "rfl"], ["∀ a b : Nat, a + b = b + a", "∀ b : Nat, a + b = b + a", "a + b = b + a", "a + b = b + a", "a + 0 = 0 + a", "a = 0 + a", "a = a", "a = a", "a + Nat.succ b = Nat.succ b + a", "Nat.succ (a + b) = Nat.succ b + a", "Nat.succ (b + a) = Nat.succ b + a", "Nat.succ (b + a) = Nat.succ (b + a)", "Nat.succ (b + a) = Nat.succ (b + a)", "Nat.succ (b + a) = Nat.succ (b + a)"], "by\n  intro a b\n  induction b with\n  | zero =>\n      change a = 0 + a\n      rw [Nat.zero_add]\n  | succ b ih =>\n      change Nat.succ (a + b) = Nat.succ b + a\n      rw [ih, Nat.succ_add]"),
    monster: monster("Fungal Sentinel", "It swaps every pair of stones in its fairy ring.", "monsters-2.png", 0, 92, 126),
  },
  {
    id: 43, depth: 5, chapter: "Induction and Calculation", title: "Append Nothing", topic: "List induction",
    theorem: "∀ xs : List α, xs ++ [] = xs", context: ["α : Type"],
    intro: "Lists have empty and cons constructors, so list induction follows those two shapes.",
    // Intended Warrior term (shortest lesson route): `fun xs => List.rec (motive := fun xs => xs ++ [] = xs) (Eq.refl []) (fun x xs ih => congrArg (List.cons x) ih) xs`.
    // Intended Mage moves: introduce and induct on `xs`; reduce the cons case, then rewrite explicitly with `ih`.
    lesson: lesson("`List.rec` proves a property for every list from an empty-list proof and a step for extending a list by one element.", "Induction on a list follows its `nil` and `cons` constructors, providing an induction hypothesis about the tail in the `cons` branch."),
    unlocks: {
      completion: ["catalogue.listAppendNil"],
      warrior: { moves: [], text: "Completion reward: `List.append_nil` adds the proved empty-append fact to the catalogue." },
      mage: { moves: [], text: "Completion reward: `List.append_nil` adds the proved empty-append fact to the catalogue." },
    },
    warrior: route(["fun xs => □", "List.rec □ □ xs", "Eq.refl []", "fun x xs ih => congrArg (List.cons x) ih"], ["∀ xs : List α, xs ++ [] = xs", "xs ++ [] = xs", "[] ++ [] = []", "(x :: xs) ++ [] = x :: xs"], "fun xs => List.rec (motive := fun xs => xs ++ [] = xs) (Eq.refl []) (fun x xs ih => congrArg (List.cons x) ih) xs"),
    mage: route(["intro xs", "induction □", "xs", "rfl", "simp", "rw [□]", "ih", "rfl"], ["∀ xs : List α, xs ++ [] = xs", "xs ++ [] = xs", "xs ++ [] = xs", "[] ++ [] = []", "(x :: xs) ++ [] = x :: xs", "x :: xs ++ [] = x :: xs", "x :: xs = x :: xs", "x :: xs = x :: xs"], "by\n  intro xs\n  induction xs with\n  | nil => rfl\n  | cons x xs ih =>\n      change x :: (xs ++ []) = x :: xs\n      rw [ih]", {
      2: [],
      3: ["x : α", "xs : List α", "ih : xs ++ [] = xs"],
    }),
    monster: monster("Indigo Book Mimic", "Its last page is empty, yet the story remains unchanged.", "monsters-2.png", 1, 92, 126),
  },
  {
    id: 44, depth: 5, chapter: "Induction and Calculation", title: "Associate the Lists", topic: "Structural theorem reuse",
    theorem: "∀ xs ys zs : List α, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", context: ["α : Type"],
    intro: "List append is associative, and its reusable theorem accepts three lists.",
    // Intended Warrior term: list induction on `xs`, using reflexivity and congruence for the two constructors.
    // Intended Mage moves: introduce the lists and induct on `xs`; reduce the cons case, then rewrite explicitly with `ih`.
    lesson: lesson("Append associativity follows the recursive structure of its first list; congruence carries the tail result beneath a shared head.", "Induction on the first list exposes the defining equations of append in both constructor cases."),
    unlocks: {
      completion: ["catalogue.listAppendAssoc"],
      warrior: { moves: [], text: "Completion reward: `List.append_assoc` adds the proved associativity fact to the catalogue." },
      mage: { moves: ["tactic.simpa"], text: "New move: `simpa using h` simplifies a supplied proof and the goal before matching them. Completion adds `List.append_assoc` to the catalogue." },
    },
    warrior: route(["fun xs => □", "fun ys => □", "fun zs => □", "List.rec □ □ xs", "Eq.refl (ys ++ zs)", "fun x xs ih => congrArg (List.cons x) ih"], ["∀ xs ys zs, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "∀ ys zs, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "∀ zs, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "(xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "([] ++ ys) ++ zs = [] ++ (ys ++ zs)", "((x :: xs) ++ ys) ++ zs = (x :: xs) ++ (ys ++ zs)"], "fun xs ys zs => List.rec (motive := fun xs => (xs ++ ys) ++ zs = xs ++ (ys ++ zs)) (Eq.refl (ys ++ zs)) (fun x xs ih => congrArg (List.cons x) ih) xs"),
    mage: route(["intro xs", "intro ys", "intro zs", "induction □", "xs", "rfl", "simp", "rw [□]", "ih", "rfl"], ["∀ xs ys zs, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "∀ ys zs, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "∀ zs, (xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "(xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "(xs ++ ys) ++ zs = xs ++ (ys ++ zs)", "([] ++ ys) ++ zs = [] ++ (ys ++ zs)", "((x :: xs) ++ ys) ++ zs = (x :: xs) ++ (ys ++ zs)", "x :: ((xs ++ ys) ++ zs) = x :: (xs ++ (ys ++ zs))", "x :: (xs ++ (ys ++ zs)) = x :: (xs ++ (ys ++ zs))", "x :: (xs ++ (ys ++ zs)) = x :: (xs ++ (ys ++ zs))"], "by\n  intro xs ys zs\n  induction xs with\n  | nil => rfl\n  | cons x xs ih =>\n      change x :: ((xs ++ ys) ++ zs) = x :: (xs ++ (ys ++ zs))\n      rw [ih]"),
    monster: monster("Onyx Cave Beetle", "Three chains of carapace connect in either grouping.", "monsters-2.png", 2, 92, 126),
  },
  {
    id: 45, depth: 5, chapter: "Induction and Calculation", title: "Measure the Append", topic: "Simplification",
    theorem: "∀ xs ys : List α, (xs ++ ys).length = xs.length + ys.length", context: ["α : Type"],
    intro: "Recursive functions on inductive values often produce equations that simplification can solve.",
    // Intended Warrior term: list induction on `xs`, combining the tail equality with `Nat.succ_add` in the cons case.
    // Intended Mage moves: induct on `xs`, use `simp` only for reductions, and rewrite explicitly with the zero, successor, and induction facts.
    lesson: lesson("List induction relates the length of an appended tail to the whole list; `Nat.succ_add` aligns the arithmetic in the cons case.", "Restricted `simp` exposes the recursive length and append equations without using facts. The zero theorem, induction hypothesis, and `Nat.succ_add` must then be selected explicitly with `rw`."),
    unlocks: {
      completion: ["catalogue.listLengthAppend"],
      warrior: { moves: [], text: "Completion reward: `List.length_append` adds the proved length formula to the catalogue." },
      mage: { moves: [], text: "Completion reward: `List.length_append` adds the proved length formula to the catalogue." },
    },
    warrior: route(["fun xs => □", "fun ys => □", "List.rec □ □ xs", "Eq.symm (Nat.zero_add ys.length)", "fun x xs ih => Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add xs.length ys.length))"], ["∀ xs ys, (xs ++ ys).length = xs.length + ys.length", "∀ ys, (xs ++ ys).length = xs.length + ys.length", "(xs ++ ys).length = xs.length + ys.length", "([] ++ ys).length = [].length + ys.length", "((x :: xs) ++ ys).length = (x :: xs).length + ys.length"], "fun xs ys => List.rec (motive := fun xs => (xs ++ ys).length = xs.length + ys.length) (Eq.symm (Nat.zero_add ys.length)) (fun x xs ih => Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add xs.length ys.length))) xs"),
    mage: route(["intro xs", "intro ys", "induction □", "xs", "simp", "rw [□]", "Nat.zero_add", "rfl", "simp", "rw [□]", "Nat.succ_add", "congr", "exact □", "ih"], ["∀ xs ys, (xs ++ ys).length = xs.length + ys.length", "∀ ys, (xs ++ ys).length = xs.length + ys.length", "(xs ++ ys).length = xs.length + ys.length", "(xs ++ ys).length = xs.length + ys.length", "([] ++ ys).length = [].length + ys.length", "ys.length = 0 + ys.length", "ys.length = ys.length", "ys.length = ys.length", "((x :: xs) ++ ys).length = (x :: xs).length + ys.length", "Nat.succ ((xs ++ ys).length) = Nat.succ xs.length + ys.length", "Nat.succ ((xs ++ ys).length) = Nat.succ (xs.length + ys.length)", "(xs ++ ys).length = xs.length + ys.length", "(xs ++ ys).length = xs.length + ys.length", "(xs ++ ys).length = xs.length + ys.length"], "by\n  intro xs ys\n  induction xs with\n  | nil =>\n      change ys.length = 0 + ys.length\n      rw [Nat.zero_add]\n  | cons x xs ih =>\n      change Nat.succ ((xs ++ ys).length) = Nat.succ xs.length + ys.length\n      rw [Nat.succ_add]\n      congr\n      exact ih"),
    monster: monster("Gilded Raven Cultist", "It counts every feather sewn onto its cloak.", "monsters-2.png", 3, 92, 126),
  },
  {
    id: 46, depth: 6, chapter: "The Capstone Abyss", title: "Sum the Joined Hoards", topic: "Defining sum and append induction",
    theorem: sumAppendTheorem, context: [],
    intro: "The new function `sum` returns zero for `[]` and adds each head to the sum of its tail.",
    // Intended Warrior term (32 catalogue selections; shortest lesson route): introduce `xs` and `ys`, use one `List.rec` on `xs`, then use `Nat.zero_add`, `congrArg`, and `Nat.add_assoc` in its cases; this contains one recursor.
    // Intended Mage moves: induct on `xs`, use `simp` for constructor reduction only, and select the zero, induction, and associativity rewrites explicitly.
    lesson: lesson("The equations `sum [] = 0` and `sum (x :: xs) = x + sum xs` let a list recursor expose one addition at a time. After Lean checks a theorem, later theorems can use its name as a proof term instead of repeating its proof.", "Restricted `simp` unfolds the defining equations at constructors but uses no facts. Close each branch by explicitly rewriting with `Nat.zero_add`, the induction hypothesis, and `Nat.add_assoc`."),
    unlocks: {
      shared: ["catalogue.sum", "catalogue.natAddLemmas"],
      completion: ["catalogue.sumAppend"],
      warrior: { moves: [], text: "New catalogue terms: `sum`, `Nat.zero_add`, and `Nat.add_assoc`; `sum` reduces on list constructors, and completion adds `sum_append`." },
      mage: { moves: [], text: "New reduction: `simp` unfolds `sum` at list constructors without using addition laws or hypotheses; completing this level adds `sum_append`." },
    },
    warrior: route(["fun xs => □", "fun ys => □", sumAppendProof.slice("fun xs ys => ".length)], Array.from({ length: 3 }, () => sumAppendTheorem), sumAppendProof),
    mage: route(["intro xs", "intro ys", "induction □", "xs", "simp", "rw [□]", "Nat.zero_add", "rfl", "simp", "rw [□]", "ih", "rw [← □]", "Nat.add_assoc", "rfl"], Array.from({ length: 14 }, () => sumAppendTheorem), "by\n  intro xs ys\n  induction xs with\n  | nil =>\n      change sum ys = 0 + sum ys\n      rw [Nat.zero_add]\n  | cons x xs ih =>\n      change x + sum (xs ++ ys) = (x + sum xs) + sum ys\n      rw [ih, Nat.add_assoc]"),
    monster: monster("Hoard-Sum Automaton", "Its brass ledger fuses two treasure trains without losing a single coin.", "monsters-3.png", 5, 184, 218),
  },
  {
    id: 47, depth: 6, chapter: "The Capstone Abyss", title: "Weight of a Permutation", topic: "Induction on permutation evidence",
    theorem: "∀ xs ys : List Nat, List.Perm xs ys → sum xs = sum ys", context: [],
    intro: "`List.Perm xs ys` is evidence that `ys` can be obtained from `xs` without adding or removing elements.",
    // Intended Warrior term (45 catalogue selections; shortest lesson route): introduce the lists and permutation proof, then use one `List.Perm.rec`; its cases use reflexivity, congruence, `Nat.add_left_comm`, and transitivity.
    // Intended Mage moves: induct on `h`, use `simp` only to expose constructor definitions, and handle each equality with explicit hypotheses or named arithmetic rewrites.
    lesson: lesson("`List.Perm.rec` follows the evidence for an unchanged list, a shared head, a neighboring swap, or a transitive chain. Each case preserves `sum` for a different equality reason. A binder such as `fun {xs} =>` names an implicit value used by a recursor branch.", "Induction can follow a proof object such as `h : List.Perm xs ys`, producing one goal for each way permutation evidence can be built."),
    unlocks: {
      shared: ["catalogue.natAddLeftComm"],
      warrior: { moves: ["catalogue.listPermRec"], text: "New catalogue terms: the genuine `List.Perm.rec` eliminator and `Nat.add_left_comm`." },
      mage: { moves: [], text: "New induction target: `induction h` follows the four constructors of permutation evidence." },
    },
    warrior: route(["fun xs => □", "fun ys => □", "fun h => □", "List.Perm.rec (Eq.refl 0) (fun x l1 l2 h ih => congrArg (Nat.add x) ih) (fun x y l => Nat.add_left_comm y x (sum l)) (fun h1 h2 ih1 ih2 => Eq.trans ih1 ih2) h"], Array.from({ length: 4 }, () => "∀ xs ys : List Nat, List.Perm xs ys → sum xs = sum ys"), "fun xs ys h => List.Perm.rec (motive := fun xs ys _ => sum xs = sum ys) (Eq.refl 0) (fun x _ _ _ ih => congrArg (Nat.add x) ih) (fun x y l => Nat.add_left_comm y x (sum l)) (fun _ _ ih1 ih2 => Eq.trans ih1 ih2) h"),
    mage: route(["intro xs", "intro ys", "intro h", "induction □", "h", "simp", "simp", "rw [□]", "ih", "rfl", "simp", "rw [□]", "Nat.add_left_comm", "rfl", "calc … = □ := □", "sum l2", "exact □", "ih1", "exact □", "ih2"], Array.from({ length: 20 }, () => "List.Perm xs ys → sum xs = sum ys"), "by\n  intro xs ys h\n  induction h with\n  | refl => rfl\n  | cons x h ih =>\n      change x + sum _ = x + sum _\n      rw [ih]\n  | swap x y l =>\n      change y + (x + sum l) = x + (y + sum l)\n      rw [Nat.add_left_comm]\n  | trans h1 h2 ih1 ih2 =>\n      calc\n        sum _ = sum _ := by exact ih1\n        _ = sum _ := by exact ih2"),
    monster: monster("Permutation Scorpion Matriarch", "Every shuffle of its jeweled segments leaves their total weight unchanged.", "monsters-3.png", 6, 184, 218),
  },
  {
    id: 48, depth: 6, chapter: "The Capstone Abyss", title: "Swap the Caravans", topic: "Composing sum equalities",
    theorem: "∀ xs ys : List Nat, sum (xs ++ ys) = sum (ys ++ xs)", context: [],
    intro: "Two entire caravans may exchange places without changing the combined weight of their cargo.",
    // Intended Warrior term (25 catalogue selections; shortest lesson route): introduce `xs` and `ys`, chain `sum_append xs ys`, commutativity, and the symmetry of `sum_append ys xs`; this contains no recursor.
    // Intended Mage moves: introduce the lists, rewrite both append sums explicitly, rewrite by commutativity, and close the reflexive result.
    lesson: lesson("The catalogued equality `sum_append` can be specialized in both orders and joined to commutativity with `Eq.trans`. Symmetry turns the second append equation toward the desired destination.", "Use `rw` to select `sum_append` for each side and then `Nat.add_comm`. Restricted `simp` will not select any of these catalogue theorems automatically."),
    warrior: route(["fun xs => □", "fun ys => □", "Eq.trans (sum_append xs ys) (Eq.trans (Nat.add_comm (sum xs) (sum ys)) (Eq.symm (sum_append ys xs)))"], Array.from({ length: 3 }, () => "∀ xs ys : List Nat, sum (xs ++ ys) = sum (ys ++ xs)"), "fun xs ys => Eq.trans (sum_append xs ys) (Eq.trans (Nat.add_comm (sum xs) (sum ys)) (Eq.symm (sum_append ys xs)))"),
    mage: route(["intro xs", "intro ys", "rw [□]", "sum_append", "rw [□]", "sum_append", "rw [□]", "Nat.add_comm", "rfl"], Array.from({ length: 9 }, () => "sum (xs ++ ys) = sum (ys ++ xs)"), "by\n  intro xs ys\n  rw [sum_append, sum_append, Nat.add_comm]"),
    monster: monster("Caravan-Swapping Djinn", "It exchanges two processions at once, but their combined burden never changes.", "monsters-3.png", 7, 184, 218),
  },
  {
    id: 49, depth: 6, chapter: "The Capstone Abyss", title: "Count the Copies", topic: "Replication and multiplication",
    theorem: "∀ n x : Nat, sum (List.replicate n x) = n * x", context: [],
    intro: "`List.replicate n x` constructs a list containing exactly `n` copies of `x`.",
    // Intended Warrior term (37 catalogue selections; shortest lesson route): introduce `n` and `x`, use one `Nat.rec` on `n`, and combine congruence, commutativity, and `Nat.succ_mul` in the successor case.
    // Intended Mage moves: induct on `n`, reduce each constructor case, and explicitly rewrite with the multiplication laws, `ih`, and commutativity.
    lesson: lesson("`List.replicate` reduces to `[]` at zero and adds one copy at a successor. The theorem `Nat.succ_mul` describes the matching successor behavior of multiplication.", "Induct on the copy count and use restricted `simp` only for constructor reduction. Then explicitly select `Nat.zero_mul`, the induction hypothesis, `Nat.succ_mul`, and `Nat.add_comm` with `rw`."),
    unlocks: {
      shared: ["catalogue.listReplicate"],
      completion: ["catalogue.sumReplicate"],
      warrior: { moves: [], text: "New catalogue terms: `List.replicate`, `Nat.zero_mul`, and `Nat.succ_mul`; completing this level adds `sum_replicate`." },
      mage: { moves: [], text: "New definitions: restricted `simp` reduces replication at zero and successor counts; multiplication theorems must still be selected explicitly. Completion adds `sum_replicate`." },
    },
    warrior: route(["fun n => □", "fun x => □", sumReplicateProofBody], Array.from({ length: 3 }, () => "∀ n x : Nat, sum (List.replicate n x) = n * x"), `fun n x => ${sumReplicateProofBody}`),
    mage: route(["intro n", "intro x", "induction □", "n", "simp", "rw [□]", "Nat.zero_mul", "rfl", "simp", "rw [□]", "ih", "rw [□]", "Nat.succ_mul", "rw [□]", "Nat.add_comm", "rfl"], Array.from({ length: 16 }, () => "sum (List.replicate n x) = n * x"), "by\n  intro n x\n  induction n with\n  | zero =>\n      change 0 = 0 * x\n      rw [Nat.zero_mul]\n  | succ n ih =>\n      change x + sum (List.replicate n x) = Nat.succ n * x\n      rw [ih, Nat.succ_mul, Nat.add_comm]"),
    monster: monster("Replication Hound Triumvirate", "Every head counts another identical row of coins.", "monsters-3.png", 8, 184, 218),
  },
  {
    id: 50, depth: 6, chapter: "The Capstone Abyss", title: "Echo Every Wagon", topic: "Nested list and natural-number induction",
    theorem: "∀ xs : List Nat, ∀ n : Nat, sum (repeatEach n xs) = n * sum xs", context: [],
    intro: "`repeatEach n xs` replaces every value in `xs` with `n` consecutive copies of that value.",
    // Intended Warrior proof uses nested recursion; the Mage route inducts on the source list and explicitly reuses the previously proved block theorems.
    lesson: lesson("`repeatEach n [] = []`, while `repeatEach n (x :: xs) = List.replicate n x ++ repeatEach n xs`. Recurse over the source list, using the catalogued `sum_replicate` result for each head block and natural recursion in the empty branch.", "Induct on the source list. Restricted `simp` exposes the empty and cons definitions, after which `sum_append`, `sum_replicate`, the outer induction hypothesis, and `Nat.mul_add` must each be selected explicitly."),
    unlocks: {
      shared: ["catalogue.repeatEach"],
      warrior: { moves: [], text: "New catalogue terms: `repeatEach` and `Nat.mul_add`, which distributes a repeated count across a sum." },
      mage: { moves: [], text: "New reductions: `repeatEach n [] = []` and `repeatEach n (x :: xs) = List.replicate n x ++ repeatEach n xs`." },
    },
    warrior: route(["fun xs => □", sumRepeatEachProof.slice("fun xs => ".length)], Array.from({ length: 2 }, () => "∀ xs : List Nat, ∀ n : Nat, sum (repeatEach n xs) = n * sum xs"), sumRepeatEachProof),
    mage: route(["intro xs", "induction □", "xs", "intro n", "simp", "intro n", "simp", "rw [□]", "sum_append", "rw [□]", "sum_replicate", "rw [□]", "ih", "rw [□]", "Nat.mul_add", "rfl"], Array.from({ length: 16 }, () => "sum (repeatEach n xs) = n * sum xs"), "by\n  intro xs\n  induction xs with\n  | nil =>\n      intro n\n      rfl\n  | cons x xs ih =>\n      intro n\n      change sum (List.replicate n x ++ repeatEach n xs) = n * (x + sum xs)\n      rw [sum_append, sum_replicate, ih, Nat.mul_add]"),
    monster: monster("Echo-Convoy Dragon", "Every wagon it sees returns in a thundering block of identical copies.", "monsters-3.png", 9, 184, 218),
  },
] satisfies Omit<Exercise, "kind">[];

const levels: Exercise[] = levelEntries.map((exercise) => {
  const selections = selectionsForLevel(exercise.id);
  return {
    ...exercise,
    kind: "level",
    warrior: { ...exercise.warrior, selections: selections.warrior },
    mage: { ...exercise.mage, selections: selections.mage },
  };
});

const openingStory: StorySequence = {
  kind: "story",
  id: "the-broken-axiom",
  title: "The Broken Axiom",
  panels: [
    {
      title: "The Tower of Proof",
      text: [
        "For generations, the Tower of Proof guarded the realm by binding every truth in an unbroken chain.",
        "Its golden light held contradiction beyond the borders of the known world.",
      ],
      layers: [
        { id: "tower", frames: ["/assets/story/tower-of-proof.png"], alt: "The Tower of Proof above a dark valley" },
      ],
    },
    {
      title: "The First Theorem Shatters",
      text: [
        "Then the First Theorem was torn apart, and its unfinished proofs crawled into the depths as monsters.",
        "Each stolen fragment can be restored only by completing the truth it once contained.",
      ],
      layers: [
        { id: "archive", frames: ["/assets/story/broken-axiom.png"], alt: "A luminous theorem shattering in the tower archive" },
        {
          id: "fracture-light",
          frames: ["/assets/story/theorem-spark-1.png", "/assets/story/theorem-spark-2.png"],
          alt: "A pulsing magical fracture",
          frameDurationMs: 760,
          layout: { left: "32%", top: "10%", width: "36%", height: "80%", objectFit: "contain", opacity: 0.62 },
        },
      ],
    },
    {
      title: "Two Paths Below",
      text: [
        "The dungeon answers two disciplines: the Warrior forges proof terms directly, while the Mage reshapes goals with tactics.",
        "Choose a path, descend, and restore the chain one theorem at a time.",
      ],
      layers: [
        { id: "paths", frames: ["/assets/story/two-paths.png"], alt: "A sword path and a staff path descending into the dungeon" },
      ],
    },
  ],
};

const hallOfNamesStory: StorySequence = {
  kind: "story",
  id: "the-hall-of-names",
  title: "The Hall of Names",
  panels: [
    {
      title: "The Hall of Names",
      text: [
        "Beyond the familiar seals lies a hall whose doors no longer speak of fixed propositions, but of arbitrary values.",
        "To cross it, a proof must reason about every possible name—or produce one witness that answers the call.",
      ],
      layers: [
        { id: "hall", frames: ["/assets/story/hall-of-names.png"], alt: "An endless dungeon hall of unnamed stone tablets" },
        {
          id: "hall-light",
          frames: ["/assets/story/theorem-spark-1.png", "/assets/story/theorem-spark-2.png"],
          alt: "Pulsing light over the nearest tablet",
          frameDurationMs: 980,
          layout: { left: "25%", top: "13%", width: "50%", height: "70%", objectFit: "contain", opacity: 0.55 },
        },
      ],
    },
  ],
};

export const curriculum: CurriculumEntry[] = [
  openingStory,
  ...levels.slice(0, 20),
  hallOfNamesStory,
  ...levels.slice(20),
];

export const exercises = curriculum.filter((entry): entry is Exercise => entry.kind === "level");
export const storySequences = curriculum.filter((entry): entry is StorySequence => entry.kind === "story");

export const depthNames = [
  "The Hall of Assumptions",
  "The Crypt of Connectives",
  "The Vault of Quantifiers",
  "The Tactician's Maze",
  "The Recursive Depths",
  "The Capstone Abyss",
];

export function unlockedMoves(levelId: number, hero: HeroClass) {
  const moves = new Set<MoveId>();
  for (const exercise of exercises) {
    if (exercise.id > levelId) break;
    exercise.unlocks?.shared?.forEach((move) => moves.add(move));
    if (exercise.id < levelId) {
      exercise.unlocks?.completion?.forEach((move) => moves.add(move));
    }
    exercise.unlocks?.[hero]?.moves.forEach((move) => moves.add(move));
  }
  return moves;
}

export function newMoveText(exercise: Exercise, hero: HeroClass) {
  return exercise.unlocks?.[hero]?.text;
}

if (exercises.length !== 50) {
  throw new Error(`LeanQuest curriculum must contain 50 paired encounters, found ${exercises.length}.`);
}

if (new Set(exercises.map((exercise) => exercise.monster.name)).size !== exercises.length) {
  throw new Error("Every paired encounter must have a unique monster identity.");
}

if (new Set(storySequences.map((story) => story.id)).size !== storySequences.length) {
  throw new Error("Every story sequence must have a unique id.");
}

for (const story of storySequences) {
  if (!story.panels.length) throw new Error(`Story ${story.id} must contain at least one panel.`);
  for (const [panelIndex, panel] of story.panels.entries()) {
    if (!panel.layers.length) throw new Error(`Story ${story.id}, panel ${panelIndex + 1} must contain an image layer.`);
    if (!panel.text.length) throw new Error(`Story ${story.id}, panel ${panelIndex + 1} must contain text.`);
    for (const layer of panel.layers) {
      if (layer.frames.length < 1 || layer.frames.length > 2) {
        throw new Error(`Story layer ${story.id}/${layer.id} must contain one or two frames.`);
      }
    }
  }
}

for (const exercise of exercises) {
  if (buildTermProof(exercise.warrior.moves).includes("□")) {
    throw new Error(`Level ${exercise.id} has an incomplete warrior proof route.`);
  }
  for (const hero of ["warrior", "mage"] as HeroClass[]) {
    if (exercise[hero].moves.length !== exercise[hero].targets.length) {
      throw new Error(`Level ${exercise.id} has an invalid ${hero} proof route.`);
    }
    if (exercise.lesson[hero].length > 3) {
      throw new Error(`Level ${exercise.id} exceeds the three-sentence lesson limit.`);
    }
  }
  if (exercise.monster.sprite.cell < 0 || exercise.monster.sprite.cell > 9) {
    throw new Error(`Level ${exercise.id} has an invalid monster sprite cell.`);
  }
}
