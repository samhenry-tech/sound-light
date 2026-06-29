import { beforeEach, describe, expect, it } from 'vitest';
import type { MusicTrack } from '@/music';
import { usePlayerStore } from './playerStore';

const track = (uri: string): MusicTrack => ({
  id: uri,
  uri,
  title: uri,
  artist: 'Artist',
  durationMs: 200_000,
});

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('starts a mix and dequeues in order', () => {
    const store = usePlayerStore.getState();
    store.startMix({
      playingMixId: 'mix-1',
      mixName: 'Tavern – Ambient',
      atmosphere: 'ambient',
      coverBg: 'grad',
      current: track('t1'),
      queue: [track('t2'), track('t3')],
    });

    expect(usePlayerStore.getState().playingMixId).toBe('mix-1');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().dequeue()?.uri).toBe('t2');
    expect(usePlayerStore.getState().dequeue()?.uri).toBe('t3');
    expect(usePlayerStore.getState().dequeue()).toBeUndefined();
  });

  it('clamps volume and clears mute on change', () => {
    const store = usePlayerStore.getState();
    store.toggleMute();
    expect(usePlayerStore.getState().muted).toBe(true);
    store.setVolume(1.5);
    expect(usePlayerStore.getState().volume).toBe(1);
    expect(usePlayerStore.getState().muted).toBe(false);
  });

  it('caps history length and prepends newest first', () => {
    const store = usePlayerStore.getState();
    store.pushHistory({ track: track('a'), mixName: 'M', at: 1 });
    store.pushHistory({ track: track('b'), mixName: 'M', at: 2 });
    expect(usePlayerStore.getState().history[0]?.track.uri).toBe('b');
  });
});
