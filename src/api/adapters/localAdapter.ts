/**
 * DataAdapter backed by localStorage — used as a test double. Seeds the
 * prototype's starter library on first use and scopes everything by owner.
 */
import { APP_NAME } from '~/constants';
import {
  type DefaultGenreId,
  defaultGenreIdSchema,
  DEFAULTS_OWNER,
} from '~/models/defaultPlaylists';
import { createPlaylistSchema, type Playlist, updatePlaylistSchema } from '~/models/playlist';
import {
  DEFAULT_SETTINGS,
  updateUserSettingsSchema,
  type UserSettings,
} from '~/models/userSettings';
import { createId } from '~/utils/idUtils';

import { getSeedPlaylists } from '../seed';
import type { DataAdapter, DataContext } from './types';

interface LocalStore {
  playlists: Playlist[];
  settings: UserSettings | null;
}

const storeKey = (owner: string) => `${APP_NAME}.data.${owner}`;

const write = (owner: string, store: LocalStore): void => {
  localStorage.setItem(storeKey(owner), JSON.stringify(store));
};

const read = (owner: string): LocalStore => {
  try {
    const raw = localStorage.getItem(storeKey(owner));
    if (raw) return JSON.parse(raw) as LocalStore;
  } catch {
    // fall through to seed
  }
  const seeded: LocalStore = {
    playlists: owner === DEFAULTS_OWNER ? [] : getSeedPlaylists(owner),
    settings: null,
  };
  write(owner, seeded);
  return seeded;
};

const defaultSettings = (owner: string): UserSettings => {
  return { owner, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
};

export const localAdapter: DataAdapter = {
  listPlaylists({ owner }: DataContext) {
    return Promise.resolve(
      read(owner)
        .playlists.slice()
        .sort((a, b) => a.sortIndex - b.sortIndex),
    );
  },

  createPlaylist({ owner }: DataContext, input) {
    const store = read(owner);
    const values = createPlaylistSchema.parse(input);
    const now = new Date().toISOString();
    const playlist: Playlist = {
      ...values,
      id: createId(),
      owner,
      sortIndex: store.playlists.length,
      createdAt: now,
      updatedAt: now,
    };
    store.playlists.push(playlist);
    write(owner, store);
    return Promise.resolve(playlist);
  },

  updatePlaylist({ owner }: DataContext, id, input) {
    const store = read(owner);
    const patch = updatePlaylistSchema.parse(input);
    const index = store.playlists.findIndex((m) => m.id === id);
    if (index === -1) return Promise.reject(new Error(`Playlist ${id} not found`));
    const updated: Playlist = {
      ...store.playlists[index]!,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    store.playlists[index] = updated;
    write(owner, store);
    return Promise.resolve(updated);
  },

  deletePlaylist({ owner }: DataContext, id) {
    const store = read(owner);
    store.playlists = store.playlists.filter((m) => m.id !== id);
    write(owner, store);
    return Promise.resolve();
  },

  listDefaultPlaylists(_ctx: DataContext) {
    return Promise.resolve(
      read(DEFAULTS_OWNER)
        .playlists.slice()
        .sort((a, b) => a.sortIndex - b.sortIndex),
    );
  },

  putDefaultPlaylist(_ctx: DataContext, playlist: Playlist) {
    const store = read(DEFAULTS_OWNER);
    if (!playlist.genre) return Promise.reject(new Error('Default playlists require a genre'));
    defaultGenreIdSchema.parse(playlist.genre);
    const item: Playlist = {
      ...playlist,
      owner: DEFAULTS_OWNER,
      updatedAt: new Date().toISOString(),
    };
    const index = store.playlists.findIndex((p) => p.id === item.id);
    if (index === -1) store.playlists.push(item);
    else store.playlists[index] = item;
    write(DEFAULTS_OWNER, store);
    return Promise.resolve(item);
  },

  async copyGenreDefaults(ctx: DataContext, genre: DefaultGenreId) {
    const pack = (await this.listDefaultPlaylists(ctx)).filter((p) => p.genre === genre);
    if (pack.length === 0) {
      throw new Error(`No default playlists found for genre “${genre}”`);
    }
    const created: Playlist[] = [];
    for (const source of pack) {
      created.push(
        await this.createPlaylist(ctx, {
          location: source.location,
          atmosphere: source.atmosphere,
          pinned: source.pinned,
          trackUris: [...source.trackUris],
          sourceUris: [],
          banishedTrackUris: [],
        }),
      );
    }
    return created;
  },

  getSettings({ owner }: DataContext) {
    return Promise.resolve(read(owner).settings ?? defaultSettings(owner));
  },

  updateSettings({ owner }: DataContext, input) {
    const store = read(owner);
    const patch = updateUserSettingsSchema.parse(input);
    const { googleRefreshToken, ...uiPatch } = patch;
    const next: UserSettings = {
      ...(store.settings ?? defaultSettings(owner)),
      ...uiPatch,
      owner,
      updatedAt: new Date().toISOString(),
    };
    if (googleRefreshToken) {
      next.googleRefreshToken = googleRefreshToken;
    } else if (googleRefreshToken === null) {
      delete next.googleRefreshToken;
    }
    store.settings = next;
    write(owner, store);
    return Promise.resolve(next);
  },
};
