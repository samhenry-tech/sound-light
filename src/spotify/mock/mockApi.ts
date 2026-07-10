/** Mock implementations of the Spotify data operations (offline / demo mode). */
import type { ResolvedSource, SpotifySearchResults, SpotifyTrack } from '../types';
import { MOCK_SOURCE_BY_URI, MOCK_SOURCES, MOCK_TRACK_BY_URI, MOCK_TRACKS } from './catalog';

const matches = (haystack: string, needle: string): boolean => {
  return haystack.toLowerCase().includes(needle);
};

export const mockSearch = (query: string): Promise<SpotifySearchResults> => {
  const q = query.trim().toLowerCase();
  if (!q) return Promise.resolve({ tracks: [], sources: [] });

  const sources = MOCK_SOURCES.filter((s) => matches(`${s.name} ${s.owner}`, q)).slice(0, 6);
  const tracks = MOCK_TRACKS.filter((t) => matches(`${t.title} ${t.artist}`, q)).slice(0, 8);
  return Promise.resolve({ tracks, sources });
};

export const mockResolveSources = (uris: readonly string[]): Promise<ResolvedSource[]> => {
  const resolved = uris
    .map((uri) => MOCK_SOURCE_BY_URI.get(uri))
    .filter((s): s is ResolvedSource => Boolean(s));
  return Promise.resolve(resolved);
};

export const mockResolveTracks = (uris: readonly string[]): Promise<SpotifyTrack[]> => {
  const resolved = uris
    .map((uri) => MOCK_TRACK_BY_URI.get(uri))
    .filter((t): t is SpotifyTrack => Boolean(t));
  return Promise.resolve(resolved);
};
