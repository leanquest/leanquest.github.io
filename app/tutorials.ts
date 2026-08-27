import type { HeroClass } from "./curriculum";

export type TutorialTarget =
  | "guardian"
  | "level-objective"
  | "vitals"
  | "move-catalogue"
  | "proof-scroll"
  | "next-level";

export type TutorialPlacement = "top-left" | "top-center" | "bottom-center";

export type TutorialAction =
  | { type: "continue"; label: string }
  | { type: "choice"; choiceId: string }
  | { type: "natural-number"; choiceId: string }
  | { type: "next-level" };

export type TutorialStep = {
  title: string;
  text: string;
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
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "choice", choiceId: "tactic-exact" },
      },
      {
        title: "Only Legal Moves",
        text: "The catalogue only shows moves that are legal for the current goal or open hole. Click natural number, enter any number, and insert it to give that value to the guardian.",
        targets: ["move-catalogue"],
        placement: "top-left",
        action: { type: "natural-number", choiceId: "term-natural-number" },
      },
      {
        title: "Read the Finished Proof",
        text: "The Scroll of Proof records the Lean proof you constructed. The guardian is defeated, but the tutorial keeps the chamber locked until you click Enter Next Chamber.",
        targets: ["proof-scroll", "next-level"],
        placement: "top-center",
        action: { type: "next-level" },
      },
    ],
  },
];

export function tutorialForLevel(hero: HeroClass, levelId: number) {
  return levelTutorials.find((tutorial) => tutorial.hero === hero && tutorial.levelId === levelId);
}

export function tutorialAllowsChoice(step: TutorialStep | null, choiceId: string) {
  if (!step) return true;
  return (step.action.type === "choice" || step.action.type === "natural-number") &&
    step.action.choiceId === choiceId;
}

export function tutorialChoiceAdvances(step: TutorialStep | null, choiceId: string, value?: string) {
  if (!step || !tutorialAllowsChoice(step, choiceId)) return false;
  return step.action.type === "choice" ||
    (step.action.type === "natural-number" && value !== undefined);
}
