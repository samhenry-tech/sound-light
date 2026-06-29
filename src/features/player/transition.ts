import type { MusicPlayer, MusicTrack } from '@/music';

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
 * Start a track with a fade-in to `target` volume over `fadeMs`. This is the
 * single-stream approximation of a crossfade (the Web Playback SDK can't overlap
 * two tracks); it keeps switches smooth without delaying audio.
 */
export async function transitionTo(
  player: MusicPlayer,
  track: MusicTrack,
  target: number,
  fadeMs: number,
): Promise<void> {
  if (fadeMs <= 0) {
    await player.playTrack(track);
    await player.setVolume(target);
    return;
  }
  await player.setVolume(0);
  await player.playTrack(track);
  await rampVolume(player, 0, target, fadeMs);
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
