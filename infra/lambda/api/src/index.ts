/**
 * atmos data API — a single Lambda function with an internal router.
 *
 * Fronted by API Gateway HTTP API (payload format 2.0) with a Cognito JWT
 * authorizer. The caller's identity (`owner`) is ALWAYS taken from the verified
 * JWT `sub` claim — never from the request body or path.
 *
 * The shapes here mirror the frontend's Zod schemas in src/shared/contract.ts.
 * CORS is handled by API Gateway, so no CORS headers are set here.
 */
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

/* -------------------------------------------------------------------------- */
/* Types (mirror src/shared/contract.ts)                                      */
/* -------------------------------------------------------------------------- */

const ATMOSPHERES = ['ambient', 'exciting', 'battle', 'suspense', 'victory', 'loss'] as const;
type Atmosphere = (typeof ATMOSPHERES)[number];

const CARD_LABELS = ['split', 'combined'] as const;
type CardLabel = (typeof CARD_LABELS)[number];

interface Mix {
  id: string;
  owner: string;
  location: string;
  atmosphere: Atmosphere;
  pinned: boolean;
  sourceUris: string[];
  trackUris: string[];
  banishedTrackUris: string[];
  sortIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface UserPrefs {
  owner: string;
  accent: string;
  columns: number;
  cardLabel: CardLabel;
  spotifyLinked: boolean;
  updatedAt: string;
}

const DEFAULT_PREFS: Omit<UserPrefs, 'owner' | 'updatedAt'> = {
  accent: '#3ecf8e',
  columns: 5,
  cardLabel: 'split',
  spotifyLinked: false,
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/* -------------------------------------------------------------------------- */
/* AWS clients + env                                                          */
/* -------------------------------------------------------------------------- */

const MIXES_TABLE = requireEnv('MIXES_TABLE');
const PREFS_TABLE = requireEnv('PREFS_TABLE');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

/* -------------------------------------------------------------------------- */
/* HTTP helpers                                                               */
/* -------------------------------------------------------------------------- */

/** A small typed error carrying an HTTP status code. */
class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
};

/** 204 No Content has no body. */
const noContent = (): APIGatewayProxyResultV2 => {
  return { statusCode: 204, body: '' };
};

const parseBody = (raw: string | undefined, isBase64Encoded: boolean): Record<string, unknown> => {
  if (!raw) return {};
  // HTTP APIs may base64-encode the body; the event flag tells us authoritatively.
  const text = isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new HttpError(400, 'Request body must be a JSON object');
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, 'Invalid JSON in request body');
  }
};

/* -------------------------------------------------------------------------- */
/* Validation helpers                                                         */
/* -------------------------------------------------------------------------- */

const asStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
    throw new HttpError(400, `Field "${field}" must be an array of strings`);
  }
  return value as string[];
};

const asAtmosphere = (value: unknown): Atmosphere => {
  if (typeof value !== 'string' || !ATMOSPHERES.includes(value as Atmosphere)) {
    throw new HttpError(400, `Field "atmosphere" must be one of: ${ATMOSPHERES.join(', ')}`);
  }
  return value as Atmosphere;
};

const asCardLabel = (value: unknown): CardLabel => {
  if (typeof value !== 'string' || !CARD_LABELS.includes(value as CardLabel)) {
    throw new HttpError(400, `Field "cardLabel" must be one of: ${CARD_LABELS.join(', ')}`);
  }
  return value as CardLabel;
};

const asColumns = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 4 || value > 6) {
    throw new HttpError(400, 'Field "columns" must be an integer from 4 to 6');
  }
  return value;
};

const asAccent = (value: unknown): string => {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw new HttpError(400, 'Field "accent" must be a #RRGGBB hex color');
  }
  return value;
};

const asSortIndex = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new HttpError(400, 'Field "sortIndex" must be an integer');
  }
  return value;
};

const asNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.length < 1) {
    throw new HttpError(400, `Field "${field}" must be a non-empty string`);
  }
  return value;
};

/* -------------------------------------------------------------------------- */
/* Mix handlers                                                               */
/* -------------------------------------------------------------------------- */

const listMixes = async (owner: string): Promise<APIGatewayProxyResultV2> => {
  const result = await ddb.send(
    new QueryCommand({
      TableName: MIXES_TABLE,
      KeyConditionExpression: '#owner = :owner',
      ExpressionAttributeNames: { '#owner': 'owner' },
      ExpressionAttributeValues: { ':owner': owner },
    }),
  );
  const items = (result.Items ?? []) as Mix[];
  // Stable, predictable order for the client grid.
  items.sort((a, b) => a.sortIndex - b.sortIndex || a.createdAt.localeCompare(b.createdAt));
  return json(200, items);
};

const createMix = async (owner: string, body: Record<string, unknown>): Promise<APIGatewayProxyResultV2> => {
  const now = new Date().toISOString();
  const mix: Mix = {
    id: `mix-${randomUUID()}`,
    owner,
    location: body.location === undefined ? 'General' : asNonEmptyString(body.location, 'location'),
    atmosphere: body.atmosphere === undefined ? 'ambient' : asAtmosphere(body.atmosphere),
    pinned: body.pinned === undefined ? false : asBoolean(body.pinned, 'pinned'),
    sourceUris: body.sourceUris === undefined ? [] : asStringArray(body.sourceUris, 'sourceUris'),
    trackUris: body.trackUris === undefined ? [] : asStringArray(body.trackUris, 'trackUris'),
    banishedTrackUris:
      body.banishedTrackUris === undefined
        ? []
        : asStringArray(body.banishedTrackUris, 'banishedTrackUris'),
    sortIndex: body.sortIndex === undefined ? 0 : asSortIndex(body.sortIndex),
    createdAt: now,
    updatedAt: now,
  };

  await ddb.send(new PutCommand({ TableName: MIXES_TABLE, Item: mix }));
  return json(201, mix);
};

