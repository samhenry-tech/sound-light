import type {
  CreatePlaylistInput,
  Playlist,
  UpdatePlaylistInput,
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
  listPlaylists(ctx: DataContext): Promise<Playlist[]>;
  createPlaylist(ctx: DataContext, input: CreatePlaylistInput): Promise<Playlist>;
  updatePlaylist(ctx: DataContext, id: string, input: UpdatePlaylistInput): Promise<Playlist>;
  deletePlaylist(ctx: DataContext, id: string): Promise<void>;
  getSettings(ctx: DataContext): Promise<UserSettings>;
  updateSettings(ctx: DataContext, input: UpdateUserSettingsInput): Promise<UserSettings>;
}
