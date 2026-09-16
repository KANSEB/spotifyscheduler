import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { listStudios, getStatuses } from "@/lib/studios";
import { createStudioAction } from "./actions";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await isAuthed())) redirect("/login");

  if (!dbConfigured()) {
    return (
      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <span className="dot">♪</span> Kore Music
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Base de données à connecter</h2>
          <p className="muted">
            Créez un store Postgres dans l'onglet <b>Storage</b> du projet Vercel et reliez-le à
            cette app. Vercel ajoute alors <code>POSTGRES_URL</code> automatiquement. Rechargez
            ensuite cette page.
          </p>
        </div>
      </div>
    );
  }

  const [studios, statuses] = await Promise.all([listStudios(), getStatuses()]);
  const initial = studios.map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    state: statuses[s.id]?.state ?? "unknown",
    statusText: statuses[s.id]?.status_text ?? "",
    deviceName: statuses[s.id]?.device_name ?? "",
    nowPlaying: statuses[s.id]?.now_playing ?? null,
    updatedAt: statuses[s.id]?.updated_at ?? null,
    version: statuses[s.id]?.version ?? "",
    online: false,
    scheduled: "—",
  }));

  return <Dashboard initial={initial} createStudioAction={createStudioAction} />;
}
