/**
 * DynamoDB DocumentClient factory. Builds a client whose AWS credentials come
 * from the Cognito Identity Pool, authenticated with the current Google ID
 * token. The IAM role behind the pool restricts every action to rows whose
 * partition key equals the caller's own Cognito identity id.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { AWS_REGION, COGNITO_IDENTITY_POOL_ID, GOOGLE_LOGIN_PROVIDER } from '~auth/awsConfig';

let cached: { googleIdToken: string; client: DynamoDBDocumentClient } | null = null;

/**
 * Get (or build) the DocumentClient for the given Google ID token. Cached per
 * token so a session reuses one client; a fresh token (re-login) replaces it.
 */
export const getDynamoClient = (googleIdToken: string): DynamoDBDocumentClient => {
  if (cached?.googleIdToken === googleIdToken) return cached.client;

  cached?.client.destroy();
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: AWS_REGION,
      credentials: fromCognitoIdentityPool({
        identityPoolId: COGNITO_IDENTITY_POOL_ID,
        logins: { [GOOGLE_LOGIN_PROVIDER]: googleIdToken },
        clientConfig: { region: AWS_REGION },
      }),
    }),
    { marshallOptions: { removeUndefinedValues: true } },
  );
  cached = { googleIdToken, client };
  return client;
};
