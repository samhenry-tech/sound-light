/**
 * UserSettings data contract — Zod schemas for the shapes stored in DynamoDB
 * (see `src/api/adapters/dynamoAdapter.ts`).
 */
import { z } from 'zod';

import { DEFAULT_ACCENT } from '~/theme/atmosphere';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const cardLabelSchema = z.enum(['split', 'combined']);

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

export const updateUserSettingsSchema = z.object({
  accent: z.string().regex(HEX_COLOR).optional(),
  columns: z.number().int().min(4).max(6).optional(),
  cardLabel: cardLabelSchema.optional(),
  spotifyLinked: z.boolean().optional(),
  googleRefreshToken: z.string().min(1).nullable().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

/** Defaults used when a user has no persisted settings yet. */
export const DEFAULT_SETTINGS: Omit<UserSettings, 'owner' | 'updatedAt'> = {
  accent: DEFAULT_ACCENT,
  columns: 5,
  cardLabel: 'split',
  spotifyLinked: false,
};
