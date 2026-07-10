/**
 * DataAdapter backed by localStorage — the zero-setup offline path. Seeds the
 * prototype's starter library on first use and scopes everything by owner.
 */
import { createId } from '~utils/idUtils';
import {
  createMixInputSchema,
  DEFAULT_PREFS,
  type Mix,
  updateMixInputSchema,
  updateUserPrefsInputSchema,
  type UserPrefs,
} from '~shared/contract';

import { getSeedMixes } from '../seed';
import type { DataAdapter, DataContext } from './types';

interface LocalStore {
  mixes: Mix[];
  prefs: UserPrefs | null;
}

const storeKey = (owner: string) => `atmos.data.${owner}`;

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
  const seeded: LocalStore = { mixes: getSeedMixes(owner), prefs: null };
  write(owner, seeded);
  return seeded;
};

const defaultPrefs = (owner: string): UserPrefs => {
  return { owner, ...DEFAULT_PREFS, updatedAt: new Date().toISOString() };
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

  getPrefs({ owner }: DataContext) {
    return Promise.resolve(read(owner).prefs ?? defaultPrefs(owner));
  },

  updatePrefs({ owner }: DataContext, input) {
    const store = read(owner);
    const patch = updateUserPrefsInputSchema.parse(input);
    const next: UserPrefs = {
      ...(store.prefs ?? defaultPrefs(owner)),
      ...patch,
      owner,
      updatedAt: new Date().toISOString(),
    };
    store.prefs = next;
    write(owner, store);
    return Promise.resolve(next);
  },
};
