/**
 * A bundled mock Spotify catalog, ported verbatim from the design prototype's
 * `spotifySources` / `extraTracks`. Powers offline development and demos when
 * Spotify mock mode is on. Real URIs are synthesized deterministically so the
 * same seed data round-trips through the data layer.
 */
import type { Atmosphere } from '~theme/atmosphere';

import type { ResolvedSource, SpotifyTrack } from '../types';

interface RawTrack {
  title: string;
  artist: string;
}
interface RawSource {
  id: string;
  name: string;
  owner: string;
  tracks: RawTrack[];
}

const RAW_SOURCES: RawSource[] = [
  {
    id: 'src-amb1',
    name: 'Fireside Ambience',
    owner: 'Lo-Fi Realms',
    tracks: [
      { title: 'Where the Walls Breathe', artist: 'Hollow Choir' },
      { title: 'Lanternlight', artist: 'Mara Vael' },
      { title: 'Slow Hearth', artist: 'Ambergris' },
      { title: 'Rain on the Tent', artist: 'Hollow Choir' },
    ],
  },
  {
    id: 'src-amb2',
    name: 'Quiet Wilds',
    owner: 'Greywood',
    tracks: [
      { title: 'The Long Quiet', artist: 'Ambergris' },
      { title: 'Dust on Old Stone', artist: 'The Ninth House' },
      { title: 'Moss & Stone', artist: 'Greywood' },
      { title: 'Still Water', artist: 'Fern & Fable' },
    ],
  },
  {
    id: 'src-amb3',
    name: 'Rainy Day Tavern',
    owner: 'Lo-Fi Realms',
    tracks: [
      { title: 'Candlelit Corner', artist: 'Lo-Fi Realms' },
      { title: 'Worn Floorboards', artist: 'Ambergris' },
      { title: 'Mugs & Murmurs', artist: 'The Merry Lute' },
    ],
  },
  {
    id: 'src-exc1',
    name: 'Bardic Revelry',
    owner: 'The Merry Lute',
    tracks: [
      { title: 'Tankards High', artist: 'Brasswork' },
      { title: 'Quick Feet', artist: 'Greymark' },
      { title: 'Market Day', artist: 'The Ninth House' },
      { title: 'The Road Goes On', artist: 'Brasswork' },
    ],
  },
  {
    id: 'src-exc2',
    name: 'Festival!',
    owner: 'The Merry Lute',
    tracks: [
      { title: 'Ribbons & Bells', artist: 'The Merry Lute' },
      { title: 'Dance of Coins', artist: 'Brasswork' },
      { title: 'Fireworks', artist: 'Greymark' },
    ],
  },
  {
    id: 'src-bat1',
    name: 'Epic Battle II',
    owner: 'Doomforge',
    tracks: [
      { title: 'Teeth in the Dark', artist: 'Vael Kaur' },
      { title: 'Countdown to the Blade', artist: 'Iron Vigil' },
      { title: 'Steel & Sparks', artist: 'Greymark' },
      { title: 'The Charge', artist: 'Brasswork' },
    ],
  },
  {
    id: 'src-bat2',
    name: 'Boss Fight',
    owner: 'Iron Vigil',
    tracks: [
      { title: 'No Way Back', artist: 'Iron Vigil' },
      { title: 'The Final Stand', artist: 'Doomforge' },
      { title: 'Unrelenting', artist: 'Vael Kaur' },
    ],
  },
  {
    id: 'src-bat3',
    name: 'War Drums',
    owner: 'Doomforge',
    tracks: [
      { title: 'Drums of the Deep', artist: 'Doomforge' },
      { title: 'Hold the Line', artist: 'Iron Vigil' },
      { title: 'Onslaught', artist: 'Vael Kaur' },
    ],
  },
  {
    id: 'src-sus1',
    name: 'Creeping Dread',
    owner: 'Nocturne Lab',
    tracks: [
      { title: 'Held Breath', artist: 'Nocturne Lab' },
      { title: 'The Walls Close In', artist: 'Greymark' },
      { title: 'Something Moves', artist: 'Vael Kaur' },
      { title: "Don't Look Back", artist: 'Nocturne Lab' },
    ],
  },
  {
    id: 'src-vic1',
    name: 'Triumphant',
    owner: 'Brasswork',
    tracks: [
      { title: 'The Day Is Won', artist: 'Iron Vigil' },
      { title: 'Banners High', artist: 'The Ninth House' },
      { title: 'Homeward, Heroes', artist: 'Brasswork' },
    ],
  },
  {
    id: 'src-loss1',
    name: 'Elegies',
    owner: 'Mara Vael',
    tracks: [
      { title: 'What the River Took', artist: 'Mara Vael' },
      { title: 'Ashes & Elegy', artist: 'Hollow Choir' },
      { title: 'Empty Chair', artist: 'Fern & Fable' },
    ],
  },
  {
    id: 'src-sea1',
    name: 'Salt & Sail',
    owner: 'Greywood',
    tracks: [
      { title: 'Sails at Dawn', artist: 'Greywood' },
      { title: 'Below the Waterline', artist: 'Nocturne Lab' },
      { title: 'Gulls & Rigging', artist: 'Fern & Fable' },
    ],
  },
];

