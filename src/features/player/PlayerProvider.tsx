import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import { usePlaylists, useUpdatePlaylist } from '~api/hooks';
import { buildQueue, effectiveTracks } from '~features/library/playlistTracks';
import { musicKeys } from '~music/hooks/queryKeys';
import { useMusicProvider } from '~music/MusicProviderContext';
import type { MusicPlayer, MusicTrack } from '~music/types';
import type { Playlist } from '~shared/contract';
import { usePlayerStore } from '~stores/playerStore';
import { useSettingsStore } from '~stores/settingsStore';
import { useUiStore } from '~stores/uiStore';
import { coverFor } from '~theme/atmosphere';
import { playlistName } from '~utils/formatUtils';

import { type PlayerActions, PlayerContext } from './PlayerContext';
import { transitionTo } from './transition';

const HOLD_MS = 700;
const FIVE_MIN = 5 * 60_000;

/**
 * Owns the imperative {@link MusicPlayer} for the session, mirrors its events
 * into the player store, and exposes the player actions to the UI. Mounted once,
 * outside the router, so music never stops when navigating.
 */
export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const provider = useMusicProvider();
  const qc = useQueryClient();
  const updatePlaylist = useUpdatePlaylist();
  const { data: playlists = [] } = usePlaylists();

  const playerRef = useRef<MusicPlayer | null>(null);
  /** Latest resolved track list for the playing playlist (for queue rebuilds). */
  const effectiveRef = useRef<MusicTrack[]>([]);
  const playlistsRef = useRef<Playlist[]>(playlists);
  playlistsRef.current = playlists;
  const holdRef = useRef<{ timer?: ReturnType<typeof setTimeout>; held: boolean }>({ held: false });

  const targetVolume = () => {
    const { muted, volume } = usePlayerStore.getState();
    return muted ? 0 : volume;
  };

  const resolveEffective = useCallback(
    async (playlist: Playlist): Promise<MusicTrack[]> => {
      const sources = await qc.fetchQuery({
        queryKey: musicKeys.sources(provider.id, playlist.sourceUris),
        queryFn: () => provider.resolveSources(playlist.sourceUris),
        staleTime: FIVE_MIN,
      });
      const tracks = await qc.fetchQuery({
        queryKey: musicKeys.tracks(provider.id, playlist.trackUris),
        queryFn: () => provider.resolveTracks(playlist.trackUris),
        staleTime: FIVE_MIN,
      });
      return effectiveTracks(sources, tracks);
    },
    [qc, provider],
  );

  const play = useCallback(async (track: MusicTrack, playlistLabel: string, fadeOut: boolean) => {
    const player = playerRef.current;
    if (!player) return;
    await transitionTo(
      player,
      track,
      targetVolume(),
      useSettingsStore.getState().crossfadeMs,
      fadeOut,
      () => {
        // Flip the now-playing UI at the swap point (start of the fade-in).
        const store = usePlayerStore.getState();
        store.setCurrent(track);
        store.pushHistory({ track, playlistName: playlistLabel, at: Date.now() });
      },
    );
  }, []);

  const selectPlaylist = useCallback(
    async (playlist: Playlist) => {
      // Crossfade out the previous playlist only if something is already playing.
      const wasPlaying = Boolean(usePlayerStore.getState().current);
      const effective = await resolveEffective(playlist);
      effectiveRef.current = effective;
      const queue = buildQueue(effective, playlist.banishedTrackUris);
      const [first, ...rest] = queue;
      const label = playlistName(playlist.location, playlist.atmosphere);
      usePlayerStore.getState().startPlaylist({
        playingPlaylistId: playlist.id,
        playlistName: label,
        atmosphere: playlist.atmosphere,
        coverBg: coverFor(playlist.atmosphere),
        current: first ?? null,
        queue: rest,
      });
      useUiStore.getState().showToast(`Crossfading into ${label}`);
      if (first) await play(first, label, wasPlaying);
    },
    [resolveEffective, play],
  );

  const advance = useCallback(
    async (opts?: { avoidUri?: string; toast?: string }) => {
      const store = usePlayerStore.getState();
      const playlistId = store.playingPlaylistId;
      if (!playlistId) return;
      const playlist = playlistsRef.current.find((m) => m.id === playlistId);
      const banished = playlist?.banishedTrackUris ?? [];

      let next = store.dequeue();
      if (!next) {
        let reshuffled = buildQueue(effectiveRef.current, banished);
        if (opts?.avoidUri && reshuffled.length > 1) {
          reshuffled = reshuffled.filter((t) => t.uri !== opts.avoidUri);
        }
        next = reshuffled.shift();
        usePlayerStore.getState().setQueue(reshuffled);
      }
      if (!next) {
        useUiStore.getState().showToast('No tracks left in this playlist');
        return;
      }
      // Advancing within a playlist (skip / banish / track-ended) always crossfades.
      await play(next, store.playlistName, true);
      if (opts?.toast) useUiStore.getState().showToast(opts.toast);
    },
    [play],
  );

  // Keep the latest `advance` reachable from the once-registered onEnded handler.
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  const banishCurrent = useCallback(() => {
    const store = usePlayerStore.getState();
    const current = store.current;
    const playlistId = store.playingPlaylistId;
    if (!current || !playlistId) return;
    const playlist = playlistsRef.current.find((m) => m.id === playlistId);
    const banishedTrackUris = [...(playlist?.banishedTrackUris ?? []), current.uri];
    updatePlaylist.mutate({ id: playlistId, input: { banishedTrackUris } });
    store.setQueue(store.queue.filter((t) => t.uri !== current.uri));
    useUiStore.getState().showToast(`Banished “${current.title}” from ${store.playlistName}`);
    void advance({ avoidUri: current.uri });
  }, [advance, updatePlaylist]);

  const skip = useCallback(
    () =>
      void advance({
        avoidUri: usePlayerStore.getState().current?.uri,
        toast: 'Faded out — next track',
      }),
    [advance],
  );
  const next = useCallback(
    () => void advance({ avoidUri: usePlayerStore.getState().current?.uri }),
    [advance],
  );

  const startHold = useCallback(() => {
    holdRef.current.held = false;
    usePlayerStore.getState().setHolding(true);
    clearTimeout(holdRef.current.timer);
    holdRef.current.timer = setTimeout(() => {
      holdRef.current.held = true;
      usePlayerStore.getState().setHolding(false);
      banishCurrent();
    }, HOLD_MS);
  }, [banishCurrent]);

  const endHold = useCallback(() => {
    clearTimeout(holdRef.current.timer);
    if (!holdRef.current.held) {
      usePlayerStore.getState().setHolding(false);
      skip();
    }
  }, [skip]);

  const cancelHold = useCallback(() => {
    clearTimeout(holdRef.current.timer);
    if (!holdRef.current.held) usePlayerStore.getState().setHolding(false);
  }, []);

  const like = useCallback(() => {
    const { current, playlistName: label } = usePlayerStore.getState();
    if (!current) return;
    useUiStore.getState().showToast(`Good fit — kept “${current.title}” in ${label}`);
  }, []);

  const togglePlay = useCallback(() => {
    const store = usePlayerStore.getState();
    if (!store.current || !playerRef.current) return;
    void (store.isPlaying ? playerRef.current.pause() : playerRef.current.resume());
  }, []);

  const seek = useCallback((positionMs: number) => {
    void playerRef.current?.seek(positionMs);
  }, []);

  const setVolume = useCallback((volume: number) => {
    usePlayerStore.getState().setVolume(volume);
    void playerRef.current?.setVolume(volume);
  }, []);

  const toggleMute = useCallback(() => {
    usePlayerStore.getState().toggleMute();
    const { muted, volume } = usePlayerStore.getState();
    void playerRef.current?.setVolume(muted ? 0 : volume);
  }, []);

  const banish = useCallback(() => banishCurrent(), [banishCurrent]);

  // Create the player once, mirror its events, tear down on unmount.
  useEffect(() => {
    const player = provider.createPlayer();
    playerRef.current = player;
    const unsubState = player.subscribe((state) => usePlayerStore.getState().applyPlayback(state));
    const unsubEnded = player.onEnded(() => void advanceRef.current());
    void player.setVolume(targetVolume());
    return () => {
      unsubState();
      unsubEnded();
      player.destroy();
      playerRef.current = null;
    };
  }, [provider]);

  const actions = useMemo<PlayerActions>(
    () => ({
      selectPlaylist,
      togglePlay,
      skip,
      next,
      like,
      banish,
      startHold,
      endHold,
      cancelHold,
      seek,
      setVolume,
      toggleMute,
    }),
    [
      selectPlaylist,
      togglePlay,
      skip,
      next,
      like,
      banish,
      startHold,
      endHold,
      cancelHold,
      seek,
      setVolume,
      toggleMute,
    ],
  );

  return <PlayerContext.Provider value={actions}>{children}</PlayerContext.Provider>;
};
