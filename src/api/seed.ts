/**
 * Starter library used by the local (offline) data adapter on first run — a
 * faithful port of the prototype's `buildPlaylists`, pins, and banished tracks,
 * so a fresh offline session looks exactly like the design reference.
 */
import type { Playlist } from '~shared/contract';
import { MOCK_SOURCE_URIS_BY_ATMOSPHERE, mockTrackUri } from '~spotify/mock/catalog';
import type { Atmosphere } from '~theme/atmosphere';

type Def = [id: string, location: string, atmosphere: Atmosphere];

const DEFS: Def[] = [
  ['general-ambient', 'General', 'ambient'],
  ['general-exciting', 'General', 'exciting'],
  ['general-battle', 'General', 'battle'],
  ['general-suspense', 'General', 'suspense'],
  ['general-victory', 'General', 'victory'],
  ['general-loss', 'General', 'loss'],
  ['tavern-ambient', 'Tavern', 'ambient'],
  ['tavern-exciting', 'Tavern', 'exciting'],
  ['tavern-battle', 'Tavern', 'battle'],
  ['city-ambient', 'City', 'ambient'],
  ['city-battle', 'City', 'battle'],
  ['forest-ambient', 'Forest', 'ambient'],
  ['forest-suspense', 'Forest', 'suspense'],
  ['dungeon-ambient', 'Dungeon', 'ambient'],
  ['dungeon-suspense', 'Dungeon', 'suspense'],
  ['dungeon-battle', 'Dungeon', 'battle'],
  ['castle-ambient', 'Castle', 'ambient'],
  ['castle-battle', 'Castle', 'battle'],
  ['sea-ambient', 'Sea', 'ambient'],
  ['sea-battle', 'Sea', 'battle'],
];

const PINNED = new Set(['general-ambient', 'general-battle', 'tavern-ambient']);

const BANISHED: Record<string, string[]> = {
  'tavern-ambient': ['Rain on the Tent'],
  'general-battle': ['Unrelenting'],
};

export const getSeedPlaylists = (owner: string): Playlist[] => {
  const now = new Date().toISOString();
  return DEFS.map(([id, location, atmosphere], index) => ({
    id,
    owner,
    location,
    atmosphere,
    pinned: PINNED.has(id),
    sourceUris: [...(MOCK_SOURCE_URIS_BY_ATMOSPHERE[atmosphere] ?? [])],
    trackUris: id === 'general-battle' ? [mockTrackUri('Thunder Over the Keep')] : [],
    banishedTrackUris: (BANISHED[id] ?? []).map(mockTrackUri),
    sortIndex: index,
    createdAt: now,
    updatedAt: now,
  }));
};
