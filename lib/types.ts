export const DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;
export type Day = (typeof DAYS)[number];

export interface Slot {
  de: string; // "HH:MM"
  a: string; // "HH:MM", "00:00" = minuit
  playlist: string; // clé dans playlists
}

export interface StudioOptions {
  lancer_spotify: boolean;
  demarrer_avec_windows: boolean;
  appareil: string;
  aleatoire: boolean;
  volume: number | null;
  reprendre_si_pause_apres_minutes: number;
  bascule_forcee_apres_minutes: number;
  hors_creneau: "pause" | "laisser";
}

export interface StudioConfig {
  playlists: Record<string, string>;
  planning: Record<Day, Slot[]>;
  options: StudioOptions;
}

export interface Studio {
  id: string;
  name: string;
  address: string;
  agent_key: string;
  config: StudioConfig;
  created_at: string;
  config_updated_at: string;
}

export interface StudioStatus {
  studio_id: string;
  updated_at: string;
  state: string; // playing | waiting | silence | starting | paused | error | unknown
  status_text: string;
  device_name: string;
  now_playing: { name?: string; artist?: string; playlist?: string } | null;
  version: string;
}

export const DEFAULT_OPTIONS: StudioOptions = {
  lancer_spotify: true,
  demarrer_avec_windows: true,
  appareil: "",
  aleatoire: true,
  volume: null,
  reprendre_si_pause_apres_minutes: 10,
  bascule_forcee_apres_minutes: 10,
  hors_creneau: "pause",
};

export function emptyPlanning(): Record<Day, Slot[]> {
  return {
    lundi: [],
    mardi: [],
    mercredi: [],
    jeudi: [],
    vendredi: [],
    samedi: [],
    dimanche: [],
  };
}

// Planning et playlists d'origine du programme Kore. Chaque nouveau studio
// démarre avec ça ; on ajuste ensuite par studio si besoin.
const SEMAINE: Slot[] = [
  { de: "06:00", a: "08:30", playlist: "calme" },
  { de: "08:30", a: "19:00", playlist: "journee" },
  { de: "19:00", a: "00:00", playlist: "calme" },
];

export function starterConfig(): StudioConfig {
  return {
    playlists: {
      calme: "spotify:playlist:1QYZpoloH8CjAS9nowlkzW",
      journee: "spotify:playlist:1ZCWKCsKHTjAmAc3ZiqiMS",
      weekend: "spotify:playlist:2oUCHM2WN9owcBfGO0cWLb",
    },
    planning: {
      lundi: [...SEMAINE],
      mardi: [...SEMAINE],
      mercredi: [...SEMAINE],
      jeudi: [...SEMAINE],
      vendredi: [...SEMAINE],
      samedi: [{ de: "09:00", a: "00:00", playlist: "weekend" }],
      dimanche: [
        { de: "09:00", a: "11:00", playlist: "calme" },
        { de: "11:00", a: "17:30", playlist: "journee" },
        { de: "17:30", a: "00:00", playlist: "calme" },
      ],
    },
    options: { ...DEFAULT_OPTIONS },
  };
}
