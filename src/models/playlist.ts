/**
 * Playlist data contract — Zod schemas for the shapes stored in DynamoDB
 * (see `src/api/adapters/dynamoAdapter.ts`).
 */
import { z } from 'zod';

import { type Atmosphere, ATMOSPHERES } from '~/theme/atmosphere';

export const atmosphereSchema = z.enum(ATMOSPHERES as unknown as [Atmosphere, ...Atmosphere[]]);

export const playlistSchema = z.object({
  id: z.string().min(1),
  owner: z.string().min(1),
  location: z.string().min(1),
  atmosphere: atmosphereSchema,
  pinned: z.boolean(),
  /**
   * Present on shared default-catalog rows (`owner === "defaults"`). Omitted
   * from personal playlists.
   */
  genre: z.string().min(1).optional(),
  /** Spotify playlist/album URIs added as locked units. */
  sourceUris: z.array(z.string()),
  /** Individually-added Spotify track URIs. */
  trackUris: z.array(z.string()),
  /** Tracks the GM banished from THIS playlist. */
  banishedTrackUris: z.array(z.string()),
  sortIndex: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Playlist = z.infer<typeof playlistSchema>;

export const playlistListSchema = z.array(playlistSchema);

/** Fields a client may set when creating a playlist; server fills id/owner/dates. */
export const createPlaylistSchema = z.object({
  location: z.string().min(1).default('General'),
  atmosphere: atmosphereSchema.default('ambient'),
  pinned: z.boolean().default(false),
  sourceUris: z.array(z.string()).default([]),
  trackUris: z.array(z.string()).default([]),
  banishedTrackUris: z.array(z.string()).default([]),
  sortIndex: z.number().int().default(0),
});

export type CreatePlaylistInput = z.input<typeof createPlaylistSchema>;

export const updatePlaylistSchema = createPlaylistSchema.partial();
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
