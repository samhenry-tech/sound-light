/**
 * DataAdapter talking to DynamoDB directly from the browser (no API layer).
 *
 * `ctx.owner` is the caller's Cognito identity id — the partition key of both
 * tables. IAM enforces row-level isolation via `dynamodb:LeadingKeys`, so a
 * wrong/forged owner simply gets AccessDenied from DynamoDB. Everything read
 * or written is validated against the shared Zod contract.
 *
 * Shared default genre packs live in the same playlists table under the fixed
 * partition key {@link DEFAULTS_OWNER} (readable by all authenticated users;
 * writable only by the configured admin identity).
 */
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

import { PLAYLISTS_TABLE, SETTINGS_TABLE } from '~/auth/awsConfig';
import {
  type DefaultGenreId,
  defaultGenreIdSchema,
  DEFAULTS_OWNER,
} from '~/models/defaultPlaylists';
import {
  createPlaylistSchema,
  type Playlist,
  playlistListSchema,
  playlistSchema,
  updatePlaylistSchema,
} from '~/models/playlist';
import {
  DEFAULT_SETTINGS,
  updateUserSettingsSchema,
  type UserSettings,
  userSettingsSchema,
} from '~/models/userSettings';
import { createId } from '~/utils/idUtils';

import { getBundledDefaultPlaylists } from '../defaultPlaylistCatalog';
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

const queryPlaylistsByOwner = async (ctx: DataContext, owner: string): Promise<Playlist[]> => {
  const result = await getDynamoClient(ctx.googleIdToken).send(
    new QueryCommand({
      TableName: PLAYLISTS_TABLE,
      KeyConditionExpression: '#owner = :owner',
      ExpressionAttributeNames: { '#owner': 'owner' },
      ExpressionAttributeValues: { ':owner': owner },
    }),
  );
  const playlists = playlistListSchema.parse(result.Items ?? []);
  return playlists.sort(
    (a, b) => a.sortIndex - b.sortIndex || a.createdAt.localeCompare(b.createdAt),
  );
};

export const dynamoAdapter: DataAdapter = {
  async listPlaylists(ctx) {
    return queryPlaylistsByOwner(ctx, ctx.owner);
  },

  async createPlaylist(ctx, input) {
    const values = createPlaylistSchema.parse(input);
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
    const patch = updatePlaylistSchema.parse(input);
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

  async listDefaultPlaylists(ctx) {
    try {
      const stored = await queryPlaylistsByOwner(ctx, DEFAULTS_OWNER);
      if (stored.length > 0) return stored;
    } catch {
      // Pre-IAM-apply or network: fall through to the bundled catalog.
    }
    return getBundledDefaultPlaylists();
  },

  async putDefaultPlaylist(ctx, playlist) {
    const item = playlistSchema.parse({
      ...playlist,
      owner: DEFAULTS_OWNER,
      updatedAt: new Date().toISOString(),
    });
    if (!item.genre) throw new Error('Default playlists require a genre');
    defaultGenreIdSchema.parse(item.genre);
    await getDynamoClient(ctx.googleIdToken).send(
      new PutCommand({ TableName: PLAYLISTS_TABLE, Item: item }),
    );
    return item;
  },

  async copyGenreDefaults(ctx, genre: DefaultGenreId) {
    const pack = (await this.listDefaultPlaylists(ctx)).filter((p) => p.genre === genre);
    if (pack.length === 0) {
      throw new Error(`No default playlists found for genre “${genre}”`);
    }

    const existing = await queryPlaylistsByOwner(ctx, ctx.owner);
    const baseSort = existing.length;
    const now = new Date().toISOString();
    const created: Playlist[] = [];

    for (const [index, source] of pack.entries()) {
      const playlist = playlistSchema.parse({
        id: createId(),
        owner: ctx.owner,
        location: source.location,
        atmosphere: source.atmosphere,
        pinned: source.pinned,
        sourceUris: [],
        trackUris: [...source.trackUris],
        banishedTrackUris: [],
        sortIndex: baseSort + index,
        createdAt: now,
        updatedAt: now,
      });
      await getDynamoClient(ctx.googleIdToken).send(
        new PutCommand({ TableName: PLAYLISTS_TABLE, Item: playlist }),
      );
      created.push(playlist);
    }
    return created;
  },

  async getSettings(ctx) {
    const stored = await fetchSettings(ctx);
    if (stored) return stored;
    // No stored settings: return defaults WITHOUT persisting them.
    return { owner: ctx.owner, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
  },

  async updateSettings(ctx, input) {
    const patch = updateUserSettingsSchema.parse(input);
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
