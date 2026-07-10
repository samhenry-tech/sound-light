/**
 * The data contract shared across the app's data layer.
 *
 * These Zod schemas are the single source of truth for the item shapes stored
 * in DynamoDB (accessed directly from the browser via Cognito Identity Pool
 * credentials — see `src/api/adapters/dynamoAdapter.ts`). Everything that
 * crosses the network boundary is validated here so the rest of the app can
 * trust its types.
 */
import { z } from 'zod';

import { type Atmosphere, ATMOSPHERES, DEFAULT_ACCENT } from '~theme/atmosphere';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const atmosphereSchema = z.enum(ATMOSPHERES as unknown as [Atmosphere, ...Atmosphere[]]);

export const cardLabelSchema = z.enum(['split', 'combined']);

/* -------------------------------------------------------------------------- */
/* Mix                                                                         */
/* -------------------------------------------------------------------------- */

export const mixSchema = z.object({
  id: z.string().min(1),
  owner: z.string().min(1),
  location: z.string().min(1),
  atmosphere: atmosphereSchema,
  pinned: z.boolean(),
  /** Spotify playlist/album URIs added as locked units. */
  sourceUris: z.array(z.string()),
  /** Individually-added Spotify track URIs. */
  trackUris: z.array(z.string()),
  /** Tracks the GM banished from THIS mix. */
  banishedTrackUris: z.array(z.string()),
  sortIndex: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Mix = z.infer<typeof mixSchema>;

export const mixListSchema = z.array(mixSchema);

/** Fields a client may set when creating a mix; server fills id/owner/dates. */
export const createMixInputSchema = z.object({
  location: z.string().min(1).default('General'),
  atmosphere: atmosphereSchema.default('ambient'),
  pinned: z.boolean().default(false),
  sourceUris: z.array(z.string()).default([]),
  trackUris: z.array(z.string()).default([]),
  banishedTrackUris: z.array(z.string()).default([]),
  sortIndex: z.number().int().default(0),
});

export type CreateMixInput = z.input<typeof createMixInputSchema>;

export const updateMixInputSchema = createMixInputSchema.partial();
export type UpdateMixInput = z.infer<typeof updateMixInputSchema>;

/* -------------------------------------------------------------------------- */
/* UserSettings                                                                */
/* -------------------------------------------------------------------------- */

export const userSettingsSchema = z.object({
  owner: z.string().min(1),
  accent: z.string().regex(HEX_COLOR),
  columns: z.number().int().min(4).max(6),
  cardLabel: cardLabelSchema,
  spotifyLinked: z.boolean(),
  /** Auth-internal: Google OAuth refresh token for silent session renewal. */
  googleRefreshToken: z.string().min(1).optional(),
  updatedAt: z.string(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

/** Settings shape safe to expose to UI hooks (omits auth secrets). */
export const publicUserSettingsSchema = userSettingsSchema.omit({ googleRefreshToken: true });
export type PublicUserSettings = z.infer<typeof publicUserSettingsSchema>;

export const updateUserSettingsInputSchema = z.object({
  accent: z.string().regex(HEX_COLOR).optional(),
  columns: z.number().int().min(4).max(6).optional(),
  cardLabel: cardLabelSchema.optional(),
  spotifyLinked: z.boolean().optional(),
  googleRefreshToken: z.string().min(1).nullable().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsInputSchema>;

/** Defaults used when a user has no persisted settings yet. */
export const DEFAULT_SETTINGS: Omit<UserSettings, 'owner' | 'updatedAt'> = {
  accent: DEFAULT_ACCENT,
  columns: 5,
  cardLabel: 'split',
  spotifyLinked: false,
};
