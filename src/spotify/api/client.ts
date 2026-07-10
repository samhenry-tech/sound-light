/** Authenticated fetch wrapper for the Spotify Web API. */
import type { z } from 'zod';

import { getValidAccessToken, logoutSpotify } from '../auth/spotifyAuth';
import { SPOTIFY_ENDPOINTS } from '../config';

export class SpotifyNotLinkedError extends Error {
  constructor() {
    super('Spotify account is not linked.');
    this.name = 'SpotifyNotLinkedError';
  }
}

export const spotifyFetch = async <S extends z.ZodTypeAny>(path: string, schema: S, init?: RequestInit): Promise<z.infer<S>> => {
  const token = await getValidAccessToken();
  if (!token) throw new SpotifyNotLinkedError();

  const res = await fetch(`${SPOTIFY_ENDPOINTS.api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    logoutSpotify();
    throw new SpotifyNotLinkedError();
  }
  if (!res.ok) {
    throw new Error(`Spotify API error ${res.status} on ${path}`);
  }
  // `schema` is ZodTypeAny (its parse() is typed `any`); narrow back to the
  // schema's inferred output. ZodTypeAny is required because several Spotify
  // schemas use `.default`, so their input and output types differ.
  return schema.parse(await res.json()) as z.infer<S>;
};
