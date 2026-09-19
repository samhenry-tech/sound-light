import type { MusicPlayer, PlayTracksOptions } from '~/music-providers/models/MusicPlayer';
import type { MusicTrack } from '~/music-providers/models/MusicTrack';

const STEP_MS = 50;

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const rampVolume = async (
  player: MusicPlayer,
  from: number,
  to: number,
  ms: number,
): Promise<void> => {
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 1; i <= steps; i++) {
    await player.setVolume(from + (to - from) * (i / steps));
    if (i < steps) await sleep(STEP_MS);
  }
};

/**
 * Crossfade into a multi-track Spotify context (full URI array with shuffle /
 * repeat). Same single-stream fade as {@link transitionTo}: the SDK can't
 * overlap two streams, so we fade out → swap context → fade in.
 */
export const transitionToTracks = async (
  player: MusicPlayer,
  tracks: readonly MusicTrack[],
  target: number,
  crossfadeMs: number,
  fadeOut = false,
  options?: PlayTracksOptions,
  onSwap?: () => void,
): Promise<void> => {
  if (tracks.length === 0) return;

  const start = async () => {
    await player.playTracks(tracks, options);
    onSwap?.();
  };

  if (crossfadeMs <= 0) {
    await start();
    await player.setVolume(target);
    return;
  }

  if (fadeOut) {
    const half = crossfadeMs / 2;
    await rampVolume(player, target, 0, half);
    await start();
    await rampVolume(player, 0, target, half);
    return;
  }

  await player.setVolume(0);
  await start();
  await rampVolume(player, 0, target, crossfadeMs);
};

/**
 * Crossfade into a single `track` (used for legacy single-URI swaps).
 *
 * The Spotify Web Playback SDK can't overlap two tracks (one stream, one active
 * Connect device per account) and `play({uris})` hard-cuts, so a true
 * overlapping crossfade is impossible. We instead roll our own **single-stream
 * crossfade**: fade the outgoing track down, swap, then fade the incoming up —
 * a smooth, click-free transition (used for skip / banish / playlist switch).
 *
 * @param fadeOut when true (something is already playing) the outgoing track is
 *   faded out first; when false (first track of a session) we skip straight to a
 *   fade-in so there's no dead air.
 * @param onSwap fired the instant the new track starts (start of the fade-in),
 *   so the now-playing UI flips exactly when the audio does.
 */
export const transitionTo = async (
  player: MusicPlayer,
  track: MusicTrack,
  target: number,
  crossfadeMs: number,
  fadeOut = false,
  onSwap?: () => void,
): Promise<void> => {
  await transitionToTracks(
    player,
    [track],
    target,
    crossfadeMs,
    fadeOut,
    {
      shuffle: false,
      repeat: 'off',
    },
    onSwap,
  );
};
