import { describe, expect, it } from 'vitest';

import type { MusicPlayer, MusicTrack } from '~music/types';

import { transitionTo } from './transition';

const track = (uri: string): MusicTrack => ({
  id: uri,
  uri,
  title: uri,
  artist: 'Artist',
  durationMs: 200_000,
});

/** A fake player that records the order of playback + volume operations. */
const fakePlayer = () => {
  const events: string[] = [];
  const player: MusicPlayer = {
    playTrack: (t) => {
      events.push(`play:${t.uri}`);
      return Promise.resolve();
    },
    setVolume: (v) => {
      events.push(`vol:${v.toFixed(2)}`);
      return Promise.resolve();
    },
    resume: () => Promise.resolve(),
    pause: () => Promise.resolve(),
    seek: () => Promise.resolve(),
    subscribe: () => () => {},
    onEnded: () => () => {},
    destroy: () => {},
  };
  return { player, events };
};

describe('transitionTo (single-stream crossfade)', () => {
  it('fades the outgoing track to zero, swaps, then fades the incoming in', async () => {
    const { player, events } = fakePlayer();
    await transitionTo(player, track('t2'), 0.8, 200, true);

    const swapAt = events.indexOf('play:t2');
    expect(swapAt).toBeGreaterThan(0);
    // The outgoing track is silent right before the swap (no audible cut).
    expect(events[swapAt - 1]).toBe('vol:0.00');
    // It begins by lowering from the current target, and ends back at target.
    expect(events[0]).toBe('vol:0.40');
    expect(events.at(-1)).toBe('vol:0.80');
  });

  it('only fades in for the first track (no fade-out dead air)', async () => {
    const { player, events } = fakePlayer();
    await transitionTo(player, track('t1'), 1, 200, false);

    // Starts at silence, plays immediately, then ramps up — no descent first.
    expect(events[0]).toBe('vol:0.00');
    expect(events[1]).toBe('play:t1');
    expect(events.at(-1)).toBe('vol:1.00');
  });

  it('hard-cuts when crossfade is disabled', async () => {
    const { player, events } = fakePlayer();
    await transitionTo(player, track('t1'), 0.6, 0, true);
    expect(events).toEqual(['play:t1', 'vol:0.60']);
  });
});
