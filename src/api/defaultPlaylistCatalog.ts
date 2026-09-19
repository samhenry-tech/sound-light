/**
 * Bundled default genre catalog (Spotify track URIs, ~4h per playlist).
 * Used when the DynamoDB `defaults` partition is empty or unreadable so new
 * accounts can still pick a genre pack before an admin publishes to Dynamo.
 */
import seed from '~/api/defaultPlaylistSeed.json' with { type: 'json' };
import { type Playlist, playlistListSchema } from '~/models/playlist';

let cached: Playlist[] | null = null;

export const getBundledDefaultPlaylists = (): Playlist[] => {
  if (!cached) cached = playlistListSchema.parse(seed);
  return cached;
};
