/**
 * DataAdapter backed by localStorage — used as a test double. Seeds the
 * prototype's starter library on first use and scopes everything by owner.
 */
import { APP_NAME } from '~constants';
import {
  createMixInputSchema,
  DEFAULT_SETTINGS,
  type Mix,
  updateMixInputSchema,
  updateUserSettingsInputSchema,
  type UserSettings,
} from '~shared/contract';
import { createId } from '~utils/idUtils';

import { getSeedMixes } from '../seed';
import type { DataAdapter, DataContext } from './types';

interface LocalStore {
  mixes: Mix[];
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
  const seeded: LocalStore = { mixes: getSeedMixes(owner), settings: null };
  write(owner, seeded);
  return seeded;
};

const defaultSettings = (owner: string): UserSettings => {
  return { owner, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
};

export const localAdapter: DataAdapter = {
  listMixes({ owner }: DataContext) {
    return Promise.resolve(
      read(owner)
        .mixes.slice()
        .sort((a, b) => a.sortIndex - b.sortIndex),
    );
  },

  createMix({ owner }: DataContext, input) {
    const store = read(owner);
    const values = createMixInputSchema.parse(input);
    const now = new Date().toISOString();
    const mix: Mix = {
      ...values,
      id: createId(),
      owner,
      sortIndex: store.mixes.length,
      createdAt: now,
      updatedAt: now,
    };
    store.mixes.push(mix);
    write(owner, store);
    return Promise.resolve(mix);
  },

  updateMix({ owner }: DataContext, id, input) {
    const store = read(owner);
    const patch = updateMixInputSchema.parse(input);
    const index = store.mixes.findIndex((m) => m.id === id);
    if (index === -1) return Promise.reject(new Error(`Mix ${id} not found`));
    const updated: Mix = { ...store.mixes[index]!, ...patch, updatedAt: new Date().toISOString() };
    store.mixes[index] = updated;
    write(owner, store);
    return Promise.resolve(updated);
  },

  deleteMix({ owner }: DataContext, id) {
    const store = read(owner);
    store.mixes = store.mixes.filter((m) => m.id !== id);
    write(owner, store);
    return Promise.resolve();
  },

  getSettings({ owner }: DataContext) {
    return Promise.resolve(read(owner).settings ?? defaultSettings(owner));
  },

  updateSettings({ owner }: DataContext, input) {
    const store = read(owner);
    const patch = updateUserSettingsInputSchema.parse(input);
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
