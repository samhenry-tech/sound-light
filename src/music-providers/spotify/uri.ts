/** Helpers for Spotify URIs of the form `spotify:{type}:{id}`. */
import type { SpotifyUri, SpotifyUriType } from './models/SpotifyUri';

export type { SpotifyUri, SpotifyUriType };

export const parseUri = (uri: string): SpotifyUri | null => {
  const parts = uri.split(':');
  if (parts.length !== 3 || parts[0] !== 'spotify') return null;
  const [, type, id] = parts;
  if (type !== 'track' && type !== 'playlist' && type !== 'album') return null;
  return { type, id: id! };
};

export const idsOfType = (uris: readonly string[], type: SpotifyUriType): string[] => {
  return uris
    .map(parseUri)
    .filter((p): p is SpotifyUri => p?.type === type)
    .map((p) => p.id);
};
