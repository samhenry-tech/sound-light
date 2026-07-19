/** View-model for the Library detail editor of a single playlist. */
import { useMemo } from 'react';

import { useDeletePlaylist, useUpdatePlaylist } from '~api/hooks';
import { useMusicSearch } from '~music/hooks/useMusicSearch';
import { useResolvedSources, useResolvedTracks } from '~music/hooks/useResolvedTracks';
import { useMusicProvider } from '~music/MusicProviderContext';
import type { MusicSource, MusicTrack, ResolvedSource } from '~music/types';
import type { Playlist } from '~shared/contract';
import { useUiStore } from '~stores/uiStore';
import type { Atmosphere } from '~theme/atmosphere';

import { effectiveTracks, splitByBanished, type TrackWithOrigin } from './playlistTracks';

export interface EditorSearchResult {
  uri: string;
  kind: 'playlist' | 'track';
  title: string;
  sub: string;
  added: boolean;
  onAdd: () => void;
}

export interface EditorActions {
  setLocation: (location: string) => void;
  setAtmosphere: (atmosphere: Atmosphere) => void;
  addSource: (source: MusicSource) => Promise<void>;
  removeSource: (uri: string) => void;
  addTrack: (track: MusicTrack) => void;
  removeTrack: (uri: string) => void;
  restoreTrack: (uri: string) => void;
  remove: () => void;
}

export interface PlaylistEditorModel {
  sources: ResolvedSource[];
  active: TrackWithOrigin[];
  banished: TrackWithOrigin[];
  results: EditorSearchResult[];
  searchActive: boolean;
  isSearching: boolean;
  noResults: boolean;
  isLoading: boolean;
  actions: EditorActions;
}

export const usePlaylistEditor = (playlist: Playlist | undefined): PlaylistEditorModel => {
  const updatePlaylist = useUpdatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const provider = useMusicProvider();
  const editorQuery = useUiStore((s) => s.editorQuery);
  const showToast = useUiStore((s) => s.showToast);

  const sourcesQuery = useResolvedSources(playlist?.sourceUris ?? []);
  const tracksQuery = useResolvedTracks(playlist?.trackUris ?? []);
  const search = useMusicSearch(editorQuery);

  const effective = useMemo(
    () => effectiveTracks(sourcesQuery.data ?? [], tracksQuery.data ?? []),
    [sourcesQuery.data, tracksQuery.data],
  );
  const { active, banished } = useMemo(
    () => splitByBanished(effective, playlist?.banishedTrackUris ?? []),
    [effective, playlist?.banishedTrackUris],
  );

  const patch = (input: Parameters<typeof updatePlaylist.mutate>[0]['input']) => {
    if (playlist) updatePlaylist.mutate({ id: playlist.id, input });
  };

  const actions: EditorActions = {
    setLocation: (location) => patch({ location }),
    setAtmosphere: (atmosphere) => patch({ atmosphere }),
    addSource: async (source) => {
      if (!playlist) return;
      // Adding a Spotify playlist/album drops ALL of its tracks into this
      // in-app playlist (rather than linking it as a locked source unit).
      const [resolved] = await provider.resolveSources([source.uri]);
      const incoming = resolved?.tracks.map((t) => t.uri) ?? [];
      const existing = new Set(playlist.trackUris);
      const added = incoming.filter((uri) => !existing.has(uri));
      if (added.length === 0) {
        showToast(`No new tracks from “${source.name}”`);
        return;
      }
      patch({ trackUris: [...playlist.trackUris, ...added] });
      showToast(
        `Added ${added.length} track${added.length === 1 ? '' : 's'} from “${source.name}”`,
      );
    },
    removeSource: (uri) => {
      if (!playlist) return;
      patch({ sourceUris: playlist.sourceUris.filter((u) => u !== uri) });
    },
    addTrack: (track) => {
      if (!playlist || effective.some((t) => t.uri === track.uri)) return;
      patch({ trackUris: [...playlist.trackUris, track.uri] });
      showToast(`Added “${track.title}”`);
    },
    removeTrack: (uri) => {
      if (!playlist) return;
      patch({ trackUris: playlist.trackUris.filter((u) => u !== uri) });
    },
    restoreTrack: (uri) => {
      if (!playlist) return;
      patch({ banishedTrackUris: playlist.banishedTrackUris.filter((u) => u !== uri) });
      const restored = banished.find((t) => t.uri === uri);
      showToast(`Restored “${restored?.title ?? 'track'}”`);
    },
    remove: () => {
      if (!playlist) return;
      deletePlaylist.mutate(playlist.id);
      showToast('Playlist deleted');
    },
  };

  const effectiveUris = new Set(effective.map((t) => t.uri));
  const sourceUris = new Set(playlist?.sourceUris ?? []);

  // Small list (≤14); computed each render so "added" flags stay in sync.
  const results: EditorSearchResult[] = [
    ...search.results.sources.map<EditorSearchResult>((s) => ({
      uri: s.uri,
      kind: 'playlist',
      title: s.name,
      sub: `${s.owner} · ${s.trackCount} tracks`,
      added: sourceUris.has(s.uri),
      onAdd: () => void actions.addSource(s),
    })),
    ...search.results.tracks.map<EditorSearchResult>((t) => ({
      uri: t.uri,
      kind: 'track',
      title: t.title,
      sub: t.artist,
      added: effectiveUris.has(t.uri),
      onAdd: () => actions.addTrack(t),
    })),
  ];

  return {
    sources: sourcesQuery.data ?? [],
    active,
    banished,
    results,
    searchActive: search.isActive,
    isSearching: search.isSearching,
    noResults: search.isActive && !search.isSearching && results.length === 0,
    isLoading: sourcesQuery.isLoading || tracksQuery.isLoading,
    actions,
  };
};
