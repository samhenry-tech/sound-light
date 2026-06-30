/**
 * Zod schemas for the (subset of) Spotify Web API responses we consume, plus
 * mappers to the app's normalized {@link SpotifyTrack} / {@link SpotifySource}.
 * Schemas are intentionally lenient (`.passthrough`, optional fields) because
 * Spotify payloads are large and occasionally contain null items.
 */
import { z } from 'zod';

import type { ResolvedSource, SpotifySearchResults, SpotifySource, SpotifyTrack } from './types';

const imageSchema = z.object({
  url: z.string(),
  height: z.number().nullish(),
  width: z.number().nullish(),
});
const artistSchema = z.object({ name: z.string() });

export const spotifyTrackSchema = z
  .object({
    uri: z.string(),
    id: z.string(),
    name: z.string(),
    duration_ms: z.number().default(0),
    artists: z.array(artistSchema).default([]),
    album: z.object({ images: z.array(imageSchema).default([]) }).nullish(),
  })
  .passthrough();

export type RawSpotifyTrack = z.infer<typeof spotifyTrackSchema>;

export const spotifyPlaylistSchema = z
  .object({
    uri: z.string(),
    id: z.string(),
    name: z.string(),
    owner: z.object({ display_name: z.string().nullish() }).nullish(),
    images: z.array(imageSchema).default([]),
    tracks: z.object({ total: z.number().default(0) }).nullish(),
  })
  .passthrough();

export const spotifySearchResponseSchema = z.object({
  tracks: z.object({ items: z.array(spotifyTrackSchema.nullable()).default([]) }).nullish(),
  playlists: z.object({ items: z.array(spotifyPlaylistSchema.nullable()).default([]) }).nullish(),
});

export const playlistTracksResponseSchema = z.object({
  items: z.array(z.object({ track: spotifyTrackSchema.nullable() }).passthrough()).default([]),
  next: z.string().nullish(),
});

export const tracksResponseSchema = z.object({
  tracks: z.array(spotifyTrackSchema.nullable()).default([]),
});

export const playlistResponseSchema = spotifyPlaylistSchema.extend({
  tracks: z
    .object({
      total: z.number().default(0),
      items: z.array(z.object({ track: spotifyTrackSchema.nullable() })).default([]),
    })
    .nullish(),
});

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type SpotifyTokenResponse = z.infer<typeof tokenResponseSchema>;

/* ----------------------------------- mappers ---------------------------------- */

export function mapTrack(raw: RawSpotifyTrack): SpotifyTrack {
  return {
    uri: raw.uri,
    id: raw.id,
    title: raw.name,
    artist: raw.artists.map((a) => a.name).join(', ') || 'Unknown artist',
    durationMs: raw.duration_ms,
    artworkUrl: raw.album?.images?.[0]?.url,
  };
}

export function mapPlaylistToSource(raw: z.infer<typeof spotifyPlaylistSchema>): SpotifySource {
  return {
    uri: raw.uri,
    id: raw.id,
    kind: 'playlist',
    name: raw.name,
    owner: raw.owner?.display_name ?? 'Spotify',
    trackCount: raw.tracks?.total ?? 0,
    artworkUrl: raw.images?.[0]?.url,
  };
}

export function mapSearchResults(payload: unknown): SpotifySearchResults {
  const parsed = spotifySearchResponseSchema.parse(payload);
  const tracks = (parsed.tracks?.items ?? [])
    .filter((t): t is RawSpotifyTrack => Boolean(t))
    .map(mapTrack);
  const sources = (parsed.playlists?.items ?? [])
    .filter((p): p is z.infer<typeof spotifyPlaylistSchema> => Boolean(p))
    .map(mapPlaylistToSource);
  return { tracks, sources };
}

export function mapResolvedSource(payload: unknown): ResolvedSource {
  const parsed = playlistResponseSchema.parse(payload);
  const tracks = (parsed.tracks?.items ?? [])
    .map((i) => i.track)
    .filter((t): t is RawSpotifyTrack => Boolean(t))
    .map(mapTrack);
  return {
    ...mapPlaylistToSource(parsed),
    trackCount: parsed.tracks?.total ?? tracks.length,
    tracks,
  };
}
