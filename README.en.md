# Village Flood

[Versão em português](README.md)

A **cooperative** board game for the browser, for 2 to 4 seats (people or bots). Heavy rain makes the river rise: the team brings the residents to the church and, at the end, all volunteers board the boat at the dock. The team wins or loses together.

Planned modes: single device, multiple devices (private room with a code) and table mode (board on a TV or laptop, phones as controllers). It runs as a PWA on phones, tablets, desktops and Smart TVs.

> **Status:** in development. Stages 0 to 4 are ready: you can already play **on one device** or **online, each person on their own device** (private room with a 6-symbol code), 2 to 4 volunteers, with bots filling the team. Next is Stage 5 (table mode and PWA). Each game draws which houses get the extra residents and whether the map is mirrored. The game numbers were calibrated with simulation (see [docs/simulation](docs/simulation/), in Portuguese). See the [roadmap](docs/ROADMAP.md) (in Portuguese).

## Documentation

The project documents are written in Portuguese (Brazil).

- [Rules](docs/village-flood-rules.md), with the decision log at the end
- [Technical specification](docs/village-flood-tech-spec.md)
- [Roadmap](docs/ROADMAP.md)
- [Mockups](docs/mockups/)

## Structure

A pnpm monorepo with clean architecture: dependencies point inwards, and the engine depends on nothing. ESLint blocks imports that break this rule.

| Folder              | Contents                                                                               |
| ------------------- | -------------------------------------------------------------------------------------- |
| `packages/engine`   | Pure TypeScript rules engine, no I/O. The game numbers live in `packages/engine/data/` |
| `packages/protocol` | Client/server message types                                                            |
| `packages/kit`      | Rooms, seats, reconnection and table mode, game-agnostic                               |
| `packages/bots`     | Bots (`botMove` and `suggest`)                                                         |
| `packages/sim`      | Batch simulation with bots                                                             |
| `apps/web`          | User interface (Svelte 5 + Vite, PWA)                                                  |
| `apps/server`       | Room server (Cloudflare Worker + Durable Object)                                       |

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

To play in the browser (development mode), run the command below and open the address it prints:

```bash
pnpm --filter @village-flood/web dev
```

To play online at home (development mode), also run the room server in a second terminal. The site forwards `/api` to it (port 8787):

```bash
pnpm --filter @village-flood/server dev
```

On the start screen, "Create an online room" gives the code and the link (`?sala=CODE`); the others use "Join with a code" or open the link. If the connection drops, the device rejoins the same seat on its own.

In the lobby, pick the difficulty, the roles and which seats are bots. In the game, tap a tile to see the actions; on Calm, "Hint" shows the move the bot would make. For tests, `?botDelay=0&seed=42` in the URL makes bots play instantly and fixes the seed.

## Security and privacy

- No secrets in the repository. The `.env.example` file holds only fictitious values.
- The game stores nicknames only: no accounts, analytics or tracking.
- pnpm only installs versions published at least 1 day ago and only lets `esbuild` and `workerd` run install scripts. CI runs with read-only permissions and uses actions pinned to a commit SHA.

## Contributing

`main` is the published version. Each task is done on a `develop/task-name` branch, and CI runs lint, types, tests, build and E2E on every push. Commit messages are in Portuguese, in the imperative mood.

## Originality

The name, art, texts and sounds are original.
