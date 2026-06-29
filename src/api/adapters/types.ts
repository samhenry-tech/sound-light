import type {
  CreateMixInput,
  Mix,
  UpdateMixInput,
  UpdateUserPrefsInput,
  UserPrefs,
} from '@/shared/contract';

/** Per-request context: the access token and the owning user's id. */
export interface DataContext {
  token: string | null;
  owner: string;
}

/**
 * The data backend seam. The HTTP adapter talks to API Gateway + Lambda +
 * DynamoDB; the local adapter persists to localStorage for offline use. Both
 * scope every record to `ctx.owner`.
 */
export interface DataAdapter {
  listMixes(ctx: DataContext): Promise<Mix[]>;
  createMix(ctx: DataContext, input: CreateMixInput): Promise<Mix>;
  updateMix(ctx: DataContext, id: string, input: UpdateMixInput): Promise<Mix>;
  deleteMix(ctx: DataContext, id: string): Promise<void>;
  getPrefs(ctx: DataContext): Promise<UserPrefs>;
  updatePrefs(ctx: DataContext, input: UpdateUserPrefsInput): Promise<UserPrefs>;
}
