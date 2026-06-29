import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMixes, useUpdateMix } from '@/api';
import { musicKeys, useMusicProvider, type MusicPlayer, type MusicTrack } from '@/music';
import type { Mix } from '@/shared/contract';
import { usePlayerStore } from '@/stores/playerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { coverFor } from '@/theme/atmosphere';
import { mixName } from '@/lib/format';
import { buildQueue, effectiveTracks } from '@/features/library/mixTracks';
import { PlayerContext, type PlayerActions } from './PlayerContext';
import { transitionTo } from './transition';

const HOLD_MS = 700;
const FIVE_MIN = 5 * 60_000;

/**
 * Owns the imperative {@link MusicPlayer} for the session, mirrors its events
 * into the player store, and exposes the player actions to the UI. Mounted once,
 * outside the router, so music never stops when navigating.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const provider = useMusicProvider();
  const qc = useQueryClient();
  const updateMix = useUpdateMix();
  const { data: mixes = [] } = useMixes();

  const playerRef = useRef<MusicPlayer | null>(null);
  /** Latest resolved track list for the playing mix (for queue rebuilds). */
  const effectiveRef = useRef<MusicTrack[]>([]);
  const mixesRef = useRef<Mix[]>(mixes);
  mixesRef.current = mixes;
  const holdRef = useRef<{ timer?: ReturnType<typeof setTimeout>; held: boolean }>({ held: false });

  const targetVolume = () => {
    const { muted, volume } = usePlayerStore.getState();
    return muted ? 0 : volume;
  };

  const resolveEffective = useCallback(
    async (mix: Mix): Promise<MusicTrack[]> => {
      const sources = await qc.fetchQuery({
        queryKey: musicKeys.sources(provider.id, mix.sourceUris),
        queryFn: () => provider.resolveSources(mix.sourceUris),
        staleTime: FIVE_MIN,
      });
      const tracks = await qc.fetchQuery({
        queryKey: musicKeys.tracks(provider.id, mix.trackUris),
        queryFn: () => provider.resolveTracks(mix.trackUris),
        staleTime: FIVE_MIN,
      });
      return effectiveTracks(sources, tracks);
    },
    [qc, provider],
  );

  const play = useCallback(async (track: MusicTrack, mixLabel: string) => {
    const player = playerRef.current;
    if (!player) return;
    await transitionTo(player, track, targetVolume(), useSettingsStore.getState().crossfadeMs);
    const store = usePlayerStore.getState();
    store.setCurrent(track);
    store.pushHistory({ track, mixName: mixLabel, at: Date.now() });
  }, []);

  const selectMix = useCallback(
    async (mix: Mix) => {
      const effective = await resolveEffective(mix);
      effectiveRef.current = effective;
      const queue = buildQueue(effective, mix.banishedTrackUris);
      const [first, ...rest] = queue;
      const label = mixName(mix.location, mix.atmosphere);
      usePlayerStore.getState().startMix({
        playingMixId: mix.id,
        mixName: label,
        atmosphere: mix.atmosphere,
        coverBg: coverFor(mix.atmosphere),
        current: first ?? null,
        queue: rest,
      });
      useUiStore.getState().showToast(`Crossfading into ${label}`);
      if (first) await play(first, label);
    },
    [resolveEffective, play],
  );

  const advance = useCallback(
    async (opts?: { avoidUri?: string; toast?: string }) => {
      const store = usePlayerStore.getState();
      const mixId = store.playingMixId;
      if (!mixId) return;
      const mix = mixesRef.current.find((m) => m.id === mixId);
      const banished = mix?.banishedTrackUris ?? [];

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
        useUiStore.getState().showToast('No tracks left in this mix');
        return;
      }
      await play(next, store.mixName);
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
    const mixId = store.playingMixId;
    if (!current || !mixId) return;
    const mix = mixesRef.current.find((m) => m.id === mixId);
    const banishedTrackUris = [...(mix?.banishedTrackUris ?? []), current.uri];
    updateMix.mutate({ id: mixId, input: { banishedTrackUris } });
    store.setQueue(store.queue.filter((t) => t.uri !== current.uri));
    useUiStore.getState().showToast(`Banished “${current.title}” from ${store.mixName}`);
    void advance({ avoidUri: current.uri });
  }, [advance, updateMix]);

  const skip = useCallback(
    () => void advance({ avoidUri: usePlayerStore.getState().current?.uri, toast: 'Faded out — next track' }),
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
    const { current, mixName: label } = usePlayerStore.getState();
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

  const panic = useCallback(() => {
    const { panicMixId } = useSettingsStore.getState();
    const list = mixesRef.current;
    const target =
      (panicMixId ? list.find((m) => m.id === panicMixId) : undefined) ??
      list.find((m) => m.atmosphere === 'battle' && m.location === 'General') ??
      list.find((m) => m.atmosphere === 'battle');
    if (!target) {
      useUiStore.getState().showToast('No combat mix to panic to');
      return;
    }
    void selectMix(target);
    useUiStore.getState().showToast('⚔️ Combat!');
  }, [selectMix]);

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
      selectMix,
      togglePlay,
      skip,
      next,
      like,
      startHold,
      endHold,
      cancelHold,
      seek,
      setVolume,
      toggleMute,
      panic,
    }),
    [selectMix, togglePlay, skip, next, like, startHold, endHold, cancelHold, seek, setVolume, toggleMute, panic],
  );

  return <PlayerContext.Provider value={actions}>{children}</PlayerContext.Provider>;
}
