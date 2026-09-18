/** Spotify Web API operations mapped onto the MusicProvider data surface. */
import type { MusicSearchResults } from '~/music-providers/models/MusicSearchResults';
import type { ResolvedSource } from '~/music-providers/models/MusicSource';
import type { MusicTrack } from '~/music-providers/models/MusicTrack';

import {
  mapResolvedSource,
  mapSearchResults,
  mapTrack,
  playlistResponseSchema,
  type RawSpotifyTrack,
  spotifySearchResponseSchema,
  tracksResponseSchema,
} from '../schemas';
import { idsOfType } from '../uri';
import { spotifyFetch } from './client';

export { SpotifyNotLinkedError } from './client';

export const search = async (query: string): Promise<MusicSearchResults> => {
  const q = query.trim();
  if (!q) return { tracks: [], sources: [] };
  const params = new URLSearchParams({ q, type: 'track,playlist', limit: '8' });
  const payload = await spotifyFetch(`/search?${params.toString()}`, spotifySearchResponseSchema);
  return mapSearchResults(payload);
};

export const resolveSources = async (uris: readonly string[]): Promise<ResolvedSource[]> => {
  const ids = idsOfType(uris, 'playlist');
  const resolved = await Promise.all(
    ids.map(async (id): Promise<ResolvedSource | null> => {
      try {
        const payload = await spotifyFetch(`/playlists/${id}`, playlistResponseSchema);
        return mapResolvedSource(payload);
      } catch {
        return null;
      }
    }),
  );
  return resolved.filter((s): s is ResolvedSource => Boolean(s));
};

export const resolveTracks = async (uris: readonly string[]): Promise<MusicTrack[]> => {
  const ids = idsOfType(uris, 'track');
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50));

  const results = await Promise.all(
    batches.map(async (batch) => {
      const payload = await spotifyFetch(`/tracks?ids=${batch.join(',')}`, tracksResponseSchema);
      return (payload.tracks ?? []).filter((t): t is RawSpotifyTrack => Boolean(t)).map(mapTrack);
    }),
  );
  return results.flat();
};
