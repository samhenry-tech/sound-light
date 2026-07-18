# sound-light

An iPad-first **music companion for tabletop RPG game masters**. Keep a library
of vibe-named playlists (`Location – Atmosphere`, e.g. _Tavern – Battle_), and during
play tap a card to crossfade the room into that vibe. Music plays shuffled; give
each track a thumbs up/down (hold 👎 to **banish** it from that playlist forever).

Built as a production React + Vite rebuild of the **Soundlight** design
prototype, with real Spotify playback and AWS-synced storage behind Google
sign-in.

> Built with the latest stack and industry practices: **React 19 · Vite 6 ·
> TypeScript (strict) · TanStack Query · Zustand · Zod · React Router 7 · ESLint
> 9 · Prettier · Vitest**, atomic-design components, a swappable music-provider
> interface, and **AWS via Terraform** (Cognito + API Gateway + Lambda +
> DynamoDB + CloudFront — no Amplify, free tier only).

## Highlights

- **Tap-to-crossfade** vibe cards, animated equalizer on the active playlist, glanceable now-playing bar.
- **Smart shuffle** queue: `sources ∪ tracks − banished`, no immediate repeats.
- **Hold-to-banish** (👎 700ms with a charging ring) — persisted per playlist.
- **Procedural ambient bed** — rain / wind / fire / ocean synthesized with the Web Audio API (no assets), layered under the music.
- **Sleep timer**, **volume / mute**, **scrub-to-seek**, **crossfade** control.
- **Command palette (⌘K)** and **keyboard shortcuts** for hands-free play.
- **Table mode** — immersive, edge-to-edge, minimal.
- **Themeable accent**, grid density, split/combined labels (synced to your account).

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Playback uses the real Spotify Web API + Web Playback SDK, so you link a
Spotify **Premium** account to search and play. The dev server is pinned to
**port 3000** because that's what the Spotify app's redirect URIs are
registered against.

### Scripts

| Script                  | What it does                         |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Vite dev server on :3000             |
| `npm run build`         | Type-check + production build        |
| `npm run preview`       | Preview the production build         |
| `npm run lint`          | ESLint (flat config, type-aware)     |
| `npm run format`        | Prettier write                       |
| `npm run typecheck`     | `tsc -b --noEmit`                    |
| `npm run test`          | Vitest run (jsdom + Testing Library) |
| `npm run test:coverage` | Coverage report                      |

## Configuration

Public config is split across two JSON files (nothing secret — these ship in
the SPA bundle):

| File                                                     | Owner           | Contents                                                                            |
| -------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| [`config/shared.json`](config/shared.json)               | Hand-edited     | Inputs both Terraform and Vite read (project, region, Google/Spotify client ids, …) |
| [`src/config.generated.json`](src/config.generated.json) | Terraform apply | Outputs the SPA needs (Cognito pool id, table names, region)                        |

[`src/config.ts`](src/config.ts) assembles those files and adds SPA-only flags
(Spotify mock follows Vite `PROD`). OAuth redirect URIs are derived from the
browser origin at runtime. After `terraform apply`, `src/config.generated.json`
is refreshed automatically (CI commits it on `main`).

## Architecture

```
config/
  shared.json     Public inputs shared by Terraform + the Vite SPA
src/
  config.ts       Assembles shared + generated JSON (+ SPA-only flags)
  config.generated.json  Terraform outputs for the SPA (do not hand-edit)
  app/            Composition root, router, providers (Query, Theme, Auth, Player)
  music/          ⟵ Provider-agnostic interface (MusicProvider/MusicPlayer) + hooks
  spotify/        ⟵ The Spotify implementation of MusicProvider (its own folder)
  api/            AWS data layer: direct-DynamoDB adapter + React Query hooks
  auth/           Google Sign-In → Cognito Identity Pool + normalized AuthSession
  features/
    player/       PlayerProvider — owns the imperative player, queue, actions
    library/      effectiveTracks/queue logic + the editor view-model
    live/         Live grid view-model
    ambient/      Web Audio procedural ambient engine
  components/     Atomic design: atoms · molecules · organisms · templates
  stores/         Zustand: player, ui, settings (persisted)
  shared/         Zod data contract (the network boundary's source of truth)
  theme/          Design tokens (CSS variables) + atmosphere data
infra/            Terraform (Cognito Identity Pool, DynamoDB, S3+CloudFront)
.github/workflows CI, frontend deploy, terraform
```

