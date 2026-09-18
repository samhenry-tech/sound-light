/** Spotify URI of the form `spotify:{type}:{id}`. */
export type SpotifyUriType = 'track' | 'playlist' | 'album';

export interface SpotifyUri {
  type: SpotifyUriType;
  id: string;
}
