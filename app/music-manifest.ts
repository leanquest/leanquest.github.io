export const musicCues = {
  title: {
    title: "Ave Verum Corpus · William Byrd",
    url: "/music/title.mid",
    loop: true,
    loopSeconds: 58 * 4 * 60 / 76,
    trackVoices: null,
  },
  combat: {
    title: "Battle Moosak",
    url: "/music/battle.mid",
    loop: true,
    loopSeconds: 59.975,
    trackVoices: ["marimba", "marimba", "timpani"],
  },
  victory: {
    title: "Triumph",
    url: "/music/victory.mid",
    loop: false,
    trackVoices: ["marimba", "marimba", "timpani"],
  },
  "story-rescue": {
    title: "Great Fugue in G minor · J. S. Bach",
    url: "/music/story-rescue-fugue.mid",
    loop: true,
    loopSeconds: 343.125,
    trackVoices: ["church-organ", "church-organ", "church-organ", "church-organ", "church-organ", "church-organ", "church-organ"],
  },
  "story-induction": {
    title: "Gib dich zufrieden und sei stille · J. S. Bach",
    url: "/music/story-induction.mid",
    loop: true,
    loopSeconds: 81,
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
