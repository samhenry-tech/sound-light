import { describe, expect, it } from 'vitest';

import type { MusicTrack, ResolvedSource } from '~music/types';

import { buildQueue, effectiveTracks, pickFrom, splitByBanished } from './playlistTracks';

const track = (uri: string, title = uri): MusicTrack => {
  return { id: uri, uri, title, artist: 'Artist', durationMs: 200_000 };
};

const source = (uri: string, tracks: MusicTrack[]): ResolvedSource => {
  return {
    id: uri,
    uri,
    kind: 'playlist',
    name: `Source ${uri}`,
    owner: 'Owner',
    trackCount: tracks.length,
    tracks,
  };
};

describe('effectiveTracks', () => {
  it('lists source tracks (with origin) then individually-added, deduped by uri', () => {
    const s = source('spotify:playlist:a', [track('t1'), track('t2')]);
    const individual = [track('t2'), track('t3')]; // t2 duplicates a source track

    const result = effectiveTracks([s], individual);

    expect(result.map((t) => t.uri)).toEqual(['t1', 't2', 't3']);
    expect(result[0]).toMatchObject({
      uri: 't1',
      origin: 'Source spotify:playlist:a',
      fromSource: true,
    });
    expect(result[2]).toMatchObject({ uri: 't3', origin: 'Added directly', fromSource: false });
  });
});

describe('splitByBanished', () => {
  it('separates active and banished tracks', () => {
    const tracks = [track('t1'), track('t2'), track('t3')];
    const { active, banished } = splitByBanished(tracks, ['t2']);
    expect(active.map((t) => t.uri)).toEqual(['t1', 't3']);
    expect(banished.map((t) => t.uri)).toEqual(['t2']);
  });
});

describe('buildQueue', () => {
  it('excludes banished tracks', () => {
    const tracks = [track('t1'), track('t2'), track('t3')];
    const queue = buildQueue(tracks, ['t2']);
    expect(queue.map((t) => t.uri).sort()).toEqual(['t1', 't3']);
  });
});

describe('pickFrom', () => {
  it('never returns a banished track when alternatives exist', () => {
    const tracks = [track('t1'), track('t2')];
    for (let i = 0; i < 50; i++) {
      expect(pickFrom(tracks, ['t1'])?.uri).toBe('t2');
    }
  });

  it('avoids an immediate repeat when possible', () => {
    const tracks = [track('t1'), track('t2')];
    for (let i = 0; i < 50; i++) {
      expect(pickFrom(tracks, [], 't1')?.uri).toBe('t2');
    }
  });

  it('falls back to the avoided track if it is the only option', () => {
    expect(pickFrom([track('t1')], [], 't1')?.uri).toBe('t1');
  });

  it('returns undefined when there is nothing to play', () => {
    expect(pickFrom([], [])).toBeUndefined();
  });
});