const RAW_EXTRA_TRACKS: RawTrack[] = [
  { title: 'Candleflame Waltz', artist: 'The Merry Lute' },
  { title: 'Thunder Over the Keep', artist: 'Doomforge' },
  { title: 'A Quiet Grief', artist: 'Mara Vael' },
  { title: 'Coins on the Counter', artist: 'Brasswork' },
  { title: 'The Crypt Door', artist: 'Nocturne Lab' },
  { title: 'Embers at Midnight', artist: 'Ambergris' },
];

export const MOCK_SOURCE_IDS_BY_ATMOSPHERE: Record<Atmosphere, string[]> = {
  ambient: ['src-amb1', 'src-amb2'],
  exciting: ['src-exc1'],
  battle: ['src-bat1', 'src-bat2'],
  suspense: ['src-sus1'],
  victory: ['src-vic1'],
  loss: ['src-loss1'],
};

/* --------------------------------- builders -------------------------------- */

const slug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/** Deterministic pseudo-duration (2:30–5:30) so mock tracks feel real. */
const durationFor = (title: string): number => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) % 100000;
  return (150 + (hash % 181)) * 1000;
};

export const mockTrackUri = (title: string): string => {
  return `spotify:track:${slug(title)}`;
};

export const mockSourceUri = (sourceId: string): string => {
  return `spotify:playlist:${sourceId}`;
};

const toTrack = (raw: RawTrack): SpotifyTrack => {
  return {
    uri: mockTrackUri(raw.title),
    id: slug(raw.title),
    title: raw.title,
    artist: raw.artist,
    durationMs: durationFor(raw.title),
  };
};

export const MOCK_SOURCES: ResolvedSource[] = RAW_SOURCES.map((s) => ({
  uri: mockSourceUri(s.id),
  id: s.id,
  kind: 'playlist',
  name: s.name,
  owner: s.owner,
  trackCount: s.tracks.length,
  tracks: s.tracks.map(toTrack),
}));

/** Deduped catalog of every distinct track (by title), for track search. */
export const MOCK_TRACKS: SpotifyTrack[] = (() => {
  const seen = new Set<string>();
  const out: SpotifyTrack[] = [];
  for (const source of RAW_SOURCES) {
    for (const t of source.tracks) {
      if (seen.has(t.title)) continue;
      seen.add(t.title);
      out.push(toTrack(t));
    }
  }
  for (const t of RAW_EXTRA_TRACKS) {
    if (seen.has(t.title)) continue;
    seen.add(t.title);
    out.push(toTrack(t));
  }
  return out;
})();

export const MOCK_SOURCE_BY_URI = new Map(MOCK_SOURCES.map((s) => [s.uri, s]));
export const MOCK_TRACK_BY_URI = new Map<string, SpotifyTrack>([
  ...MOCK_TRACKS.map((t) => [t.uri, t] as const),
  ...MOCK_SOURCES.flatMap((s) => s.tracks.map((t) => [t.uri, t] as const)),
]);

export const MOCK_SOURCE_URIS_BY_ATMOSPHERE: Record<Atmosphere, string[]> = Object.fromEntries(
  Object.entries(MOCK_SOURCE_IDS_BY_ATMOSPHERE).map(([atm, ids]) => [atm, ids.map(mockSourceUri)]),
) as Record<Atmosphere, string[]>;
