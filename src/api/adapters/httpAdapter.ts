/** DataAdapter backed by the AWS HTTP API (API Gateway + Lambda + DynamoDB). */
import { mixListSchema, mixSchema, userPrefsSchema } from '@/shared/contract';
import { apiFetch } from '../httpClient';
import type { DataAdapter } from './types';

export const httpAdapter: DataAdapter = {
  listMixes: ({ token }) => apiFetch('/mixes', { token, schema: mixListSchema }),

  createMix: ({ token }, input) =>
    apiFetch('/mixes', { token, method: 'POST', body: input, schema: mixSchema }),

  updateMix: ({ token }, id, input) =>
    apiFetch(`/mixes/${encodeURIComponent(id)}`, {
      token,
      method: 'PUT',
      body: input,
      schema: mixSchema,
    }),

  deleteMix: ({ token }, id) =>
    apiFetch(`/mixes/${encodeURIComponent(id)}`, { token, method: 'DELETE' }),

  getPrefs: ({ token }) => apiFetch('/prefs', { token, schema: userPrefsSchema }),

  updatePrefs: ({ token }, input) =>
    apiFetch('/prefs', { token, method: 'PUT', body: input, schema: userPrefsSchema }),
};
