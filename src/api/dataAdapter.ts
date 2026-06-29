import { httpAdapter } from './adapters/httpAdapter';
import { localAdapter } from './adapters/localAdapter';
import type { DataAdapter } from './adapters/types';
import { IS_API_ENABLED } from './httpClient';

/** The active data backend: AWS HTTP API when configured, else localStorage. */
export const dataAdapter: DataAdapter = IS_API_ENABLED ? httpAdapter : localAdapter;
