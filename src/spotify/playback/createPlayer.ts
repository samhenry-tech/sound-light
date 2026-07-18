import type { MusicPlayer } from '~music/types';

import { createWebPlaybackPlayer } from './webPlaybackPlayer';

/** Build the active player implementation (Spotify Web Playback SDK). */
export const createPlayer = (): MusicPlayer => {
  return createWebPlaybackPlayer();
};
