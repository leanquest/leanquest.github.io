export const musicCues = {
  title: {
    title: "Ave Verum Corpus · William Byrd",
    url: "/music/title.mid",
    loop: true,
    loopSeconds: 58 * 4 * 60 / 76,
    trackVoices: null,
  },
  combat: {
    title: "Theorem Under Siege",
    url: "/music/battle.mid",
    loop: true,
    loopSeconds: 59.975,
    trackVoices: ["marimba", "marimba", "timpani"],
  },
  victory: {
    title: "Battle Moosak Triumph",
    url: "/music/victory.mid",
    loop: false,
    trackVoices: ["marimba", "marimba", "timpani"],
  },
  "story-rescue": {
    title: "Undeniable Truth",
    url: "/music/story-broken-axiom.mid",
    loop: true,
    loopSeconds: 64 * 60 / 70,
    trackVoices: null,
  },
  "story-induction": {
    title: "Pattern Without End",
    url: "/music/story-hall-of-names.mid",
    loop: true,
    loopSeconds: 48 * 60 / 82,
    trackVoices: null,
  },
} as const;

export type MusicCueId = keyof typeof musicCues;

export const storyMusic: Record<string, MusicCueId> = {
  "the-hollow": "title",
  "induction-apprentice": "story-induction",
  "induction-champion": "story-induction",
  "the-rescue-apprentice": "story-rescue",
  "the-rescue-champion": "story-rescue",
};
