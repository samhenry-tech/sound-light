/**
 * Auth-internal helpers for the Google refresh token stored on UserSettings.
 * Never expose `googleRefreshToken` through UI-facing settings hooks.
 */
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

import { SETTINGS_TABLE } from '~auth/awsConfig';
import { DEFAULT_SETTINGS, userSettingsSchema } from '~shared/contract';

import { getDynamoClient } from './dynamoClient';
import type { DataContext } from './adapters/types';

export const loadGoogleRefreshToken = async (ctx: DataContext): Promise<string | undefined> => {
  const result = await getDynamoClient(ctx.googleIdToken).send(
    new GetCommand({ TableName: SETTINGS_TABLE, Key: { owner: ctx.owner } }),
  );
  if (!result.Item) return undefined;
  const settings = userSettingsSchema.parse(result.Item);
  return settings.googleRefreshToken;
};

export const persistGoogleRefreshToken = async (
  ctx: DataContext,
  refreshToken: string,
): Promise<void> => {
  const result = await getDynamoClient(ctx.googleIdToken).send(
    new GetCommand({ TableName: SETTINGS_TABLE, Key: { owner: ctx.owner } }),
  );
  const base = result.Item
    ? userSettingsSchema.parse(result.Item)
    : { owner: ctx.owner, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };

  await getDynamoClient(ctx.googleIdToken).send(
    new PutCommand({
      TableName: SETTINGS_TABLE,
      Item: {
        ...base,
        owner: ctx.owner,
        googleRefreshToken: refreshToken,
        updatedAt: new Date().toISOString(),
      },
    }),
  );
};

/** Remove the stored refresh token on logout (clears cross-device silent resume). */
export const clearGoogleRefreshToken = async (ctx: DataContext): Promise<void> => {
  const result = await getDynamoClient(ctx.googleIdToken).send(
    new GetCommand({ TableName: SETTINGS_TABLE, Key: { owner: ctx.owner } }),
  );
  if (!result.Item) return;

  const settings = userSettingsSchema.parse(result.Item);
  if (!settings.googleRefreshToken) return;

  const { googleRefreshToken: _removed, ...withoutRefresh } = settings;
  await getDynamoClient(ctx.googleIdToken).send(
    new PutCommand({
      TableName: SETTINGS_TABLE,
      Item: { ...withoutRefresh, updatedAt: new Date().toISOString() },
    }),
  );
};
