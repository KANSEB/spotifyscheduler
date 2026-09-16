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

export function starterConfig(): StudioConfig {
  return {
    playlists: {},
    planning: emptyPlanning(),
    options: { ...DEFAULT_OPTIONS },
  };
}
