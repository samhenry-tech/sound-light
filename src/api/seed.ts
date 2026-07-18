/**
 * Starter library used by the local data adapter (test double) on first run.
 * Ports the prototype's location/atmosphere cards and pins; tracks start empty
 * and are populated by the GM from real Spotify.
 */
import type { Playlist } from '~shared/contract';
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

export const getSeedPlaylists = (owner: string): Playlist[] => {
  const now = new Date().toISOString();
  return DEFS.map(([id, location, atmosphere], index) => ({
    id,
    owner,
    location,
    atmosphere,
    pinned: PINNED.has(id),
    sourceUris: [],
    trackUris: [],
    banishedTrackUris: [],
    sortIndex: index,
    createdAt: now,
    updatedAt: now,
  }));
};
