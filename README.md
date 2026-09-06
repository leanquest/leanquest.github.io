<!-- Copyright 2026 Adam Petcher (to the extent copyright subsists); SPDX-License-Identifier: Apache-2.0 -->

# LeanQuest

LeanQuest is a browser-based proof game that teaches Lean through two parallel
campaigns. Champions construct proof terms while Apprentices use tactics to defeat the
same 50 theorem guardians.

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
the built application can server-render.

## Music

The browser renders the MIDI files in `public/music/` through Tone.js. To
regenerate the arrangements and original compositions produced by the project script, run:

```bash
npm run music:generate
```

The combat compositions “Battle Moosak” (`public/music/battle.mid`) and “Triumph”
(`public/music/victory.mid`) are supplied separately and are not overwritten by
that command.

## Image assets

The images currently distributed with the game, including the favicon, are in
`public/assets/cc0_images/` and covered by the notice in that directory. Images added under other licenses
should be kept outside that directory with their own license notices.

## Saved progress

Campaign progress is stored in the browser's `localStorage` under
`leanquest-campaign-v6`. Champion and Apprentice progress are tracked separately.
Music preferences are stored under `leanquest-music-v1`.

There is no account system or server-side database. Progress is local to a
particular browser profile and site origin, does not synchronize between
devices, and is removed when that browser's site data is cleared.

## Deployment

LeanQuest is configured as a standard Next.js application for deployment from
a GitHub repository to Vercel. Import the repository as a new Vercel project,
select the Next.js framework preset if it is not detected automatically, and
leave the build command and output directory at their framework defaults.

Branch pushes produce preview deployments, while the configured production
branch produces the production deployment. No environment variables or
external storage services are currently required.

## License

To the extent copyright subsists, copyright 2026 Adam Petcher. The source code, configuration, tests, scripts, and
documentation are licensed under the [Apache License 2.0](./LICENSE).

The image and music assets are excluded from the Apache license and carry their
own notices in [`public/assets/cc0_images/`](./public/assets/cc0_images/LICENSE.md)
and [`public/music/`](./public/music/README.md).

Third-party software and font licenses are collected in
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md). Deployments expose the
Apache license and third-party notices under `/legal/` and link them from the
in-game Credits panel.
