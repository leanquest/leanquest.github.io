export const musicCues = {
  title: {
    title: "Ave Verum Corpus · William Byrd",
    url: "/music/title.mid",
    loop: true,
    loopSeconds: 58 * 4 * 60 / 76,
  },
  combat: {
    title: "Theorem Under Siege",
    url: "/music/battle.mid",
    loop: true,
    loopSeconds: 59.975,
  },
  victory: {
    title: "Q.E.D. Fanfare",
    url: "/music/victory.mid",
    loop: false,
  },
  "story-broken-axiom": {
    title: "Fracture in the First Theorem",
    url: "/music/story-broken-axiom.mid",
    loop: true,
    loopSeconds: 64 * 60 / 70,
  },
  "story-hall-of-names": {
    title: "Names Without End",
    url: "/music/story-hall-of-names.mid",
    loop: true,
    loopSeconds: 48 * 60 / 82,
  },
} as const;

export type MusicCueId = keyof typeof musicCues;

export const storyMusic: Record<string, MusicCueId> = {
  "the-broken-axiom": "title",
  "the-hall-of-names": "story-hall-of-names",
};
