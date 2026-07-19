/**
 * Atmosphere + accent design data.
 *
 * These values are data-driven (chosen per-playlist / per-user at runtime) so they
 * live as TypeScript constants rather than static CSS variables. Sourced
 * verbatim from the Soundlight design handoff.
 */

export const ATMOSPHERES = [
  'ambient',
  'exciting',
  'battle',
  'suspense',
  'victory',
  'loss',
] as const;

export type Atmosphere = (typeof ATMOSPHERES)[number];

/** Accent color used for the per-atmosphere label + track dot. */
export const ATMOSPHERE_COLORS: Record<Atmosphere, string> = {
  ambient: '#6fd8b0',
  exciting: '#ec934a',
  battle: '#ef6f73',
  suspense: '#8aa0d6',
  victory: '#ecca4e',
  loss: '#9f93e6',
};

/** Cover gradient used as stand-in art (falls back when no Spotify artwork). */
export const ATMOSPHERE_COVERS: Record<Atmosphere, string> = {
  ambient: 'linear-gradient(150deg,#1c3b33,#0f201c)',
  exciting: 'linear-gradient(150deg,#3b2715,#20140a)',
  battle: 'linear-gradient(150deg,#3b1d20,#1f0f11)',
  suspense: 'linear-gradient(150deg,#262b3b,#13151f)',
  victory: 'linear-gradient(150deg,#3b3717,#211d0a)',
  loss: 'linear-gradient(150deg,#272340,#14111f)',
};

/** GM-facing locations used to name a playlist ("{location} – {Atmosphere}"). */
export const LOCATIONS = [
  'General',
  'Tavern',
  'City',
  'Forest',
  'Dungeon',
  'Castle',
  'Sea',
  'Wilderness',
  'Temple',
] as const;

export type Location = (typeof LOCATIONS)[number];

/** The single app accent — orange. The theme is fixed (no per-user accent). */
export const DEFAULT_ACCENT = '#f5a04a';

export type CardLabel = 'split' | 'combined';

/** Fixed grid width (columns) for the playlist grid. */
export const DEFAULT_COLUMNS = 5;

/** Capitalize an atmosphere for display. */
export const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const coverFor = (atmosphere: Atmosphere): string => {
  return ATMOSPHERE_COVERS[atmosphere];
};

export const atmosphereColor = (atmosphere: Atmosphere): string => {
  return ATMOSPHERE_COLORS[atmosphere];
};
