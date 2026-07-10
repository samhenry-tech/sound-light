import type {
  CreateMixInput,
  Mix,
  UpdateMixInput,
  UpdateUserSettingsInput,
  UserSettings,
} from '~shared/contract';

/** Per-request context for the data backend. */
export interface DataContext {
  /** Cognito identity id — the DynamoDB partition key for all of this user's rows. */
  owner: string;
  /** Google ID token exchanged with the identity pool for AWS credentials. */
  googleIdToken: string;
}

/**
 * The data backend seam. The DynamoDB adapter talks to DynamoDB directly with
 * Cognito Identity Pool credentials; the local adapter persists to
 * localStorage and exists only for unit tests. Both scope every record to
 * `ctx.owner`.
 */
export interface DataAdapter {
  listMixes(ctx: DataContext): Promise<Mix[]>;
  createMix(ctx: DataContext, input: CreateMixInput): Promise<Mix>;
  updateMix(ctx: DataContext, id: string, input: UpdateMixInput): Promise<Mix>;
  deleteMix(ctx: DataContext, id: string): Promise<void>;
  getSettings(ctx: DataContext): Promise<UserSettings>;
  updateSettings(ctx: DataContext, input: UpdateUserSettingsInput): Promise<UserSettings>;
}
