/** Real Spotify Web API operations (used when mock mode is off). */
import {
  mapResolvedSource,
  mapSearchResults,
  mapTrack,
  playlistResponseSchema,
  spotifySearchResponseSchema,
  tracksResponseSchema,
  type RawSpotifyTrack,
} from '../schemas';
import type { ResolvedSource, SpotifySearchResults, SpotifyTrack } from '../types';
import { idsOfType } from '../uri';
import { spotifyFetch } from './client';

export async function realSearch(query: string): Promise<SpotifySearchResults> {
  const q = query.trim();
  if (!q) return { tracks: [], sources: [] };
  const params = new URLSearchParams({ q, type: 'track,playlist', limit: '8' });
  const payload = await spotifyFetch(`/search?${params.toString()}`, spotifySearchResponseSchema);
  return mapSearchResults(payload);
}

export async function realResolveSources(uris: readonly string[]): Promise<ResolvedSource[]> {
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
}

export async function realResolveTracks(uris: readonly string[]): Promise<SpotifyTrack[]> {
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
}
