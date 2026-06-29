/** React Query keys for persisted data, namespaced by owner. */
export const dataKeys = {
  all: ['data'] as const,
  mixes: (owner: string) => [...dataKeys.all, 'mixes', owner] as const,
  prefs: (owner: string) => [...dataKeys.all, 'prefs', owner] as const,
};
