// Copyright 2026 Adam Petcher (to the extent copyright subsists)
// SPDX-License-Identifier: Apache-2.0

import type { HeroClass } from "./curriculum.ts";

export type ClassCompletion = Record<HeroClass, readonly number[]>;
export type TitleDestination = "opening-story" | "character-select" | "saved-game";

export function canSelectHero(
  hero: HeroClass,
  completed: ClassCompletion,
  finalLevelId: number,
) {
  return hero === "apprentice" || completed.apprentice.includes(finalLevelId);
}

export function destinationFromTitle(
  hasUnseenOpeningStory: boolean,
  selectedClass?: HeroClass,
): TitleDestination {
  if (hasUnseenOpeningStory) return "opening-story";
  return selectedClass ? "saved-game" : "character-select";
}