State split, by design:

- **Server data** (playlists, user settings) → **TanStack Query** with optimistic updates.
- **Ephemeral playback/UI** (now-playing, queue, filters, toast) → **Zustand**.
- **Network boundaries** → validated with **Zod** (`src/shared/contract.ts`).

### Swappable music provider

The app never imports Spotify directly. It talks to a `MusicProvider` interface
(`src/music`) — `search`, `resolveSources`, `resolveTracks`, `createPlayer`, and
an `auth` lifecycle. Spotify is one implementation (`src/spotify`,
`createSpotifyMusicProvider`). Supporting Apple Music / YouTube / local files is
a matter of writing a new provider and registering it in `src/music/registry.ts`
— nothing in the UI, stores, or data layer changes.

### Spotify integration

Lives entirely under `src/spotify/`:

- **Auth** — Authorization Code + **PKCE** (no client secret in the browser),
  with token storage and refresh.
- **Web API** — `search` and playlist/track resolution, Zod-validated.
- **Web Playback SDK** — registers the browser as a Connect device (requires
  Premium).
- **Crossfade** — the SDK can't overlap two tracks (single stream / one active
  device) and `play({uris})` hard-cuts, so we roll our own single-stream
  crossfade: fade the outgoing track out → swap → fade the incoming in, on every
  skip / banish / playlist switch (configurable duration; 0 = hard cut).

App: **sound-light** · client id `a35ad70cf30442f0a53ba22a95e85c8e` · redirect
`http://localhost:3000/auth/spotify/`.

### AWS backend (no Amplify, free tier)

Provisioned with **Terraform** in `infra/`:

- **Cognito** user pool with **Google** federation (Hosted UI) + a public PKCE SPA client.
- **DynamoDB** provisioned tables (playlists, user-settings), owner-scoped.
- **Lambda** (Node 20, single router) behind an **API Gateway HTTP API** with a
  Cognito **JWT authorizer** — the owner is always the verified `sub` claim.
- **S3 + CloudFront** (private bucket, OAC, SPA error routing) for hosting.

Deploy and operate per **[`infra/IMPLEMENTATION_NOTES.md`](infra/IMPLEMENTATION_NOTES.md)**
(Google OAuth setup, Cognito domain, and every CI `vars`/`secrets` name).

## CI/CD

`.github/workflows/`:

- **ci** — format, lint, typecheck, test, build + `terraform fmt`/`validate`.
- **deploy-frontend** — build the SPA, sync to S3, invalidate CloudFront.
- **terraform** — plan on PRs (posted as a comment), apply on `main`.

The deploy/terraform workflows authenticate to AWS with the **org-provided
OIDC deploy role**. Public SPA config comes from `config/shared.json` +
`src/config.generated.json` — no GitHub Variables are required for the
frontend deploy.

## Keyboard shortcuts

`Space` play/pause · `→`/`N` next · `B` banish · `L` good fit ·
`M` mute · `↑`/`↓` volume · `T` table mode · `⌘K` command palette.

## Design fidelity

Pixel-accurate to the Soundlight handoff: the 1194×834 iPad canvas scaled to
fit, the exact color/typography/spacing tokens (`src/theme/tokens.css`),
Onest + Material Symbols Rounded, and the `--accent` theming via `color-mix`.

See **[`PLAN.md`](PLAN.md)** for the phased build log.
