import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import { usePlaylists, useUpdatePlaylist } from '~/api/hooks';
import { buildQueue, effectiveTracks } from '~/features/library/playlistTracks';
import type { Playlist } from '~/models/playlist';
import { musicKeys } from '~/music-providers/hooks/queryKeys';
import type { MusicPlayer } from '~/music-providers/models/MusicPlayer';
import type { MusicTrack } from '~/music-providers/models/MusicTrack';
import { useMusicProvider } from '~/music-providers/MusicProviderContext';
import { usePlayerStore } from '~/stores/playerStore';
import { useSettingsStore } from '~/stores/settingsStore';
import { useUiStore } from '~/stores/uiStore';
import { coverFor } from '~/theme/atmosphere';
import { playlistName } from '~/utils/formatUtils';

import { type PlayerActions, PlayerContext } from './PlayerContext';
import { transitionToTracks } from './transition';

const HOLD_MS = 700;
const FIVE_MIN = 5 * 60_000;

/**
 * Owns the imperative {@link MusicPlayer} for the session, mirrors its events
 * into the player store, and exposes the player actions to the UI. Mounted once,
 * outside the router, so music never stops when navigating.
 *
 * Playlist start sends the full track-URI array to Spotify with shuffle +
 * context-repeat enabled; Spotify advances tracks on its own. Skip / banish
 * use Spotify's next command (banish also rebuilds the context without that URI).
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
  const lastHistoryUriRef = useRef<string | null>(null);

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

  const playContext = useCallback(
    async (tracks: readonly MusicTrack[], playlistLabel: string, fadeOut: boolean) => {
      const player = playerRef.current;
      if (!player || tracks.length === 0) return;
      await transitionToTracks(
        player,
        tracks,
        targetVolume(),
        useSettingsStore.getState().crossfadeMs,
        fadeOut,
        { shuffle: true, repeat: 'context' },
        () => {
          const first = tracks[0];
          if (!first) return;
          const store = usePlayerStore.getState();
          // Optimistic now-playing until the SDK reports the shuffled first track.
          store.setCurrent(first);
          lastHistoryUriRef.current = first.uri;
          store.pushHistory({ track: first, playlistName: playlistLabel, at: Date.now() });
        },
      );
    },
    [],
  );

  const selectPlaylist = useCallback(
    async (playlist: Playlist) => {
      const wasPlaying = Boolean(usePlayerStore.getState().current);
      const effective = await resolveEffective(playlist);
      effectiveRef.current = effective;
      const queue = buildQueue(effective, playlist.banishedTrackUris);
      const label = playlistName(playlist.location, playlist.atmosphere);
      usePlayerStore.getState().startPlaylist({
        playingPlaylistId: playlist.id,
        playlistName: label,
        atmosphere: playlist.atmosphere,
        coverBg: coverFor(playlist.atmosphere),
        current: queue[0] ?? null,
        queue: queue.slice(1),
      });
      useUiStore.getState().showToast(`Crossfading into ${label}`);
      if (queue.length > 0) await playContext(queue, label, wasPlaying);
      else useUiStore.getState().showToast('No tracks left in this playlist');
    },
    [resolveEffective, playContext],
  );

  const skipToNext = useCallback(async (toast?: string) => {
    const player = playerRef.current;
    if (!player || !usePlayerStore.getState().current) return;
    try {
      await player.skipToNext();
      if (toast) useUiStore.getState().showToast(toast);
    } catch {
      useUiStore.getState().showToast('Couldn’t skip to the next track');
    }
  }, []);

  const banishCurrent = useCallback(() => {
    const store = usePlayerStore.getState();
    const current = store.current;
    const playlistId = store.playingPlaylistId;
    if (!current || !playlistId) return;
    const playlist = playlistsRef.current.find((m) => m.id === playlistId);
    const banishedTrackUris = [...(playlist?.banishedTrackUris ?? []), current.uri];
    updatePlaylist.mutate({ id: playlistId, input: { banishedTrackUris } });

    // Rebuild the Spotify context without the banished track so shuffle/repeat
    // can't bring it back during this session.
    const remaining = buildQueue(effectiveRef.current, banishedTrackUris);
    store.setQueue(remaining.slice(1));
    useUiStore.getState().showToast(`Banished “${current.title}” from ${store.playlistName}`);
    if (remaining.length === 0) {
      useUiStore.getState().showToast('No tracks left in this playlist');
      void playerRef.current?.pause();
      return;
    }
    void playContext(remaining, store.playlistName, true);
  }, [playContext, updatePlaylist]);

  const skip = useCallback(() => void skipToNext('Next track'), [skipToNext]);
  const next = useCallback(() => void skipToNext(), [skipToNext]);

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
  // Spotify owns track-to-track advancement inside a shuffled/repeating context,
  // so we do not call skip on ended — only sync now-playing + history.
  useEffect(() => {
    const player = provider.createPlayer();
    playerRef.current = player;
    const unsubState = player.subscribe((state) => {
      usePlayerStore.getState().applyPlayback(state);
      const uri = state.track?.uri;
      if (!uri || !state.isPlaying) return;
      if (uri === lastHistoryUriRef.current) return;
      lastHistoryUriRef.current = uri;
      const store = usePlayerStore.getState();
      if (!store.playingPlaylistId || !state.track) return;
      store.pushHistory({
        track: state.track,
        playlistName: store.playlistName,
        at: Date.now(),
      });
    });
    void player.setVolume(targetVolume());
    return () => {
      unsubState();
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
