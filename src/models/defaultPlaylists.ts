/**
 * Shared default genre packs — stored in the playlists table under a fixed
 * partition key ({@link DEFAULTS_OWNER}) so every signed-in user can read them.
 */
import { z } from 'zod';

import type { Atmosphere } from '~/theme/atmosphere';

/** DynamoDB partition key for the shared default catalog. */
export const DEFAULTS_OWNER = 'defaults';

/** Only this Google account may mutate the defaults partition (UI gate). */
export const DEFAULTS_ADMIN_EMAIL = 'sam.ed.henry@gmail.com';

/** Target runtime when populating each default playlist from Spotify. */
export const TARGET_PLAYLIST_DURATION_MS = 4 * 60 * 60 * 1000;

export const DEFAULT_GENRE_IDS = ['fantasy', 'dark-fantasy', 'cyberpunk'] as const;
export type DefaultGenreId = (typeof DEFAULT_GENRE_IDS)[number];

export const defaultGenreIdSchema = z.enum(DEFAULT_GENRE_IDS);

export interface GenrePackMeta {
  id: DefaultGenreId;
  label: string;
  blurb: string;
  gradient: string;
}

export const GENRE_PACKS: readonly GenrePackMeta[] = [
  {
    id: 'fantasy',
    label: 'Fantasy',
    blurb: 'Taverns, forests, and heroic quests.',
    gradient: 'linear-gradient(150deg,#1c3b33,#0f201c 55%,#3b2715)',
  },
  {
    id: 'dark-fantasy',
    label: 'Dark fantasy',
    blurb: 'Grim castles, curses, and hard-won hope.',
    gradient: 'linear-gradient(150deg,#272340,#14111f 55%,#3b1d20)',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    blurb: 'Neon streets, chrome, and corporate shadows.',
    gradient: 'linear-gradient(150deg,#1a2438,#0c1018 55%,#3b1528)',
  },
] as const;

export interface DefaultPlaylistDef {
  genre: DefaultGenreId;
  location: string;
  atmosphere: Atmosphere;
  pinned?: boolean;
  /** Spotify search queries used to gather ~4h of individual tracks. */
  searchQueries: readonly string[];
}

/** Stable id for a default playlist row (`genre:location:atmosphere`). */
export const defaultPlaylistId = (
  genre: DefaultGenreId,
  location: string,
  atmosphere: Atmosphere,
): string => {
  return `${genre}:${location.toLowerCase()}:${atmosphere}`;
};

/**
 * Curated pack definitions. Search queries lean on well-known soundtrack /
 * playlist phrasing so Spotify returns dense, on-genre results.
 */
