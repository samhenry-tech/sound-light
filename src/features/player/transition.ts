import type { MusicPlayer, MusicTrack } from '~music/types';

const STEP_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rampVolume(
  player: MusicPlayer,
  from: number,
  to: number,
  ms: number,
): Promise<void> {
  const steps = Math.max(1, Math.round(ms / STEP_MS));
  for (let i = 1; i <= steps; i++) {
    await player.setVolume(from + (to - from) * (i / steps));
    if (i < steps) await sleep(STEP_MS);
  }
}

/**
 * Crossfade into `track`.
 *
 * The Spotify Web Playback SDK can't overlap two tracks (one stream, one active
 * Connect device per account) and `play({uris})` hard-cuts, so a true
 * overlapping crossfade is impossible. We instead roll our own **single-stream
 * crossfade**: fade the outgoing track down, swap, then fade the incoming up —
 * a smooth, click-free transition (used for skip / banish / mix switch).
 *
 * @param fadeOut when true (something is already playing) the outgoing track is
 *   faded out first; when false (first track of a session) we skip straight to a
 *   fade-in so there's no dead air.
 * @param onSwap fired the instant the new track starts (start of the fade-in),
 *   so the now-playing UI flips exactly when the audio does.
 */
export async function transitionTo(
  player: MusicPlayer,
  track: MusicTrack,
  target: number,
  crossfadeMs: number,
  fadeOut = false,
  onSwap?: () => void,
): Promise<void> {
  if (crossfadeMs <= 0) {
    await player.playTrack(track);
    onSwap?.();
    await player.setVolume(target);
    return;
  }

  if (fadeOut) {
    const half = crossfadeMs / 2;
    await rampVolume(player, target, 0, half); // outgoing fades out
    await player.playTrack(track); // swap at silence (no audible cut)
    onSwap?.();
    await rampVolume(player, 0, target, half); // incoming fades in
    return;
  }

  await player.setVolume(0);
  await player.playTrack(track);
  onSwap?.();
  await rampVolume(player, 0, target, crossfadeMs);
}

/** Gently fade out, pause, then restore volume so the next resume isn't silent. */
export async function fadeOutAndPause(
  player: MusicPlayer,
  fromVolume: number,
  fadeMs: number,
): Promise<void> {
  await rampVolume(player, fromVolume, 0, fadeMs);
  await player.pause();
  await player.setVolume(fromVolume);
}
