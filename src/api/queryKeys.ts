/** React Query keys for persisted data, namespaced by owner. */
export const dataKeys = {
  all: ['data'] as const,
  mixes: (owner: string) => [...dataKeys.all, 'mixes', owner] as const,
  settings: (owner: string) => [...dataKeys.all, 'settings', owner] as const,
};
