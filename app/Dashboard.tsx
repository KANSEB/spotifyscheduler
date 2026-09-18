"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StudioView {
  id: string;
  name: string;
  address: string;
  online: boolean;
  state: string;
  statusText: string;
  deviceName: string;
  nowPlaying: { name?: string; artist?: string; playlist?: string } | null;
  updatedAt: string | null;
  version: string;
  scheduled: string;
}

const STATE_LABEL: Record<string, string> = {
  playing: "En lecture",
  waiting: "Changement…",
  silence: "Hors créneau",
  paused: "En pause",
  starting: "Démarrage",
  error: "Problème",
  unknown: "Inconnu",
  offline: "Hors ligne",
};

function effectiveState(s: StudioView): string {
  if (!s.online) return "offline";
  return s.state || "unknown";
}

function ago(iso: string | null): string {
  if (!iso) return "jamais vu";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "il y a quelques secondes";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  return `il y a ${Math.floor(sec / 86400)} j`;
}

export default function Dashboard({
  initial,
  createStudioAction,
}: {
  initial: StudioView[];
  createStudioAction: (fd: FormData) => void;
}) {
  const [studios, setStudios] = useState<StudioView[]>(initial);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const r = await fetch("/api/status", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (alive && data.studios) setStudios(data.studios);
      } catch {}
    }
    poll();
    const t = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const online = studios.filter((s) => s.online).length;

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">
          <span className="dot">♪</span> Kore Music
        </div>
        <form action="/api/logout" method="post">
          <button className="btn small">Déconnexion</button>
        </form>
      </div>

      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 16, flexWrap: "wrap" }}
      >
        <div>
          <h1 className="page-title">Studios</h1>
          <p className="page-sub">
            {studios.length === 0
              ? "Ajoute ton premier studio pour commencer."
              : `${online} sur ${studios.length} ${studios.length > 1 ? "studios en ligne" : "studio en ligne"} en ce moment.`}
          </p>
        </div>
        <button className="btn primary" onClick={() => setAdding((v) => !v)}>
          {adding ? "Fermer" : "+ Ajouter un studio"}
        </button>
      </div>

      {adding && (
        <form action={createStudioAction} className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="row wrap" style={{ gap: 12, alignItems: "flex-end" }}>
            <label className="field" style={{ flex: "1 1 200px", marginBottom: 0 }}>
              <span className="lbl">Nom du studio</span>
              <input type="text" name="name" placeholder="Kore Châtelet" required />
            </label>
            <label className="field" style={{ flex: "2 1 300px", marginBottom: 0 }}>
              <span className="lbl">Adresse</span>
              <input type="text" name="address" placeholder="12 rue de Rivoli, 75001 Paris" />
            </label>
            <button className="btn primary">Créer</button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: "16px 18px", marginBottom: 18, background: "var(--bg-elev-2)" }}>
        <div className="faint" style={{ fontSize: 12.5, fontWeight: 650, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Comment ça marche
        </div>
        <div className="row wrap" style={{ gap: 18, fontSize: 13, color: "var(--text-dim)" }}>
          <span><b style={{ color: "var(--text)" }}>1.</b> Clique un studio pour régler ses playlists et horaires.</span>
          <span><b style={{ color: "var(--text)" }}>2.</b> Télécharge son <code>central.json</code> depuis sa fiche.</span>
          <span><b style={{ color: "var(--text)" }}>3.</b> Pose-le à côté de l'exe sur le PC du studio. Il passe en vert ici.</span>
        </div>
      </div>

      {studios.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p className="muted" style={{ margin: 0 }}>
            Aucun studio pour l'instant. Clique sur « Ajouter un studio » pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid">
          {studios.map((s) => {
            const st = effectiveState(s);
            return (
              <Link key={s.id} href={`/studios/${s.id}`} className="card studio-card">
                <div className="status-row" style={{ justifyContent: "space-between" }}>
                  <span className={`pill state-${st}`}>
                    <span
                      className={`led ${st === "playing" ? "live" : ""}`}
                      style={{ background: "currentColor" }}
                    />
                    {STATE_LABEL[st] ?? st}
                  </span>
                  <span className="faint" style={{ fontSize: 12 }}>
                    {ago(s.updatedAt)}
                  </span>
                </div>

                <div>
                  <div className="studio-name">{s.name}</div>
                  {s.address && <div className="studio-addr">{s.address}</div>}
                </div>

                <div className="now">
                  {st === "playing" && s.nowPlaying?.name ? (
                    <>
                      <span>♪</span>
                      <span>
                        <strong>{s.nowPlaying.name}</strong>
                        {s.nowPlaying.artist ? ` · ${s.nowPlaying.artist}` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="faint">{s.statusText || "—"}</span>
                  )}
                </div>

                <div
                  className="row"
                  style={{ justifyContent: "space-between", fontSize: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}
                >
                  <span className="faint">
                    Prévu : {s.scheduled}
                    {s.deviceName ? ` · ${s.deviceName}` : ""}
                  </span>
                  <span style={{ color: "var(--accent-strong)", fontWeight: 600 }}>Configurer →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
