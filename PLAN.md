# atmos — build plan

> Living plan for turning the **Soundlight** design prototype into a production
> React + Vite app. Each phase ends with a commit on
> `claude/react-vite-refactor-4h1wbd` (the designated integration branch) so the
> history reads phase-by-phase. Refer back here between phases.

## Product

**atmos** — an iPad-first music companion for tabletop RPG game masters. The GM
keeps a library of vibe-named mixes (`Location – Atmosphere`, e.g. _Tavern –
Battle_) and during play taps a card to crossfade into that vibe. Music plays
shuffled; the GM gives per-track feedback (👍 keep / 👎 fade & skip, hold to
banish) and the app remembers banished tracks per mix.

## Architecture principles

- **Vite + React 19 + TypeScript**, strict everywhere.
- **Atomic design** for components: `atoms → molecules → organisms → templates → pages`.
- **Music provider is an interface** (`src/music`). Spotify is one implementation
  (`src/spotify`). Swapping providers (Apple Music, YouTube, local files) means
  writing a new `MusicProvider` — nothing else changes.
- **AWS, not Amplify.** Cognito (Google sign-in) for auth, API Gateway + Lambda +
  DynamoDB for data, all via **Terraform**, all **free tier**. S3 + CloudFront hosting.
- **Zod** validates every network boundary. **React Query** owns server state.
  **Zustand** owns ephemeral playback/UI state.
- **Prettier + ESLint (flat) + Vitest** for quality.
- **Runs offline**: localStorage data adapter + bundled mock catalog + mock player
  when AWS/Spotify env is absent, so `npm run dev` works with zero setup.

## Phases

- [x] **P0 — Foundation.** Scaffold, tooling, design tokens, shared Zod contract.
- [x] **P1 — Music provider + Spotify.** Provider-agnostic interface; Spotify impl
      with PKCE login, token storage + refresh, Web API search/resolve, Web Playback
      SDK wrapper, and a mock provider for offline use.
- [x] **P2 — AWS auth + data.** Cognito OIDC (Google), HTTP API client, React Query
      hooks for mixes/prefs with optimistic updates, localStorage fallback + seed.
- [x] **P3 — Player engine + stores.** Faithful port of prototype logic (effective
      tracks, shuffle, banish, hold-to-banish) plus the music-player feature set.
- [x] **P4 — Component library.** Pixel-accurate atoms→templates.
- [x] **P5 — Pages & shell.** Live + Library routes, persistent now-playing bar,
      settings, login gate, Spotify/Cognito callbacks, command palette.
- [x] **P6 — Extended TTRPG features** (see below).
- [x] **P7 — Infra & CI/CD.** Terraform + Lambda + GitHub Actions (org AWS creds).
- [x] **P8 — Tests, docs, verification.**

## Music-player feature set (P3/P6)

Faithful to prototype:

- Tap card → crossfade into mix; active card ring + equalizer; toast.
- Shuffled queue from `sources ∪ tracks − banished`; avoid immediate repeats.
- 👍 keep · 👎 tap = fade & skip · 👎 hold 700ms = banish (red charging ring).
- Play/pause, live progress, pin, per-mix banished panel + restore.

Best-in-class additions (informed by Syrinscape / Tabletop Audio / Bardify gaps —
too many clicks, not glanceable, no instant combat switch, distracting UI, no
curation, ad-driven):

- **Volume + mute + one-tap "duck"** (lower under narration, restore on release).
- **Scrub/seek**, **skip next/previous**, manual queue with "up next".
- **Crossfade** with configurable duration (real fade in mock; volume-duck for SDK).
- **Panic button** → instantly crossfade to the campaign's designated combat mix.
- **Procedural ambient bed** — asset-free rain/wind/fire/ocean noise synthesized
  with the Web Audio API, layered _under_ the music with its own volume.
- **Sleep timer** with fade-out.
- **Keyboard shortcuts** (space, →/skip, B/banish, P/panic, ↑↓ volume, / search, ⌘K).
- **Command palette (⌘K)** — jump to any mix or run any action.
- **Table / focus mode** — minimal, dim, glanceable now-playing for the actual table.
- **Now-playing history.**
- **Theming** (accent), grid density, split/combined labels — persisted to prefs.

## Swap-a-provider contract

`MusicProvider { id, name, capabilities, auth, search, resolveSources,
resolveTracks, createPlayer }`. `MusicPlayer { playTrack, pause, resume,
setVolume, seek, subscribe, onEnded, destroy }`. The app consumes these via
`useMusicProvider()` — never Spotify directly.
