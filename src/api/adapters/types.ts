import type { DefaultGenreId } from '~/models/defaultPlaylists';
import type { CreatePlaylistInput, Playlist, UpdatePlaylistInput } from '~/models/playlist';
import type { UpdateUserSettingsInput, UserSettings } from '~/models/userSettings';

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
 * `ctx.owner` (except the shared defaults partition).
 */
export interface DataAdapter {
  listPlaylists(ctx: DataContext): Promise<Playlist[]>;
  createPlaylist(ctx: DataContext, input: CreatePlaylistInput): Promise<Playlist>;
  updatePlaylist(ctx: DataContext, id: string, input: UpdatePlaylistInput): Promise<Playlist>;
  deletePlaylist(ctx: DataContext, id: string): Promise<void>;
  /** Shared default genre packs (`owner = "defaults"`). */
  listDefaultPlaylists(ctx: DataContext): Promise<Playlist[]>;
  /** Replace/create a single defaults-partition row (admin only). */
  putDefaultPlaylist(ctx: DataContext, playlist: Playlist): Promise<Playlist>;
  /** Copy one genre pack from defaults into the caller's own library. */
  copyGenreDefaults(ctx: DataContext, genre: DefaultGenreId): Promise<Playlist[]>;
  getSettings(ctx: DataContext): Promise<UserSettings>;
  updateSettings(ctx: DataContext, input: UpdateUserSettingsInput): Promise<UserSettings>;
}
