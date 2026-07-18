import type { MusicPlayer } from '~music/types';

import { IS_SPOTIFY_MOCK } from '../config';
import { createMockPlayer } from './mockPlayer';
import { createWebPlaybackPlayer } from './webPlaybackPlayer';

/** Build the active player implementation for the current environment. */
export const createPlayer = (): MusicPlayer => {
  return IS_SPOTIFY_MOCK ? createMockPlayer() : createWebPlaybackPlayer();
};
