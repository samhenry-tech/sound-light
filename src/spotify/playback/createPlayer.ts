import { IS_SPOTIFY_MOCK } from '../config';
import { createMockPlayer } from './mockPlayer';
import type { AtmosPlayer } from './types';
import { createWebPlaybackPlayer } from './webPlaybackPlayer';

/** Build the active player implementation for the current environment. */
export const createPlayer = (): AtmosPlayer => {
  return IS_SPOTIFY_MOCK ? createMockPlayer() : createWebPlaybackPlayer();
};
