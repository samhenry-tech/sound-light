/**
 * One-shot Node script: populate default genre catalogs from Spotify and write
 * `src/api/defaultPlaylistSeed.json`. Reads tokens from ./spotify_tokens_full.json
 * (gitignored). Not part of the SPA bundle build beyond the emitted seed file.
 *
 * Usage: node --experimental-strip-types scripts/seed-default-playlists.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const TARGET_MS = 4 * 60 * 60 * 1000;
const API = 'https://api.spotify.com/v1';

const tokens = JSON.parse(readFileSync(join(root, 'spotify_tokens_full.json'), 'utf8'));
let accessToken = tokens.accessToken;

const defs = [
  // Fantasy
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'ambient',
    pinned: true,
    queries: [
      'fantasy adventure soundtrack ambient',
      'lord of the rings soundtrack howard shore',
      'celtic fantasy instrumental',
      'epic fantasy atmosphere playlist',
      'medieval fantasy ambience',
      'rpg exploration music fantasy',
    ],
  },
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'battle',
    pinned: true,
    queries: [
      'epic fantasy battle music',
      'orchestral combat soundtrack fantasy',
      'two steps from hell battle',
      'rpg boss fight music fantasy',
      'epic war drums orchestra',
      'skyrim combat music',
    ],
  },
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'victory',
    queries: [
      'fantasy victory theme orchestra',
      'heroic triumph soundtrack',
      'epic fantasy celebration music',
      'rpg victory fanfare orchestral',
      'lord of the rings victory',
    ],
  },
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'loss',
    queries: [
      'fantasy sad soundtrack',
      'mourning orchestra fantasy',
      'tragic fantasy theme',
      'howard shore lament',
      'rpg defeat ambient sad',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Tavern',
    atmosphere: 'ambient',
    queries: [
      'fantasy tavern music',
      'medieval tavern lute',
      'bard tavern songs instrumental',
      'inn music fantasy rpg',
      'celtic tavern folk instrumental',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Forest',
    atmosphere: 'ambient',
    queries: [
      'enchanted forest soundtrack',
      'fantasy woodland ambient',
      'elf forest music instrumental',
      'nature fantasy atmosphere orchestra',
      'zelda forest theme orchestral',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Forest',
    atmosphere: 'suspense',
    queries: [
      'dark forest suspense soundtrack',
      'fantasy woods tension music',
      'creeping forest ambient orchestra',
      'rpg forest danger theme',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Dungeon',
    atmosphere: 'battle',
    queries: [
      'dungeon battle music fantasy',
      'dark dungeon combat orchestra',
      'rpg crypt fight soundtrack',
      'undead battle fantasy music',
    ],
  },
  // Dark fantasy
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'ambient',
    pinned: true,
    queries: [
      'dark fantasy ambient soundtrack',
      'gothic fantasy atmosphere',
      'witcher soundtrack ambient',
      'grimdark fantasy music',
      'dark souls ambience',
      'shadow fantasy orchestra',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'battle',
    pinned: true,
    queries: [
      'dark fantasy battle music',
      'gothic combat orchestra',
      'witcher battle soundtrack',
      'dark souls boss music',
      'grim battle drums orchestra',
      'bloodborne combat theme',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'victory',
    queries: [
      'dark fantasy victory theme',
      'bitter triumph orchestra',
      'gothic heroic ending',
      'witcher victory music',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'loss',
    queries: [
      'dark fantasy tragedy soundtrack',
      'grim lament orchestra',
      'sorrow gothic fantasy',
      'dark souls death theme sad',
      'mourning dark fantasy music',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Castle',
    atmosphere: 'suspense',
    queries: [
      'haunted castle soundtrack',
      'gothic castle suspense',
      'dark fortress ambient tension',
      'vampire castle atmosphere music',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Wilderness',
    atmosphere: 'battle',
    queries: [
      'dark wilderness battle music',
      'wasteland combat orchestra fantasy',
      'grim frontier fight soundtrack',
      'witcher wild hunt battle',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Temple',
    atmosphere: 'loss',
    queries: [
      'ruined temple sad soundtrack',
      'fallen cathedral ambient',
      'dark ritual mourning music',
      'gothic temple lament orchestra',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Dungeon',
    atmosphere: 'suspense',
    queries: [
      'dark dungeon suspense ambient',
      'catacomb tension soundtrack',
      'horror fantasy dungeon music',
      'crypt atmosphere dark fantasy',
    ],
  },
  // Cyberpunk
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'ambient',
    pinned: true,
    queries: [
      'cyberpunk ambient soundtrack',
      'synthwave night city atmosphere',
      'cyberpunk 2077 ambient',
      'neon noir electronic ambient',
      'blade runner atmosphere music',
      'darksynth city night',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'exciting',
    queries: [
      'cyberpunk driving synthwave',
      'neon pulse electronic',
      'cyberpunk 2077 action music',
      'outrun synthwave upbeat',
      'night city cruise soundtrack',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'battle',
    pinned: true,
    queries: [
      'cyberpunk battle music',
      'cyberpunk 2077 combat soundtrack',
      'industrial electronic fight music',
      'darksynth combat',
      'neon action electronic intense',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'victory',
    queries: [
      'cyberpunk victory theme',
      'synthwave triumph',
      'neon success electronic',
      'cyberpunk heist win music',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'loss',
    queries: [
      'cyberpunk sad soundtrack',
      'melancholy synthwave',
      'blade runner blues',
      'neon noir melancholy electronic',
      'cyberpunk 2077 emotional',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'City',
    atmosphere: 'suspense',
    queries: [
      'cyberpunk suspense soundtrack',
      'neon alley tension electronic',
      'corporate intrigue cyberpunk music',
      'dark city stealth synth',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'City',
    atmosphere: 'battle',
    queries: [
      'cyberpunk street fight music',
      'night city combat soundtrack',
      'urban cyber battle electronic',
      'cyberpunk gang war music',
    ],
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const refreshAccessToken = async () => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: 'a35ad70cf30442f0a53ba22a95e85c8e',
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Refresh failed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  accessToken = json.access_token;
  console.log('Refreshed Spotify access token');
};

const spotifyFetch = async (path) => {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 401) {
    await refreshAccessToken();
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  }
  if (res.status === 429) {
    const wait = Number(res.headers.get('Retry-After') || '2') * 1000;
    console.log(`Rate limited, waiting ${wait}ms`);
    await sleep(wait);
    return spotifyFetch(path);
  }
  if (!res.ok) throw new Error(`Spotify ${res.status} ${path}: ${await res.text()}`);
  return res.json();
};

const fetchPlaylistTracks = async (playlistId) => {
  const tracks = [];
  let path = `/playlists/${playlistId}/tracks?limit=100`;
  while (path) {
    const page = await spotifyFetch(path);
    for (const item of page.items ?? []) {
      const t = item.track;
      if (t?.uri && t.type === 'track' && t.duration_ms > 0) {
        tracks.push({ uri: t.uri, durationMs: t.duration_ms, name: t.name });
      }
    }
    path = page.next
      ? page.next.startsWith('https://api.spotify.com/v1')
        ? page.next.slice('https://api.spotify.com/v1'.length)
        : page.next
      : null;
    await sleep(50);
  }
  return tracks;
};

const collectForQueries = async (queries) => {
  const byUri = new Map();
  let durationMs = 0;

  const add = (uri, ms) => {
    if (!uri || byUri.has(uri) || ms <= 0) return durationMs >= TARGET_MS;
    byUri.set(uri, ms);
    durationMs += ms;
    return durationMs >= TARGET_MS;
  };

  for (const q of queries) {
    if (durationMs >= TARGET_MS) break;
    const data = await spotifyFetch(
      `/search?${new URLSearchParams({ q, type: 'track,playlist', limit: '20' })}`,
    );
    for (const pl of data.playlists?.items ?? []) {
      if (!pl?.id || durationMs >= TARGET_MS) continue;
      try {
        const tracks = await fetchPlaylistTracks(pl.id);
        for (const t of tracks) {
          if (add(t.uri, t.durationMs)) break;
        }
      } catch (err) {
        console.warn(`  skip playlist ${pl.id}: ${err.message}`);
      }
      if (durationMs >= TARGET_MS) break;
    }
    for (const t of data.tracks?.items ?? []) {
      if (t?.uri && add(t.uri, t.duration_ms ?? 0)) break;
    }
    await sleep(80);
  }

  return { uris: [...byUri.keys()], durationMs };
};

const idFor = (genre, location, atmosphere) => `${genre}:${location.toLowerCase()}:${atmosphere}`;

const main = async () => {
  // Warm token
  await spotifyFetch('/me');

  const now = new Date().toISOString();
  const playlists = [];
  const shortfall = [];

  for (const [index, def] of defs.entries()) {
    const label = `${def.genre} · ${def.location} – ${def.atmosphere}`;
    console.log(`[${index + 1}/${defs.length}] ${label}`);
    const { uris, durationMs } = await collectForQueries(def.queries);
    const hours = (durationMs / 3_600_000).toFixed(2);
    console.log(`  → ${uris.length} tracks · ${hours}h`);
    if (durationMs < TARGET_MS * 0.85) shortfall.push(`${label} (${hours}h)`);

    playlists.push({
      id: idFor(def.genre, def.location, def.atmosphere),
      owner: 'defaults',
      genre: def.genre,
      location: def.location,
      atmosphere: def.atmosphere,
      pinned: Boolean(def.pinned),
      sourceUris: [],
      trackUris: uris,
      banishedTrackUris: [],
      sortIndex: index,
      createdAt: now,
      updatedAt: now,
    });
  }

  const outPath = join(root, 'src/api/defaultPlaylistSeed.json');
  writeFileSync(outPath, `${JSON.stringify(playlists, null, 2)}\n`);
  console.log(`\nWrote ${playlists.length} playlists → ${outPath}`);
  if (shortfall.length) {
    console.log(`Shortfall (<~3.4h):\n  - ${shortfall.join('\n  - ')}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
