# LeanQuest

LeanQuest is a browser-based proof game that teaches Lean through two parallel
campaigns. Champions construct proof terms while Apprentices use tactics to defeat the
same 50 theorem guardians.

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
