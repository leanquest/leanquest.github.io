<!-- Copyright 2026 Adam Petcher; SPDX-License-Identifier: Apache-2.0 -->

# LeanQuest

LeanQuest is a browser-based game where the player constructs proofs in Lean to defeat monsters. Players will learn the basics of machine-checked proofs, terms as proofs, induction, and Lean terms and tactics. The game is intended to be a fun (and sometimes challenging) introduction to machine-checked proofs, but not really a Lean tutorial.

LeanQuest is an independent educational game based on the [Lean programming
language](https://lean-lang.org). Lean is a trademark of Lean FRO, LLC. LeanQuest
is not affiliated with or endorsed by Lean FRO.

## Requirements

- Node.js 22
- npm

## Local development

Install dependencies and start the native Next.js development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The convenience scripts `./start-game.sh` and `./stop-game.sh` can also start
and stop the local development server in the background. Set `LEANQUEST_PORT`
to use a port other than 3000.

## Validation

```bash
npm test
npm run lint
```

`npm test` creates a production Next.js build, checks every intended proof
route and game-balance constraint, validates the MIDI assets, and verifies that
the built application produces a valid static export.

## Saved progress

Campaign progress is stored in the browser's `localStorage` under
`leanquest-campaign-v6`. Champion and Apprentice progress are tracked separately.
Music preferences are stored under `leanquest-music-v1`.

There is no account system or server-side database. Progress is local to a
particular browser profile and site origin, does not synchronize between
devices, and is removed when that browser's site data is cleared.

## Deployment

LeanQuest is statically exported and hosted at
[leanquest.github.io](https://leanquest.github.io/) using GitHub Pages. The
workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site
whenever `main` is pushed, and can also be run manually from the Actions tab.

In the repository's GitHub settings, Pages must use **GitHub Actions** as its
source. No environment variables, server runtime, or external storage services
are required.

## License

Copyright 2026 Adam Petcher. The source code, configuration, tests, scripts, and
documentation are licensed under the [Apache License 2.0](./LICENSE).

The image and music assets are excluded from the Apache license and carry their
own notices in [`public/assets/cc0_images/`](./public/assets/cc0_images/LICENSE.md)
and [`public/music/`](./public/music/README.md).

Third-party software and font licenses are collected in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md). Deployments expose the
Apache license and third-party notices under `/legal/` and link them from the
in-game Credits panel.
