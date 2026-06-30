/**
 * Pure domain logic for turning a mix's sources + tracks into a play queue.
 * Ported from the prototype's `effectiveTracks` / `pickFrom`, but keyed by URI
 * instead of title. Kept pure (no React, no I/O) so it's trivially testable.
 */
import { sample, shuffle } from '~lib/format';
import type { MusicTrack, ResolvedSource } from '~music/types';

export interface TrackWithOrigin extends MusicTrack {
  /** Human-readable provenance shown in the editor ("Fireside Ambience"). */
  origin: string;
  /** True if the track came from a locked source (can't be removed directly). */
  fromSource: boolean;
}

/**
 * The effective track list for a mix: every source's tracks (deduped, in order)
 * followed by individually-added tracks, deduped by URI across both.
 */
export function effectiveTracks(
  sources: readonly ResolvedSource[],
  individual: readonly MusicTrack[],
): TrackWithOrigin[] {
  const seen = new Set<string>();
  const out: TrackWithOrigin[] = [];

  for (const source of sources) {
    for (const track of source.tracks) {
      if (seen.has(track.uri)) continue;
      seen.add(track.uri);
      out.push({ ...track, origin: source.name, fromSource: true });
    }
  }
  for (const track of individual) {
    if (seen.has(track.uri)) continue;
    seen.add(track.uri);
    out.push({ ...track, origin: 'Added directly', fromSource: false });
  }
  return out;
}

export function splitByBanished<T extends MusicTrack>(
  tracks: readonly T[],
  banishedUris: readonly string[],
): { active: T[]; banished: T[] } {
  const banned = new Set(banishedUris);
  const active: T[] = [];
  const banished: T[] = [];
  for (const track of tracks) (banned.has(track.uri) ? banished : active).push(track);
  return { active, banished };
}

/** A shuffled candidate queue: effective tracks minus the banished set. */
export function buildQueue(
  tracks: readonly MusicTrack[],
  banishedUris: readonly string[],
): MusicTrack[] {
  const banned = new Set(banishedUris);
  return shuffle(tracks.filter((t) => !banned.has(t.uri)));
}

/**
 * Pick one track at random, honoring the banished set and avoiding an immediate
 * repeat where possible — the prototype's `pickFrom`.
 */
export function pickFrom(
  tracks: readonly MusicTrack[],
  banishedUris: readonly string[],
  avoidUri?: string,
): MusicTrack | undefined {
  const banned = new Set(banishedUris);
  let pool = tracks.filter((t) => !banned.has(t.uri));
  if (avoidUri && pool.length > 1) pool = pool.filter((t) => t.uri !== avoidUri);
  if (pool.length === 0) pool = tracks.slice();
  return sample(pool);
}
