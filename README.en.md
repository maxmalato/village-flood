# Village Flood

[Versão em português](README.md)

A **cooperative** board game for the browser, for 2 to 4 seats (people or bots). Heavy rain makes the river rise: the team brings the residents to the church and, at the end, every volunteer boards at the dock. The team wins or loses together. It runs on phones, tablets, desktops and Smart TV browsers, and can be installed as an app (PWA).

> **Status:** in development. Stages 0 to 6 are ready. Stage 7 is left: games with people to calibrate the numbers, and publishing on Cloudflare (`v1.0`). See the [roadmap](docs/ROADMAP.md) (in Portuguese).

## How to play

- Each volunteer has a role with an ability: Firefighter, Boat Pilot, Engineer, Medic, Radio Host or Neighbor.
- On your turn you have **3 actions**: move, pick up a resident, heal, place a sandbag, and the role actions. You can undo until you end the turn.
- When the turn ends, a rain card is drawn and the river rises. Low tiles flood and then go under; residents left in the water get injured and end up stranded.
- **Victory:** save the goal number of residents (by bringing them to the church) and gather every volunteer at the dock. **Defeat:** too many stranded residents, or the river reaching the top.
- Three difficulties: Calm (with the "Hint" button), Normal and Storm. Each game draws which houses get the extra residents and whether the map is mirrored.

Full rules in [docs/village-flood-rules.md](docs/village-flood-rules.md) (in Portuguese).

## Modes

- **On this device:** everyone around the same screen. Bots fill the team. Works offline after the first visit.
- **Online:** "Create an online room" gives a 6-symbol code, a link (`?sala=CODE`) and a QR code; the others use "Join with a code" or open the link. Outside your turn, you suggest moves (Go here, Careful, Pick up here). If someone drops, a bot plays for them until they come back; the device reconnects on its own.
- **Table:** "Open the table (TV or laptop)" shows the big board, and each person plays on their phone (joining through the QR code). The first person to join runs the room. The full legend opens on the TV with the remote or with the "Show the legend on the TV" button on a phone.

## Accessibility

- Water states never rely on color alone (height number, waves and hatching); ✓ and ✗ marks on the houses; suggestions have their own shapes.
- Touch targets of at least 44 px, minimum 4.5:1 contrast in the light and dark themes, visible focus, a whole game playable with the keyboard, a label on every tile, and events announced to screen readers.
- Short animations, turned off when the device asks to reduce motion. Short sounds, with the "Sound" button at the top of every screen.
- Portuguese (Brazil) and English.

Checklist and measurements in [docs/quality-checklist.md](docs/quality-checklist.md) (in Portuguese).

## Documentation

All documents are in Portuguese.

- [Rules](docs/village-flood-rules.md), with the open points and the decision log at the end
- [Technical specification](docs/village-flood-tech-spec.md)
- [Roadmap](docs/ROADMAP.md)
- [Accessibility and performance checklist](docs/quality-checklist.md)
- [Simulation reports](docs/simulation/)
- [Mockups](docs/mockups/)

## Structure

pnpm monorepo with a clean architecture: dependencies point inward, and the engine depends on nothing. ESLint blocks imports that break this rule.

| Folder              | Contents                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `packages/engine`   | Rules engine in plain TypeScript, no I/O. The game numbers live in `packages/engine/data/` |
| `packages/protocol` | Messages and actions between client and server, validated with Zod                         |
| `packages/kit`      | Rooms, seats, reconnection, pings and table mode, game-agnostic                            |
| `packages/bots`     | Bots (`botMove` and `suggest`), using public information only                              |
| `packages/sim`      | Batch simulation with bots                                                                 |
| `apps/web`          | Interface (Svelte 5 + Vite, PWA)                                                           |
| `apps/server`       | Room server (Cloudflare Worker + one Durable Object per room)                              |

## Requirements

- Node.js 22.12 or newer (CI uses the version in `.nvmrc`)
- pnpm, at the version in the `packageManager` field of `package.json`. The simplest way is Corepack:

```bash
corepack enable
```

## Commands

```bash
pnpm install        # install dependencies
pnpm test           # unit tests (Vitest)
pnpm lint           # ESLint and Prettier
pnpm typecheck      # TypeScript and svelte-check
pnpm build          # build the interface and the server
pnpm e2e            # E2E tests (Playwright + axe-core)
pnpm simulate       # bot simulation (not part of pnpm test)
pnpm format         # format the code with Prettier
```

Before the first `pnpm e2e`, install the Playwright browser:

```bash
pnpm --filter @village-flood/web exec playwright install chromium
```

## Playing at home

For development (the page reloads on every change), run the interface and, for online and table modes, the room server in a second terminal. The site forwards `/api` to the server (port 8787):

```bash
pnpm --filter @village-flood/web dev
```

```bash
pnpm --filter @village-flood/server dev
```

To test with several devices on the same Wi-Fi network, build the site and start the server open to the network. It serves the site and the rooms on the same port:

```bash
pnpm --filter @village-flood/web build
```

```bash
pnpm --filter @village-flood/server exec wrangler dev --ip 0.0.0.0 --port 8787
```

Then open `http://COMPUTER-IP:8787` on every device. Allow access only for private networks in the firewall, and stop the server when you are done. On the local network, without HTTPS, installing as an app and the "Copy link" button do not work; everything else does.

For tests, `?botDelay=0&seed=42` in the URL makes the bots play instantly and fixes the seed.

## Security and privacy

- The game only keeps nicknames: no accounts, analytics, tracking or external fonts. The QR code is generated on the device itself.
- The server is the only source of truth and validates every action. Each seat token is stored only as a hash (SHA-256); each connection is limited to 40 messages per 10 s; a room expires after 12 h without activity.
- No secrets in the repository. The `.env.example` file only has fictitious values.
- pnpm only installs versions published at least 1 day ago and only lets `esbuild` and `workerd` run install scripts. CI runs with read-only permission and uses actions pinned by commit SHA.

## Contributing

`main` is the published version. Each task is done on a `develop/task-name` branch, and CI runs lint, types, tests, build and E2E on every push. Commit messages are in Portuguese, in the imperative.

## Originality

Name, art, texts and sounds are original. The sounds are synthesized in the browser, with no audio files.