const getMix = async (owner: string, id: string): Promise<APIGatewayProxyResultV2> => {
  const mix = await fetchMix(owner, id);
  if (!mix) throw new HttpError(404, 'Mix not found');
  return json(200, mix);
};

const updateMix = async (owner: string, id: string, body: Record<string, unknown>): Promise<APIGatewayProxyResultV2> => {
  const existing = await fetchMix(owner, id);
  if (!existing) throw new HttpError(404, 'Mix not found');

  // Apply a partial update over the immutable identity fields. id/owner/
  // createdAt are never client-mutable.
  const updated: Mix = {
    ...existing,
    location:
      body.location === undefined ? existing.location : asNonEmptyString(body.location, 'location'),
    atmosphere: body.atmosphere === undefined ? existing.atmosphere : asAtmosphere(body.atmosphere),
    pinned: body.pinned === undefined ? existing.pinned : asBoolean(body.pinned, 'pinned'),
    sourceUris:
      body.sourceUris === undefined
        ? existing.sourceUris
        : asStringArray(body.sourceUris, 'sourceUris'),
    trackUris:
      body.trackUris === undefined
        ? existing.trackUris
        : asStringArray(body.trackUris, 'trackUris'),
    banishedTrackUris:
      body.banishedTrackUris === undefined
        ? existing.banishedTrackUris
        : asStringArray(body.banishedTrackUris, 'banishedTrackUris'),
    sortIndex: body.sortIndex === undefined ? existing.sortIndex : asSortIndex(body.sortIndex),
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: MIXES_TABLE, Item: updated }));
  return json(200, updated);
};

const deleteMix = async (owner: string, id: string): Promise<APIGatewayProxyResultV2> => {
  await ddb.send(
    new DeleteCommand({
      TableName: MIXES_TABLE,
      Key: { owner, id },
    }),
  );
  // Idempotent: 204 whether or not the item existed.
  return noContent();
};

const fetchMix = async (owner: string, id: string): Promise<Mix | undefined> => {
  const result = await ddb.send(
    new GetCommand({
      TableName: MIXES_TABLE,
      Key: { owner, id },
    }),
  );
  return result.Item as Mix | undefined;
};

const asBoolean = (value: unknown, field: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new HttpError(400, `Field "${field}" must be a boolean`);
  }
  return value;
};

/* -------------------------------------------------------------------------- */
/* Prefs handlers                                                             */
/* -------------------------------------------------------------------------- */

const getPrefs = async (owner: string): Promise<APIGatewayProxyResultV2> => {
  const result = await ddb.send(
    new GetCommand({
      TableName: PREFS_TABLE,
      Key: { owner },
    }),
  );

  if (result.Item) {
    return json(200, result.Item as UserPrefs);
  }

  // No stored prefs: return defaults WITHOUT persisting them.
  const prefs: UserPrefs = {
    owner,
    ...DEFAULT_PREFS,
    updatedAt: new Date().toISOString(),
  };
  return json(200, prefs);
};

const putPrefs = async (owner: string, body: Record<string, unknown>): Promise<APIGatewayProxyResultV2> => {
  // Load existing (if any) so a partial PUT preserves untouched fields, then
  // upsert the merged result.
  const existing = (await ddb.send(new GetCommand({ TableName: PREFS_TABLE, Key: { owner } })))
    .Item as UserPrefs | undefined;

  const base = existing ?? { owner, ...DEFAULT_PREFS, updatedAt: '' };

  const prefs: UserPrefs = {
    owner,
    accent: body.accent === undefined ? base.accent : asAccent(body.accent),
    columns: body.columns === undefined ? base.columns : asColumns(body.columns),
    cardLabel: body.cardLabel === undefined ? base.cardLabel : asCardLabel(body.cardLabel),
    spotifyLinked:
      body.spotifyLinked === undefined
        ? base.spotifyLinked
        : asBoolean(body.spotifyLinked, 'spotifyLinked'),
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: PREFS_TABLE, Item: prefs }));
  return json(200, prefs);
};

/* -------------------------------------------------------------------------- */
/* Router + entrypoint                                                        */
/* -------------------------------------------------------------------------- */

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const owner = event.requestContext.authorizer?.jwt?.claims?.sub;
    if (typeof owner !== 'string' || owner.length === 0) {
      // The JWT authorizer should guarantee this; guard anyway.
      throw new HttpError(401, 'Unauthorized');
    }

    const routeKey = event.requestContext.routeKey;
    const id = event.pathParameters?.id;
    const body = () => parseBody(event.body, event.isBase64Encoded);

    switch (routeKey) {
      case 'GET /mixes':
        return await listMixes(owner);
      case 'POST /mixes':
        return await createMix(owner, body());
      case 'GET /mixes/{id}':
        return await getMix(owner, requireId(id));
      case 'PUT /mixes/{id}':
        return await updateMix(owner, requireId(id), body());
      case 'DELETE /mixes/{id}':
        return await deleteMix(owner, requireId(id));
      case 'GET /prefs':
        return await getPrefs(owner);
      case 'PUT /prefs':
        return await putPrefs(owner, body());
      default:
        throw new HttpError(404, `No route for ${routeKey ?? 'unknown'}`);
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return json(err.statusCode, { message: err.message });
    }
    // Unexpected error: log for CloudWatch, return a generic 500.
    console.error('Unhandled error', err);
    return json(500, { message: 'Internal server error' });
  }
};

const requireId = (id: string | undefined): string => {
  if (!id) throw new HttpError(400, 'Missing path parameter: id');
  return id;
};
