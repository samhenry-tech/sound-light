/**
 * Real player backed by the Spotify Web Playback SDK. Registers the browser as
 * a Spotify Connect device and drives playback through the Web API.
 * Requires a linked Spotify **Premium** account.
 */
import { APP_NAME } from '~/constants';
import type { MusicPlayer, PlayTracksOptions } from '~/music-providers/models/MusicPlayer';
import type { MusicTrack } from '~/music-providers/models/MusicTrack';
import type { PlaybackState } from '~/music-providers/models/PlaybackState';

import { getValidAccessToken } from '../auth/spotifyAuth';
import { SPOTIFY_ENDPOINTS } from '../config';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';
const NEAR_END_MS = 2000;
/** Spotify's Play endpoint accepts at most this many URIs in one request. */
const PLAY_URIS_LIMIT = 100;

let sdkPromise: Promise<void> | null = null;

const loadSdk = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    document.body.appendChild(script);
  });
  return sdkPromise;
};

export const createWebPlaybackPlayer = (): MusicPlayer => {
  const stateListeners = new Set<(state: PlaybackState) => void>();
  const endedListeners = new Set<() => void>();

  let deviceId: string | null = null;
  let player: SpotifyPlayerInstance | null = null;
  let wasNearEnd = false;
  let current: MusicTrack | null = null;
  /** True while a multi-track context is active (Spotify advances on its own). */
  let contextPlayback = false;

  const ready = (async () => {
    await loadSdk();
    const Player = window.Spotify?.Player;
    if (!Player) throw new Error('Spotify Web Playback SDK unavailable.');

    player = new Player({
      name: APP_NAME,
      volume: 0.8,
      getOAuthToken: (cb) => {
        void getValidAccessToken().then((token) => {
          if (token) cb(token);
        });
      },
    });

    player.addListener('ready', ({ device_id }) => {
      deviceId = device_id;
    });

    player.addListener('player_state_changed', (state) => {
      if (!state) return;
      const t = state.track_window.current_track;
      current = {
        uri: t.uri,
        id: t.id ?? t.uri,
        title: t.name,
        artist: t.artists.map((a) => a.name).join(', '),
        durationMs: state.duration,
        artworkUrl: t.album.images[0]?.url,
      };
      stateListeners.forEach((l) =>
        l({
          track: current,
          isPlaying: !state.paused,
          positionMs: state.position,
          durationMs: state.duration,
        }),
      );

      // Only synthesize "ended" for single-track plays. With a URI-array
      // context Spotify queues the next track itself.
      if (!contextPlayback && state.paused && state.position === 0 && wasNearEnd) {
        endedListeners.forEach((l) => l());
      }
      wasNearEnd = state.duration > 0 && state.position > state.duration - NEAR_END_MS;
    });

    await player.connect();
    return player;
  })();

  const command = async (path: string, init?: RequestInit): Promise<void> => {
    const token = await getValidAccessToken();
    if (!token) throw new Error('Spotify account is not linked.');
    const res = await fetch(`${SPOTIFY_ENDPOINTS.api}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok && res.status !== 204)
      throw new Error(`Spotify playback command failed (${res.status}).`);
  };

  const requireDevice = async (): Promise<string> => {
    await ready;
    if (!deviceId) throw new Error('Spotify device not ready yet.');
    return deviceId;
  };

  const playUris = async (
    uris: readonly string[],
    options: PlayTracksOptions = {},
  ): Promise<void> => {
    const id = await requireDevice();
    const shuffle = options.shuffle ?? true;
    const repeat = options.repeat ?? 'context';
    const capped = uris.length > PLAY_URIS_LIMIT ? uris.slice(0, PLAY_URIS_LIMIT) : [...uris];
    if (capped.length === 0) throw new Error('No tracks to play.');

    contextPlayback = capped.length > 1;
    wasNearEnd = false;

    await command(`/me/player/shuffle?state=${shuffle}&device_id=${id}`, { method: 'PUT' });
    await command(`/me/player/repeat?state=${repeat}&device_id=${id}`, { method: 'PUT' });
    await command(`/me/player/play?device_id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: capped }),
    });
  };

  return {
    async playTrack(track) {
      contextPlayback = false;
      await playUris([track.uri], { shuffle: false, repeat: 'off' });
    },
    async playTracks(tracks, options) {
      await playUris(tracks.map((t) => t.uri).filter(Boolean), options);
    },
    async skipToNext() {
      const id = await requireDevice();
      await command(`/me/player/next?device_id=${id}`, { method: 'POST' });
    },
    async skipToPrevious() {
      const id = await requireDevice();
      await command(`/me/player/previous?device_id=${id}`, { method: 'POST' });
    },
    async resume() {
      await ready;
      await player?.resume();
    },
    async pause() {
      await ready;
      await player?.pause();
    },
    async setVolume(volume) {
      await ready;
      await player?.setVolume(Math.min(1, Math.max(0, volume)));
    },
    async seek(positionMs) {
      await ready;
      await command(`/me/player/seek?position_ms=${Math.max(0, Math.round(positionMs))}`, {
        method: 'PUT',
      });
    },
    subscribe(listener) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },
    onEnded(listener) {
      endedListeners.add(listener);
      return () => endedListeners.delete(listener);
    },
    destroy() {
      player?.disconnect();
      stateListeners.clear();
      endedListeners.clear();
    },
  };
};
