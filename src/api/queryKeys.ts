/** React Query keys for persisted data, namespaced by owner. */
export const dataKeys = {
  all: ['data'] as const,
  playlists: (owner: string) => ['data', 'playlists', owner] as const,
  defaultPlaylists: ['data', 'defaultPlaylists'] as const,
  settings: (owner: string) => ['data', 'settings', owner] as const,
};
