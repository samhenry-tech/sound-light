/**
 * Build ~4h track lists for each default genre playlist via the music provider
 * (Spotify search + playlist expansion), then persist them under the shared
 * `defaults` partition.
 */
import {
  DEFAULT_PLAYLIST_DEFS,
  defaultPlaylistId,
  DEFAULTS_OWNER,
  TARGET_PLAYLIST_DURATION_MS,
} from '~/models/defaultPlaylists';
import type { Playlist } from '~/models/playlist';
import type { MusicProvider } from '~/music-providers/models/MusicProvider';
import type { MusicTrack } from '~/music-providers/models/MusicTrack';

export interface PopulateProgress {
  /** 0-based index of the playlist currently being filled. */
  index: number;
  total: number;
  label: string;
}

export interface PopulateResult {
  playlists: Playlist[];
  /** Playlists that ended under the duration target (still saved). */
  shortfall: string[];
}

const collectTracksForDef = async (
  provider: MusicProvider,
  queries: readonly string[],
): Promise<MusicTrack[]> => {
  const byUri = new Map<string, MusicTrack>();
  let durationMs = 0;

  const addTrack = (track: MusicTrack): boolean => {
    if (!track.uri || byUri.has(track.uri)) return durationMs >= TARGET_PLAYLIST_DURATION_MS;
    if (track.durationMs <= 0) return false;
    byUri.set(track.uri, track);
    durationMs += track.durationMs;
    return durationMs >= TARGET_PLAYLIST_DURATION_MS;
  };

  for (const query of queries) {
    if (durationMs >= TARGET_PLAYLIST_DURATION_MS) break;
    const results = await provider.search(query);

    // Prefer expanding whole playlists — denser, better genre coverage.
    for (const source of results.sources) {
      if (durationMs >= TARGET_PLAYLIST_DURATION_MS) break;
      try {
        const [resolved] = await provider.resolveSources([source.uri]);
        if (!resolved) continue;
        for (const track of resolved.tracks) {
          if (addTrack(track)) break;
        }
      } catch {
        // Skip unresolvable / private playlists.
      }
    }

    for (const track of results.tracks) {
      if (addTrack(track)) break;
    }
  }

  return [...byUri.values()];
};

export type PutDefaultPlaylist = (playlist: Playlist) => Promise<Playlist>;

/**
 * Populate every default playlist definition from Spotify and write each row
 * to the shared defaults partition via `putDefault`.
 */
export const populateDefaultPlaylists = async (
  provider: MusicProvider,
  putDefault: PutDefaultPlaylist,
  onProgress?: (progress: PopulateProgress) => void,
): Promise<PopulateResult> => {
  const playlists: Playlist[] = [];
  const shortfall: string[] = [];
  const now = new Date().toISOString();
  const total = DEFAULT_PLAYLIST_DEFS.length;

  for (const [index, def] of DEFAULT_PLAYLIST_DEFS.entries()) {
    const label = `${def.genre} · ${def.location} – ${def.atmosphere}`;
    onProgress?.({ index, total, label });

    const tracks = await collectTracksForDef(provider, def.searchQueries);
    const durationMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);
    if (durationMs < TARGET_PLAYLIST_DURATION_MS * 0.85) {
      shortfall.push(label);
    }

    const playlist = await putDefault({
      id: defaultPlaylistId(def.genre, def.location, def.atmosphere),
      owner: DEFAULTS_OWNER,
      genre: def.genre,
      location: def.location,
      atmosphere: def.atmosphere,
      pinned: Boolean(def.pinned),
      sourceUris: [],
      trackUris: tracks.map((t) => t.uri),
      banishedTrackUris: [],
      sortIndex: index,
      createdAt: now,
      updatedAt: now,
    });
    playlists.push(playlist);
  }

  return { playlists, shortfall };
};
