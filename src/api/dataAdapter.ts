import { dynamoAdapter } from './adapters/dynamoAdapter';
import type { DataAdapter } from './adapters/types';

/**
 * The active data backend: DynamoDB, accessed directly from the browser with
 * Cognito Identity Pool credentials. Always — the required env config is
 * validated at startup (see ~auth/awsConfig), so there is no runtime fallback.
 * Tests mock this module (the localStorage adapter exists for that purpose).
 */
export const dataAdapter: DataAdapter = dynamoAdapter;
