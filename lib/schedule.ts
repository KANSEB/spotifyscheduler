import { DAYS, Slot, StudioConfig, StudioOptions, DEFAULT_OPTIONS, emptyPlanning } from "./types";

export class ConfigError extends Error {}

const MINUTES_IN_DAY = 24 * 60;

export function parseTime(value: string, isEnd = false): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value || "").trim());
  if (!m) throw new ConfigError(`Heure invalide : « ${value} » (format attendu HH:MM)`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) throw new ConfigError(`Heure invalide : « ${value} »`);
  let minutes = h * 60 + min;
  if (isEnd && minutes === 0) minutes = MINUTES_IN_DAY;
  if (minutes > MINUTES_IN_DAY) throw new ConfigError(`Heure invalide : « ${value} »`);
  return minutes;
}

export function normalizeUri(value: string): string {
  const v = (value || "").trim();
  if (v.startsWith("spotify:")) return v;
  if (v.includes("open.spotify.com/")) {
    const path = v.split("open.spotify.com/")[1].split("?")[0].replace(/^\/+|\/+$/g, "");
    const parts = path.split("/");
    if (parts.length >= 2) return `spotify:${parts[parts.length - 2]}:${parts[parts.length - 1]}`;
    throw new ConfigError(`Lien Spotify non reconnu : « ${value} »`);
  }
  if (v && /^[A-Za-z0-9]+$/.test(v)) return `spotify:playlist:${v}`;
  throw new ConfigError(`Playlist non reconnue : « ${value} »`);
}

/** Valide et normalise une config. Lève ConfigError avec un message lisible. */
export function validateConfig(input: unknown): StudioConfig {
  const cfg = (input || {}) as Partial<StudioConfig>;

  const rawPlaylists = cfg.playlists || {};
  const keys = Object.keys(rawPlaylists);
  if (keys.length === 0) throw new ConfigError("Ajoutez au moins une playlist.");
  const playlists: Record<string, string> = {};
  for (const k of keys) {
    const key = k.trim();
    if (!key) throw new ConfigError("Une playlist a un nom vide.");
    playlists[key] = normalizeUri(String(rawPlaylists[k]));
  }

  const planning = emptyPlanning();
  const rawPlanning = (cfg.planning || {}) as Record<string, Slot[]>;
  for (const day of DAYS) {
    const slots = (rawPlanning[day] || []).map((s) => {
      const key = String(s.playlist || "").trim();
      if (!(key in playlists)) {
        throw new ConfigError(`${day} : la playlist « ${key || "?"} » n'existe pas dans la liste.`);
      }
      const start = parseTime(String(s.de));
      const end = parseTime(String(s.a), true);
      if (end <= start) {
        throw new ConfigError(`${day} : le créneau ${s.de}–${s.a} finit avant de commencer.`);
      }
      return { de: String(s.de), a: String(s.a), playlist: key, _start: start, _end: end };
    });
    slots.sort((a, b) => a._start - b._start);
    for (let i = 1; i < slots.length; i++) {
      if (slots[i]._start < slots[i - 1]._end) {
        throw new ConfigError(
          `${day} : les créneaux ${slots[i - 1].de}–${slots[i - 1].a} et ${slots[i].de}–${slots[i].a} se chevauchent.`
        );
      }
    }
    planning[day] = slots.map(({ de, a, playlist }) => ({ de, a, playlist }));
  }

  const rawOpt = (cfg.options || {}) as Partial<StudioOptions>;
  const volume =
    rawOpt.volume === null || rawOpt.volume === undefined ? null : Math.max(0, Math.min(100, Number(rawOpt.volume)));
  const options: StudioOptions = {
    lancer_spotify: rawOpt.lancer_spotify ?? DEFAULT_OPTIONS.lancer_spotify,
    demarrer_avec_windows: rawOpt.demarrer_avec_windows ?? DEFAULT_OPTIONS.demarrer_avec_windows,
    appareil: String(rawOpt.appareil ?? ""),
    aleatoire: rawOpt.aleatoire ?? DEFAULT_OPTIONS.aleatoire,
    volume: Number.isFinite(volume as number) ? (volume as number) : null,
    reprendre_si_pause_apres_minutes: Number(rawOpt.reprendre_si_pause_apres_minutes ?? 10),
    bascule_forcee_apres_minutes: Number(rawOpt.bascule_forcee_apres_minutes ?? 10),
    hors_creneau: rawOpt.hors_creneau === "laisser" ? "laisser" : "pause",
  };

  return { playlists, planning, options };
}

/** Créneau actif à une date donnée, pour l'aperçu côté dashboard. */
export function currentSlot(cfg: StudioConfig, now: Date): { slot: Slot | null; label: string } {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const day = DAYS[(now.getDay() + 6) % 7]; // JS: 0=dimanche
  for (const s of cfg.planning[day] || []) {
    const start = parseTime(s.de);
    const end = parseTime(s.a, true);
    if (start <= minutes && minutes < end) {
      return { slot: s, label: `${s.de}–${s.a} · ${s.playlist}` };
    }
  }
  return { slot: null, label: "hors créneau" };
}
