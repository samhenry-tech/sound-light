/** Helpers for Spotify URIs of the form `spotify:{type}:{id}`. */

export type SpotifyUriType = 'track' | 'playlist' | 'album';

export interface ParsedUri {
  type: SpotifyUriType;
  id: string;
}

export function parseUri(uri: string): ParsedUri | null {
  const parts = uri.split(':');
  if (parts.length !== 3 || parts[0] !== 'spotify') return null;
  const [, type, id] = parts;
  if (type !== 'track' && type !== 'playlist' && type !== 'album') return null;
  return { type, id: id! };
}

export function idsOfType(uris: readonly string[], type: SpotifyUriType): string[] {
  return uris
    .map(parseUri)
    .filter((p): p is ParsedUri => p?.type === type)
    .map((p) => p.id);
}
