"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Studio, StudioConfig, DAYS, Day, Slot } from "@/lib/types";

type SaveResult = { ok: true } | { ok: false; error: string };

export default function Editor({
  studio,
  baseUrl,
  saveConfigAction,
  updateMetaAction,
  rotateKeyAction,
  deleteStudioAction,
}: {
  studio: Studio;
  baseUrl: string;
  saveConfigAction: (id: string, config: StudioConfig) => Promise<SaveResult>;
  updateMetaAction: (id: string, name: string, address: string) => Promise<void>;
  rotateKeyAction: (id: string) => Promise<string>;
  deleteStudioAction: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [name, setName] = useState(studio.name);
  const [address, setAddress] = useState(studio.address);
  const [playlists, setPlaylists] = useState<[string, string][]>(
    Object.entries(studio.config.playlists)
  );
  const [planning, setPlanning] = useState<Record<Day, Slot[]>>(
    JSON.parse(JSON.stringify(studio.config.planning))
  );
  const [options, setOptions] = useState(studio.config.options);
  const [agentKey, setAgentKey] = useState(studio.agent_key);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [pending, start] = useTransition();

  function flash(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  function buildConfig(): StudioConfig {
    const pl: Record<string, string> = {};
    for (const [k, v] of playlists) if (k.trim()) pl[k.trim()] = v;
    return { playlists: pl, planning, options };
  }

  function save() {
    start(async () => {
      await updateMetaAction(studio.id, name, address);
      const res = await saveConfigAction(studio.id, buildConfig());
      if (res.ok) {
        flash("Enregistré — les studios se mettent à jour dans la minute.", true);
        router.refresh();
      } else {
        flash(res.error, false);
      }
    });
  }

  const playlistKeys = playlists.map(([k]) => k.trim()).filter(Boolean);

  // -- playlists --
  function setPl(i: number, field: 0 | 1, value: string) {
    setPlaylists((p) => p.map((row, idx) => (idx === i ? ((field === 0 ? [value, row[1]] : [row[0], value]) as [string, string]) : row)));
  }
  function addPl() {
    setPlaylists((p) => [...p, ["", ""]]);
  }
  function delPl(i: number) {
    setPlaylists((p) => p.filter((_, idx) => idx !== i));
  }

  // -- slots --
  function addSlot(day: Day) {
    setPlanning((p) => ({
      ...p,
      [day]: [...p[day], { de: "09:00", a: "18:00", playlist: playlistKeys[0] || "" }],
    }));
  }
  function setSlot(day: Day, i: number, field: keyof Slot, value: string) {
    setPlanning((p) => ({
      ...p,
      [day]: p[day].map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }));
  }
  function delSlot(day: Day, i: number) {
    setPlanning((p) => ({ ...p, [day]: p[day].filter((_, idx) => idx !== i) }));
  }
  function copyMonToWeek() {
    setPlanning((p) => {
      const src = p.lundi;
      const out = { ...p };
      (["mardi", "mercredi", "jeudi", "vendredi"] as Day[]).forEach((d) => {
        out[d] = JSON.parse(JSON.stringify(src));
      });
      return out;
    });
    flash("Lundi copié sur mardi → vendredi.", true);
  }

  async function rotate() {
    if (!confirm("Générer une nouvelle clé ? L'ancienne cessera de marcher : il faudra renvoyer le fichier au studio.")) return;
    const k = await rotateKeyAction(studio.id);
    setAgentKey(k);
    flash("Nouvelle clé générée.", true);
  }

  function downloadCentral() {
    const data = {
      _aide: "Fichier d'identité du studio. À déposer à côté de l'exe. Ne pas modifier.",
      studioId: studio.id,
      agentKey,
      centralUrl: baseUrl,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "central.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <Link href="/" className="btn small">
          ← Studios
        </Link>
        <button className="btn primary" onClick={save} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      {/* Identité */}
      <div className="card" style={{ padding: 20, marginBottom: 8 }}>
        <div className="row wrap" style={{ gap: 14 }}>
          <label className="field" style={{ flex: "1 1 220px", marginBottom: 0 }}>
            <span className="lbl">Nom du studio</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field" style={{ flex: "2 1 320px", marginBottom: 0 }}>
            <span className="lbl">Adresse</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
        </div>
      </div>

      {/* Playlists */}
      <div className="section-title">Playlists</div>
      <div className="card" style={{ padding: 18 }}>
        {playlists.length === 0 && (
          <p className="faint" style={{ marginTop: 0 }}>Aucune playlist. Ajoutez-en une.</p>
        )}
        {playlists.map(([k, v], i) => (
          <div className="pl-row" key={i}>
            <input placeholder="nom court" value={k} onChange={(e) => setPl(i, 0, e.target.value)} />
            <input className="mono" placeholder="lien ou URI Spotify" value={v} onChange={(e) => setPl(i, 1, e.target.value)} />
            <button className="iconbtn" onClick={() => delPl(i)} title="Supprimer">✕</button>
          </div>
        ))}
        <button className="btn small" onClick={addPl} style={{ marginTop: 6 }}>+ Playlist</button>
        <p className="hint">
          Nom court (ex. « calme »), puis le lien Spotify de la playlist. Copiez le lien depuis
          Spotify → Partager → Copier le lien.
        </p>
      </div>

      {/* Planning */}
      <div className="section-title" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Horaires</span>
        <button className="btn small" onClick={copyMonToWeek}>Copier lundi sur la semaine</button>
      </div>
      {DAYS.map((day) => (
        <div className="day-block" key={day}>
          <div className="day-head">
            <span className="day-name">{day}</span>
            <button className="btn small" onClick={() => addSlot(day)}>+ Créneau</button>
          </div>
          {planning[day].length === 0 ? (
            <span className="faint" style={{ fontSize: 13 }}>Silence toute la journée.</span>
          ) : (
            planning[day].map((s, i) => (
              <div className="slot" key={i}>
                <input type="time" value={s.de} onChange={(e) => setSlot(day, i, "de", e.target.value)} />
                <span className="sep">→</span>
                <input type="time" value={s.a} onChange={(e) => setSlot(day, i, "a", e.target.value)} />
                <select value={s.playlist} onChange={(e) => setSlot(day, i, "playlist", e.target.value)}>
                  <option value="">— playlist —</option>
                  {playlistKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <button className="iconbtn" onClick={() => delSlot(day, i)} title="Supprimer">✕</button>
              </div>
            ))
          )}
        </div>
      ))}
      <p className="hint">« → 00:00 » signifie jusqu'à minuit. En dehors des créneaux, la musique se met en pause.</p>

      {/* Options */}
      <div className="section-title">Réglages</div>
      <div className="card" style={{ padding: 18 }}>
        <div className="row wrap" style={{ gap: 20 }}>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={options.lancer_spotify} onChange={(e) => setOptions({ ...options, lancer_spotify: e.target.checked })} />
            Ouvrir Spotify automatiquement
          </label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={options.aleatoire} onChange={(e) => setOptions({ ...options, aleatoire: e.target.checked })} />
            Lecture aléatoire
          </label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={options.hors_creneau === "pause"} onChange={(e) => setOptions({ ...options, hors_creneau: e.target.checked ? "pause" : "laisser" })} />
            Couper hors des horaires
          </label>
        </div>
        <div className="row wrap" style={{ gap: 14, marginTop: 14 }}>
          <label className="field" style={{ marginBottom: 0, flex: "1 1 140px" }}>
            <span className="lbl">Volume fixe (vide = ne pas toucher)</span>
            <input type="number" min={0} max={100} value={options.volume ?? ""} onChange={(e) => setOptions({ ...options, volume: e.target.value === "" ? null : Number(e.target.value) })} />
          </label>
          <label className="field" style={{ marginBottom: 0, flex: "2 1 220px" }}>
            <span className="lbl">Nom de l'appareil Spotify (vide = ce PC)</span>
            <input value={options.appareil} onChange={(e) => setOptions({ ...options, appareil: e.target.value })} placeholder="PC-ACCUEIL" />
          </label>
        </div>
      </div>

      {/* Installation */}
      <div className="section-title">Installation sur le poste du studio</div>
      <div className="card" style={{ padding: 18 }}>
        <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>
          Sur le PC du studio : mettre l'exe dans un dossier, y déposer ce fichier <code>central.json</code>,
          puis double-cliquer l'exe. Le studio se connecte à Spotify une fois et apparaît ici.
        </p>
        <div className="row wrap" style={{ gap: 10, marginBottom: 12 }}>
          <button className="btn primary small" onClick={downloadCentral}>⬇ Télécharger central.json</button>
          <button className="btn small" onClick={rotate}>Régénérer la clé</button>
        </div>
        <div className="hint" style={{ marginBottom: 6 }}>Clé de l'agent (secrète) :</div>
        <div className="key-box">{agentKey}</div>
      </div>

      {/* Danger */}
      <div className="section-title">Zone sensible</div>
      <div className="card" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted" style={{ fontSize: 13.5 }}>Supprimer ce studio du central.</span>
          <button
            className="btn danger small"
            onClick={() => {
              if (confirm(`Supprimer « ${studio.name} » ? Cette action est définitive.`)) {
                start(() => deleteStudioAction(studio.id));
              }
            }}
          >
            Supprimer
          </button>
        </div>
      </div>

      {toast && <div className={`toast ${toast.ok ? "ok" : "err"}`}>{toast.msg}</div>}
    </div>
  );
}
