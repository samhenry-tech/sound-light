import { IS_SPOTIFY_MOCK } from '../config';
import { createMockPlayer } from './mockPlayer';
import { createWebPlaybackPlayer } from './webPlaybackPlayer';
import type { AtmosPlayer } from './types';

/** Build the active player implementation for the current environment. */
export function createPlayer(): AtmosPlayer {
  return IS_SPOTIFY_MOCK ? createMockPlayer() : createWebPlaybackPlayer();
}
