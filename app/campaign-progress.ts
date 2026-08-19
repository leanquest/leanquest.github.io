import type { HeroClass } from "./curriculum.ts";

export type ClassCompletion = Record<HeroClass, readonly number[]>;
export type TitleDestination = "opening-story" | "character-select" | "saved-game";

export function canSelectHero(
  hero: HeroClass,
  completed: ClassCompletion,
  finalLevelId: number,
) {
  return hero === "mage" || completed.mage.includes(finalLevelId);
}

export function destinationFromTitle(
  hasUnseenOpeningStory: boolean,
  selectedClass?: HeroClass,
): TitleDestination {
  if (hasUnseenOpeningStory) return "opening-story";
  return selectedClass ? "saved-game" : "character-select";
}
