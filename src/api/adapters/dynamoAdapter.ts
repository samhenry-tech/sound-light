/**
 * DataAdapter talking to DynamoDB directly from the browser (no API layer).
 *
 * `ctx.owner` is the caller's Cognito identity id — the partition key of both
 * tables. IAM enforces row-level isolation via `dynamodb:LeadingKeys`, so a
 * wrong/forged owner simply gets AccessDenied from DynamoDB. Everything read
 * or written is validated against the shared Zod contract.
 */
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { PLAYLISTS_TABLE, SETTINGS_TABLE } from '~auth/awsConfig';
import {
  createPlaylistInputSchema,
  DEFAULT_SETTINGS,
  type Playlist,
  playlistListSchema,
  playlistSchema,
  updatePlaylistInputSchema,
  updateUserSettingsInputSchema,
  type UserSettings,
  userSettingsSchema,
} from '~shared/contract';
import { createId } from '~utils/idUtils';

import { getDynamoClient } from '../dynamoClient';
import type { DataAdapter, DataContext } from './types';

const fetchPlaylist = async (ctx: DataContext, id: string): Promise<Playlist | undefined> => {
  const result = await getDynamoClient(ctx.googleIdToken).send(
    new GetCommand({ TableName: PLAYLISTS_TABLE, Key: { owner: ctx.owner, id } }),
  );
  return result.Item ? playlistSchema.parse(result.Item) : undefined;
};

const fetchSettings = async (ctx: DataContext): Promise<UserSettings | undefined> => {
  const result = await getDynamoClient(ctx.googleIdToken).send(
    new GetCommand({ TableName: SETTINGS_TABLE, Key: { owner: ctx.owner } }),
  );
  return result.Item ? userSettingsSchema.parse(result.Item) : undefined;
};

export const dynamoAdapter: DataAdapter = {
  async listPlaylists(ctx) {
    const result = await getDynamoClient(ctx.googleIdToken).send(
      new QueryCommand({
        TableName: PLAYLISTS_TABLE,
        KeyConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: { '#owner': 'owner' },
        ExpressionAttributeValues: { ':owner': ctx.owner },
      }),
    );
    const playlists = playlistListSchema.parse(result.Items ?? []);
    // Stable, predictable order for the client grid.
    return playlists.sort(
      (a, b) => a.sortIndex - b.sortIndex || a.createdAt.localeCompare(b.createdAt),
    );
  },

  async createPlaylist(ctx, input) {
    const values = createPlaylistInputSchema.parse(input);
    const now = new Date().toISOString();
    const playlist = playlistSchema.parse({
      ...values,
      id: createId(),
      owner: ctx.owner,
      createdAt: now,
      updatedAt: now,
    });
    await getDynamoClient(ctx.googleIdToken).send(
      new PutCommand({ TableName: PLAYLISTS_TABLE, Item: playlist }),
    );
    return playlist;
  },

  async updatePlaylist(ctx, id, input) {
    const existing = await fetchPlaylist(ctx, id);
    if (!existing) throw new Error(`Playlist ${id} not found`);

    // Partial update over the immutable identity fields: id/owner/createdAt
    // are never client-mutable.
    const patch = updatePlaylistInputSchema.parse(input);
    const updated: Playlist = {
      ...existing,
      ...patch,
      id: existing.id,
      owner: existing.owner,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await getDynamoClient(ctx.googleIdToken).send(
      new PutCommand({ TableName: PLAYLISTS_TABLE, Item: updated }),
    );
    return updated;
  },

  async deletePlaylist(ctx, id) {
    // Idempotent: succeeds whether or not the item existed.
    await getDynamoClient(ctx.googleIdToken).send(
      new DeleteCommand({ TableName: PLAYLISTS_TABLE, Key: { owner: ctx.owner, id } }),
    );
  },

  async getSettings(ctx) {
    const stored = await fetchSettings(ctx);
    if (stored) return stored;
    // No stored settings: return defaults WITHOUT persisting them.
    return { owner: ctx.owner, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
  },

  async updateSettings(ctx, input) {
    const patch = updateUserSettingsInputSchema.parse(input);
    const base = (await fetchSettings(ctx)) ?? { owner: ctx.owner, ...DEFAULT_SETTINGS };
    const { googleRefreshToken, ...uiPatch } = patch;
    const settings: UserSettings = {
      ...base,
      ...uiPatch,
      owner: ctx.owner,
      updatedAt: new Date().toISOString(),
    };
    if (googleRefreshToken) {
      settings.googleRefreshToken = googleRefreshToken;
    } else if (googleRefreshToken === null) {
      delete settings.googleRefreshToken;
    }
    await getDynamoClient(ctx.googleIdToken).send(
      new PutCommand({ TableName: SETTINGS_TABLE, Item: settings }),
    );
    return settings;
  },
};
