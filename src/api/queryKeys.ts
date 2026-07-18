/** React Query keys for persisted data, namespaced by owner. */
export const dataKeys = {
  all: ['data'] as const,
  playlists: (owner: string) => [...dataKeys.all, 'playlists', owner] as const,
  settings: (owner: string) => [...dataKeys.all, 'settings', owner] as const,
};
