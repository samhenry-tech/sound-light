import { describe, expect, it } from 'vitest';
import { formatMs, formatTime, mixName, sample, shuffle } from './format';

describe('format helpers', () => {
  it('builds a mix name with an en-dash', () => {
    expect(mixName('Tavern', 'battle')).toBe('Tavern – Battle');
  });

  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(330)).toBe('5:30');
  });

  it('formats milliseconds', () => {
    expect(formatMs(65_000)).toBe('1:05');
  });

  it('clamps negative time to 0:00', () => {
    expect(formatTime(-10)).toBe('0:00');
  });

  it('shuffles without losing or duplicating elements', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(out).toHaveLength(5);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]); // input not mutated
  });

  it('samples undefined from an empty list', () => {
    expect(sample([])).toBeUndefined();
    expect([1]).toContain(sample([1]));
  });
});