export const DEFAULT_PLAYLIST_DEFS: readonly DefaultPlaylistDef[] = [
  // —— Fantasy ————————————————————————————————————————————————————————————
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'ambient',
    pinned: true,
    searchQueries: [
      'fantasy adventure soundtrack ambient',
      'lord of the rings soundtrack howard shore',
      'celtic fantasy instrumental',
      'epic fantasy atmosphere playlist',
      'medieval fantasy ambience',
      'rpg exploration music fantasy',
    ],
  },
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'battle',
    pinned: true,
    searchQueries: [
      'epic fantasy battle music',
      'orchestral combat soundtrack fantasy',
      'two steps from hell battle',
      'rpg boss fight music fantasy',
      'epic war drums orchestra',
      'skyrim combat music',
    ],
  },
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'victory',
    searchQueries: [
      'fantasy victory theme orchestra',
      'heroic triumph soundtrack',
      'epic fantasy celebration music',
      'rpg victory fanfare orchestral',
      'lord of the rings victory',
    ],
  },
  {
    genre: 'fantasy',
    location: 'General',
    atmosphere: 'loss',
    searchQueries: [
      'fantasy sad soundtrack',
      'mourning orchestra fantasy',
      'tragic fantasy theme',
      'howard shore lament',
      'rpg defeat ambient sad',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Tavern',
    atmosphere: 'ambient',
    searchQueries: [
      'fantasy tavern music',
      'medieval tavern lute',
      'bard tavern songs instrumental',
      'inn music fantasy rpg',
      'celtic tavern folk instrumental',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Forest',
    atmosphere: 'ambient',
    searchQueries: [
      'enchanted forest soundtrack',
      'fantasy woodland ambient',
      'elf forest music instrumental',
      'nature fantasy atmosphere orchestra',
      'zelda forest theme orchestral',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Forest',
    atmosphere: 'suspense',
    searchQueries: [
      'dark forest suspense soundtrack',
      'fantasy woods tension music',
      'creeping forest ambient orchestra',
      'rpg forest danger theme',
    ],
  },
  {
    genre: 'fantasy',
    location: 'Dungeon',
    atmosphere: 'battle',
    searchQueries: [
      'dungeon battle music fantasy',
      'dark dungeon combat orchestra',
      'rpg crypt fight soundtrack',
      'undead battle fantasy music',
    ],
  },

  // —— Dark fantasy ——————————————————————————————————————————————————————
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'ambient',
    pinned: true,
    searchQueries: [
      'dark fantasy ambient soundtrack',
      'gothic fantasy atmosphere',
      'witcher soundtrack ambient',
      'grimdark fantasy music',
      'dark souls ambience',
      'shadow fantasy orchestra',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'battle',
    pinned: true,
    searchQueries: [
      'dark fantasy battle music',
      'gothic combat orchestra',
      'witcher battle soundtrack',
      'dark souls boss music',
      'grim battle drums orchestra',
      'bloodborne combat theme',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'victory',
    searchQueries: [
      'dark fantasy victory theme',
      'bitter triumph orchestra',
      'gothic heroic ending',
      'witcher victory music',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'General',
    atmosphere: 'loss',
    searchQueries: [
      'dark fantasy tragedy soundtrack',
      'grim lament orchestra',
      'sorrow gothic fantasy',
      'dark souls death theme sad',
      'mourning dark fantasy music',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Castle',
    atmosphere: 'suspense',
    searchQueries: [
      'haunted castle soundtrack',
      'gothic castle suspense',
      'dark fortress ambient tension',
      'vampire castle atmosphere music',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Wilderness',
    atmosphere: 'battle',
    searchQueries: [
      'dark wilderness battle music',
      'wasteland combat orchestra fantasy',
      'grim frontier fight soundtrack',
      'witcher wild hunt battle',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Temple',
    atmosphere: 'loss',
    searchQueries: [
      'ruined temple sad soundtrack',
      'fallen cathedral ambient',
      'dark ritual mourning music',
      'gothic temple lament orchestra',
    ],
  },
  {
    genre: 'dark-fantasy',
    location: 'Dungeon',
    atmosphere: 'suspense',
    searchQueries: [
      'dark dungeon suspense ambient',
      'catacomb tension soundtrack',
      'horror fantasy dungeon music',
      'crypt atmosphere dark fantasy',
    ],
  },

  // —— Cyberpunk ——————————————————————————————————————————————————————————
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'ambient',
    pinned: true,
    searchQueries: [
      'cyberpunk ambient soundtrack',
      'synthwave night city atmosphere',
      'cyberpunk 2077 ambient',
      'neon noir electronic ambient',
      'blade runner atmosphere music',
      'darksynth city night',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'exciting',
    searchQueries: [
      'cyberpunk driving synthwave',
      'neon pulse electronic',
      'cyberpunk 2077 action music',
      'outrun synthwave upbeat',
      'night city cruise soundtrack',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'battle',
    pinned: true,
    searchQueries: [
      'cyberpunk battle music',
      'cyberpunk 2077 combat soundtrack',
      'industrial electronic fight music',
      'darksynth combat',
      'neon action electronic intense',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'victory',
    searchQueries: [
      'cyberpunk victory theme',
      'synthwave triumph',
      'neon success electronic',
      'cyberpunk heist win music',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'General',
    atmosphere: 'loss',
    searchQueries: [
      'cyberpunk sad soundtrack',
      'melancholy synthwave',
      'blade runner blues',
      'neon noir melancholy electronic',
      'cyberpunk 2077 emotional',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'City',
    atmosphere: 'suspense',
    searchQueries: [
      'cyberpunk suspense soundtrack',
      'neon alley tension electronic',
      'corporate intrigue cyberpunk music',
      'dark city stealth synth',
    ],
  },
  {
    genre: 'cyberpunk',
    location: 'City',
    atmosphere: 'battle',
    searchQueries: [
      'cyberpunk street fight music',
      'night city combat soundtrack',
      'urban cyber battle electronic',
      'cyberpunk gang war music',
    ],
  },
];
