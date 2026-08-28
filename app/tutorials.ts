import type { HeroClass } from "./curriculum";

export type TutorialTarget =
  | "guardian"
  | "level-objective"
  | "environment"
  | "vitals"
  | "move-catalogue"
  | "proof-scroll"
  | "next-level";

export type TutorialPlacement = "top-left" | "top-center" | "bottom-center";

export type TutorialAction =
  | { type: "continue"; label: string }
  | { type: "choice"; choiceId: string }
  | { type: "one-of"; choiceIds: string[] }
  | { type: "natural-number"; choiceId: string }
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
        title: "Meet the Guardian",
        text: "Each guardian wants a term of a particular type. Give the guardian what the Level Objective asks for to complete the level.",
        targets: ["guardian", "level-objective"],
        placement: "bottom-center",
        action: { type: "continue", label: "SHOW ME MY RESOURCES" },
      },
      {
        title: "HP and MP",
        text: "HP is your health: if it reaches zero, the proof attempt fails. MP powers Mage tactics, so stronger moves may spend more of it.",
        targets: ["vitals"],
        placement: "top-left",
        action: { type: "continue", label: "SHOW ME THE CATALOGUE" },
      },
      {
        title: "Choose a Tactic",
        text: "The Move Catalogue is where you construct what the guardian needs. Click the exact □ tactic to begin supplying a natural number. This is the only action that continues the tutorial.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Only Legal Moves",
        text: "The catalogue only shows moves that are legal for the current goal or open hole. Click natural number, enter any number, and insert it to give that value to the guardian.",
        hint: "Insert any natural number to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "natural-number", choiceId: "term-natural-number" },
      },
      {
        title: "Read the Finished Proof",
        text: "The Scroll of Proof records the Lean proof you constructed. The guardian is defeated, but the tutorial keeps the chamber locked until you click Enter Next Chamber.",
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
        text: "The environment lists values and facts that are already available in this level. Here, n : Nat means you have a natural number named n that can be used in your proof.",
        compact: true,
        targets: ["environment"],
        placement: "top-left",
        action: { type: "continue", label: "USE THE ENVIRONMENT" },
      },
      {
        title: "Open an Exact Move",
        text: "Use exact □ when the environment already contains something with the same type as the goal. Click exact □ to choose what fills the proof hole.",
        hint: "Choose exact □ in the highlighted catalogue to continue.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Choose from the Environment",
        text: "The catalogue now shows the legal Nat values. Choose n—the natural number supplied by the environment—to give it to the guardian.",
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
        text: "Guardians will ask for different types of things. Always check the Level Objective to see which type of value you must construct. This guardian wants a List Nat.",
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
        text: "The empty list constructor [] builds a list with no elements. Choose [] to give the guardian an empty List Nat.",
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
        text: "A Prop is a statement that may be true or false. At this level, the guardian wants a proposition itself—you do not need to prove whether that statement is true.",
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
        text: "Every option shown is a Prop. Some statements are true and some are false, but either kind is still a proposition. Choose any one to give to the guardian.",
        hint: "Choose any proposition in the highlighted catalogue to finish the tutorial.",
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
];

export function tutorialForLevel(hero: HeroClass, levelId: number) {
  return levelTutorials.find((tutorial) => tutorial.hero === hero && tutorial.levelId === levelId);
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
