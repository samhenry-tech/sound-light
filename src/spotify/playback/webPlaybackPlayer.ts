/**
 * Real player backed by the Spotify Web Playback SDK. Registers the browser as
 * a Spotify Connect device and drives playback through the Web API.
 * Requires a linked Spotify **Premium** account.
 */
import { getValidAccessToken } from '../auth/spotifyAuth';
import { SPOTIFY_ENDPOINTS } from '../config';
import type { PlaybackState, SpotifyTrack } from '../types';
import type { AtmosPlayer } from './types';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';
const NEAR_END_MS = 2000;

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
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
}

export function createWebPlaybackPlayer(): AtmosPlayer {
  const stateListeners = new Set<(state: PlaybackState) => void>();
  const endedListeners = new Set<() => void>();

  let deviceId: string | null = null;
  let player: SpotifyPlayerInstance | null = null;
  let wasNearEnd = false;
  let current: SpotifyTrack | null = null;

  const ready = (async () => {
    await loadSdk();
    const Player = window.Spotify?.Player;
    if (!Player) throw new Error('Spotify Web Playback SDK unavailable.');

    player = new Player({
      name: 'atmos',
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

      // Heuristic "track ended": we feed one track at a time, so when the SDK
      // pauses at position 0 right after nearing the end, advance the queue.
      if (state.paused && state.position === 0 && wasNearEnd) {
        endedListeners.forEach((l) => l());
      }
      wasNearEnd = state.duration > 0 && state.position > state.duration - NEAR_END_MS;
    });

    await player.connect();
    return player;
  })();

  async function command(path: string, init?: RequestInit): Promise<void> {
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
  }

  return {
    async playTrack(track) {
      await ready;
      if (!deviceId) throw new Error('Spotify device not ready yet.');
      await command(`/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [track.uri] }),
      });
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
}
