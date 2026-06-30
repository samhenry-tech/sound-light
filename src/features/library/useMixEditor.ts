/** View-model for the Library detail editor of a single mix. */
import { useMemo } from 'react';

import { useDeleteMix, useUpdateMix } from '~api/hooks';
import { useMusicSearch } from '~music/hooks/useMusicSearch';
import { useResolvedSources, useResolvedTracks } from '~music/hooks/useResolvedTracks';
import type { MusicSource, MusicTrack, ResolvedSource } from '~music/types';
import type { Mix } from '~shared/contract';
import { useUiStore } from '~stores/uiStore';
import type { Atmosphere } from '~theme/atmosphere';

import { effectiveTracks, splitByBanished, type TrackWithOrigin } from './mixTracks';

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
  addSource: (source: MusicSource) => void;
  removeSource: (uri: string) => void;
  addTrack: (track: MusicTrack) => void;
  removeTrack: (uri: string) => void;
  restoreTrack: (uri: string) => void;
  remove: () => void;
}

export interface MixEditorModel {
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

export function useMixEditor(mix: Mix | undefined): MixEditorModel {
  const updateMix = useUpdateMix();
  const deleteMix = useDeleteMix();
  const editorQuery = useUiStore((s) => s.editorQuery);
  const showToast = useUiStore((s) => s.showToast);

  const sourcesQuery = useResolvedSources(mix?.sourceUris ?? []);
  const tracksQuery = useResolvedTracks(mix?.trackUris ?? []);
  const search = useMusicSearch(editorQuery);

  const effective = useMemo(
    () => effectiveTracks(sourcesQuery.data ?? [], tracksQuery.data ?? []),
    [sourcesQuery.data, tracksQuery.data],
  );
  const { active, banished } = useMemo(
    () => splitByBanished(effective, mix?.banishedTrackUris ?? []),
    [effective, mix?.banishedTrackUris],
  );

  const patch = (input: Parameters<typeof updateMix.mutate>[0]['input']) => {
    if (mix) updateMix.mutate({ id: mix.id, input });
  };

  const actions: EditorActions = {
    setLocation: (location) => patch({ location }),
    setAtmosphere: (atmosphere) => patch({ atmosphere }),
    addSource: (source) => {
      if (!mix || mix.sourceUris.includes(source.uri)) return;
      patch({ sourceUris: [...mix.sourceUris, source.uri] });
      showToast(`Added “${source.name}”`);
    },
    removeSource: (uri) => {
      if (!mix) return;
      patch({ sourceUris: mix.sourceUris.filter((u) => u !== uri) });
    },
    addTrack: (track) => {
      if (!mix || effective.some((t) => t.uri === track.uri)) return;
      patch({ trackUris: [...mix.trackUris, track.uri] });
      showToast(`Added “${track.title}”`);
    },
    removeTrack: (uri) => {
      if (!mix) return;
      patch({ trackUris: mix.trackUris.filter((u) => u !== uri) });
    },
    restoreTrack: (uri) => {
      if (!mix) return;
      patch({ banishedTrackUris: mix.banishedTrackUris.filter((u) => u !== uri) });
      const restored = banished.find((t) => t.uri === uri);
      showToast(`Restored “${restored?.title ?? 'track'}”`);
    },
    remove: () => {
      if (!mix) return;
      deleteMix.mutate(mix.id);
      showToast('Mix deleted');
    },
  };

  const effectiveUris = new Set(effective.map((t) => t.uri));
  const sourceUris = new Set(mix?.sourceUris ?? []);

  // Small list (≤14); computed each render so "added" flags stay in sync.
  const results: EditorSearchResult[] = [
    ...search.results.sources.map<EditorSearchResult>((s) => ({
      uri: s.uri,
      kind: 'playlist',
      title: s.name,
      sub: `${s.owner} · ${s.trackCount} tracks`,
      added: sourceUris.has(s.uri),
      onAdd: () => actions.addSource(s),
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
}
