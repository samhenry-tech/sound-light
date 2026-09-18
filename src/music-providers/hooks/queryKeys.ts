/** React Query keys for music data, namespaced by provider id. */
export const musicKeys = {
  all: (providerId: string) => ['music', providerId] as const,
  search: (providerId: string, query: string) =>
    [...musicKeys.all(providerId), 'search', query] as const,
  sources: (providerId: string, uris: readonly string[]) =>
    [...musicKeys.all(providerId), 'sources', [...uris].sort()] as const,
  tracks: (providerId: string, uris: readonly string[]) =>
    [...musicKeys.all(providerId), 'tracks', [...uris].sort()] as const,
};
