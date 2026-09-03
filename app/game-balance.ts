import type { HeroClass } from "./curriculum";

export const RESOURCE_CONSUMPTION_ENABLED = true;

export const MAX_HP: Record<HeroClass, number> = {
  champion: 480,
  apprentice: 210,
};

export const MAX_MANA: Record<HeroClass, number> = {
  champion: 0,
  apprentice: 30,
};

export const TARGET_RESERVE_MOVES: Record<HeroClass, number> = {
  champion: 4,
  apprentice: 2,
};

export function attackDamageFor(hero: HeroClass, intendedSelections: number) {
  const targetDuration = intendedSelections + TARGET_RESERVE_MOVES[hero] - 1;
  return Math.max(1, Math.round(MAX_HP[hero] / targetDuration));
}

export function hpAfterIntendedRoute(hero: HeroClass, intendedSelections: number) {
  return MAX_HP[hero] - Math.max(0, intendedSelections - 1) * attackDamageFor(hero, intendedSelections);
}

export const MAX_VISION_POINTS = 5;

export const TACTIC_MANA_COSTS = {
  exact: 1,
  intro: 1,
  rfl: 1,
  left: 2,
  right: 2,
  exfalso: 2,
  use: 2,
  symm: 2,
  congr: 2,
  apply: 3,
  contradiction: 4,
  byContra: 4,
  trans: 3,
  subst: 3,
  rewrite: 3,
  simp: 3,
  simpa: 3,
  calc: 3,
  constructor: 4,
  cases: 4,
  rcases: 4,
  byCases: 5,
  induction: 5,
} as const;

export function tacticManaCost(choiceId: string) {
  if (choiceId === "tactic-exact") return TACTIC_MANA_COSTS.exact;
  if (choiceId === "tactic-intro") return TACTIC_MANA_COSTS.intro;
  if (choiceId === "tactic-rfl") return TACTIC_MANA_COSTS.rfl;
  if (choiceId === "tactic-left") return TACTIC_MANA_COSTS.left;
  if (choiceId === "tactic-right") return TACTIC_MANA_COSTS.right;
  if (choiceId === "tactic-exfalso") return TACTIC_MANA_COSTS.exfalso;
  if (choiceId === "tactic-use") return TACTIC_MANA_COSTS.use;
  if (choiceId === "tactic-symm") return TACTIC_MANA_COSTS.symm;
  if (choiceId === "tactic-congr") return TACTIC_MANA_COSTS.congr;
  if (choiceId === "tactic-apply") return TACTIC_MANA_COSTS.apply;
  if (choiceId === "tactic-contradiction") return TACTIC_MANA_COSTS.contradiction;
  if (choiceId === "tactic-by-contra") return TACTIC_MANA_COSTS.byContra;
  if (choiceId.startsWith("tactic-trans-")) return TACTIC_MANA_COSTS.trans;
  if (choiceId.startsWith("tactic-subst-")) return TACTIC_MANA_COSTS.subst;
  if (choiceId.startsWith("tactic-rw-")) return TACTIC_MANA_COSTS.rewrite;
  if (choiceId === "tactic-simp") return TACTIC_MANA_COSTS.simp;
  if (choiceId === "tactic-simpa") return TACTIC_MANA_COSTS.simpa;
  if (choiceId.startsWith("tactic-calc-")) return TACTIC_MANA_COSTS.calc;
  if (choiceId === "tactic-constructor") return TACTIC_MANA_COSTS.constructor;
  if (choiceId.startsWith("tactic-cases-")) return TACTIC_MANA_COSTS.cases;
  if (choiceId.startsWith("tactic-rcases-")) return TACTIC_MANA_COSTS.rcases;
  if (choiceId.startsWith("tactic-by-cases-")) return TACTIC_MANA_COSTS.byCases;
  if (choiceId.startsWith("tactic-nat-rec-") || choiceId.startsWith("tactic-list-rec-") ||
      choiceId.startsWith("tactic-perm-rec-")) {
    return TACTIC_MANA_COSTS.induction;
  }
  throw new Error(`No mana cost configured for tactic choice ${choiceId}.`);
}
