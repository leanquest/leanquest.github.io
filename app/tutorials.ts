import type { HeroClass } from "./curriculum";

export type TutorialTarget =
  | "guardian"
  | "level-objective"
  | "environment"
  | "vitals"
  | "move-catalogue"
  | "proof-scroll"
  | "next-level"
  | "undo"
  | "restart-level"
  | "lesson"
  | "character-select"
  | "map"
  | "library-button"
  | "library-view";

export type TutorialPlacement = "top-left" | "top-center" | "bottom-center";

export type TutorialAction =
  | { type: "continue"; label: string }
  | { type: "choice"; choiceId: string }
  | { type: "one-of"; choiceIds: string[] }
  | { type: "natural-number"; choiceId: string }
  | { type: "open-library" }
  | { type: "close-library" }
  | { type: "next-level" };

export type TutorialStep = {
  title: string;
  text: string;
  hint?: string;
  compact?: boolean;
  targets: TutorialTarget[];
  placement: TutorialPlacement;
  action: TutorialAction;
};

export type LevelTutorial = {
  id: string;
  hero: HeroClass;
  levelId: number;
  steps: TutorialStep[];
};

export const levelTutorials: LevelTutorial[] = [
  {
    id: "mage-level-1",
    hero: "mage",
    levelId: 1,
    steps: [
      {
        title: "A Game of Terms",
        text: "The goal of the game is to construct terms. Think of a term as a specific magic word or phrase, and you construct terms using your abilities.",
        targets: ["guardian", "level-objective"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME THE GUARDIAN" },
      },
      {
        title: "Meet the Guardian",
        text: "Every term has a type, and the guardian is defeated by a term of a specific type. The Level Objective shows the type of term required to complete the level. In this level, the guardian is defeated by any Nat (a natural number a.k.a. a non-negative integer).",
        targets: ["guardian", "level-objective"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME MY RESOURCES" },
      },
      {
        title: "Health Points",
        text: "You have a certain amount of health points as shown in the HP bar. After every player move, the guardian will attack. If the player's HP reaches zero, the player fails the level and must restart it.",
        targets: ["vitals"],
        placement: "top-left",
        action: { type: "continue", label: "SHOW ME MY MAGIC POINTS" },
      },
      {
        title: "Magic Points",
        text: "Magic points (MP) are used by the mage to invoke tactics, which are like spells that produce terms. Each tactic has a different MP requirement.",
        targets: ["vitals"],
        placement: "top-left",
        action: { type: "continue", label: "SHOW ME THE CATALOGUE" },
      },
      {
        title: "Make a Move",
        text: "The Move Catalogue shows moves that are available to the player. For now, the only available move is the exact □ tactic. The □ symbol is a hole that must be filled with a term, and the player must provide this term in the next move. Choose the exact □ tactic to continue.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Only Legal Moves",
        text: "The catalogue only shows moves that can potentially be used to produce a term of the correct type. Click natural number, enter any number, and insert it into the hole in the exact tactic.",
        hint: "Insert any natural number to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "natural-number", choiceId: "term-natural-number" },
      },
      {
        title: "Read the Finished Scroll",
        text: "The Scroll of Construction records the Lean code that constructs the required term. The guardian is defeated. Click Enter Next Chamber to continue.",
        hint: "Click Enter Next Chamber to finish the tutorial.",
        targets: ["proof-scroll", "next-level"],
        placement: "top-center",
        action: { type: "next-level" },
      },
    ],
  },
  {
    id: "mage-level-2",
    hero: "mage",
    levelId: 2,
    steps: [
      {
        title: "The Environment",
        text: "The environment lists terms that are already available. Think of it like your inventory. Here, n : Nat means you have a natural number named n that can be used in your construction.",
        compact: true,
        targets: ["environment"],
        placement: "top-left",
        action: { type: "continue", label: "USE THE ENVIRONMENT" },
      },
      {
        title: "Open an Exact Move",
        text: "We will use the exact □ tactic like before, but this time we will use the number we have instead of constructing one.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Choose from the Environment",
        text: "The catalogue now shows the legal Nat values. Choose n—the natural number supplied by the environment.",
        hint: "Choose n from the highlighted catalogue to finish the tutorial.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "term-n" },
      },
    ],
  },
  {
    id: "mage-level-3",
    hero: "mage",
    levelId: 3,
    steps: [
      {
        title: "Different Objectives",
        text: "Levels will require different types of terms. Always check the Level Objective to see which type of term you must construct. To defeat this guardian, produce a List Nat, which is a list of natural numbers.",
        targets: ["level-objective"],
        placement: "bottom-center",
        action: { type: "continue", label: "BUILD A LIST" },
      },
      {
        title: "Supply the Exact Type",
        text: "Start with exact □ to supply a value whose type matches the Level Objective.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Construct an Empty List",
        text: "A constructor is used to construct a term of a specific type. The empty list constructor [] builds a list with no elements. Choose [] to give the guardian an empty list.",
        hint: "Choose [] in the highlighted catalogue to finish the tutorial.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "term-[]" },
      },
    ],
  },
  {
    id: "mage-level-4",
    hero: "mage",
    levelId: 4,
    steps: [
      {
        title: "What Is a Prop?",
        text: "A Prop (short for proposition) is any statement that may be true or false. For this level, supply any proposition—you do not need to prove whether that statement is true.",
        targets: ["level-objective"],
        placement: "bottom-center",
        action: { type: "continue", label: "CHOOSE A PROPOSITION" },
      },
      {
        title: "Supply a Proposition",
        text: "Use exact □ to open the catalogue of values whose type is Prop.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "True or False Statements",
        text: "Every option shown is a Prop. Some statements are true and some are false, but either kind is still a proposition. Choose any one to defeat the guardian.",
        hint: "Choose any proposition in the highlighted catalogue to finish the level.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "one-of", choiceIds: [
          "term-True",
          "term-False",
          "term-∃ n : Nat, n > 0",
          "term-∀ A : Prop, A ∨ ¬A",
          "term-∀ n : Nat, n > 0",
        ] },
      },
    ],
  },
  {
    id: "mage-level-5",
    hero: "mage",
    levelId: 5,
    steps: [
      {
        title: "Propositions as Types",
        text: "When the Level Objective is a particular proposition, a term of that type is a proof of the proposition. To complete this level, construct a term whose type is True.",
        targets: ["level-objective"],
        placement: "bottom-center",
        action: { type: "continue", label: "CONSTRUCT A PROOF" },
      },
      {
        title: "Supply an Exact Proof",
        text: "True is obviously true, so we can easily construct a proof of it. Choose exact □ to see what we can use.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Construct a Proof of True",
        text: "True.intro is the constructor for True. In the same way that [] constructs an empty list, True.intro constructs a proof of True. Choose True.intro to defeat the guardian.",
        hint: "Choose True.intro in the highlighted catalogue to finish the tutorial.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "term-True.intro" },
      },
    ],
  },
  {
    id: "mage-level-6",
    hero: "mage",
    levelId: 6,
    steps: [
      {
        title: "The Rest of the User Interface",
        text: "The Undo button, marked with a back arrow, returns the Scroll of Construction to the state before your previous move. Use this button sparingly, because your HP and MP are not restored.",
        targets: ["undo"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME RESTART" },
      },
      {
        title: "Restart the Level",
        text: "The Restart button discards your moves in the current attempt and begins the level again with fully restored HP/MP.",
        targets: ["restart-level"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME LEVEL INFO" },
      },
      {
        title: "Review Level Information",
        text: "The Lesson button, marked with an info symbol, explains the current objective and any newly available moves.",
        targets: ["lesson"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME CHARACTER SELECT" },
      },
      {
        title: "Change Characters",
        text: "The character button returns to character selection, where you can switch between the paths you have unlocked.",
        targets: ["character-select"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME THE MAP" },
      },
      {
        title: "View the Dungeon Map",
        text: "The Map button shows your progress through the dungeon and lets you revisit unlocked chambers.",
        targets: ["map"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME THE LIBRARY" },
      },
      {
        title: "Open the Library",
        text: "The Library collects every term and tactic that can be used as a move. Click the Library button to open it now.",
        hint: "Click the highlighted Library button to continue.",
        targets: ["library-button"],
        placement: "bottom-center",
        action: { type: "open-library" },
      },
      {
        title: "The Move Library",
        text: "The Library groups your available terms and tactics by purpose. Term entries show the type of term they construct, while tactic entries explain how they transform or complete a goal. As you progress through the game, you will unlock new terms and tactics. Close the Library to return to the encounter.",
        hint: "Close the Library to continue the tutorial.",
        targets: ["library-view"],
        placement: "top-center",
        action: { type: "close-library" },
      },
      {
        title: "Tutorial Complete",
        text: "In this level, you need to supply a term of type P, and P is a Prop. That is, you need to supply a proof of P. Fortunately, you have one in your environment, and you know how to use it. The tutorial ends here. Now you face the guardians alone.",
        targets: [],
        placement: "bottom-center",
        action: { type: "continue", label: "CONTINUE LEVEL" },
      },
    ],
  },
];

export function tutorialForLevel(hero: HeroClass, levelId: number) {
  return levelTutorials.find((tutorial) => tutorial.hero === hero && tutorial.levelId === levelId);
}

export function shouldAutoOpenLesson(hero: HeroClass, levelId: number, seenLessonIds: readonly number[]) {
  return !tutorialForLevel(hero, levelId) && !seenLessonIds.includes(levelId);
}

export function tutorialAllowsChoice(step: TutorialStep | null, choiceId: string) {
  if (!step) return true;
  if (step.action.type === "one-of") return step.action.choiceIds.includes(choiceId);
  return (step.action.type === "choice" || step.action.type === "natural-number") && step.action.choiceId === choiceId;
}

export function tutorialChoiceAdvances(step: TutorialStep | null, choiceId: string, value?: string) {
  if (!step || !tutorialAllowsChoice(step, choiceId)) return false;
  return step.action.type === "choice" || step.action.type === "one-of" ||
    (step.action.type === "natural-number" && value !== undefined);
}
