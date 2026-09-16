import { NextRequest, NextResponse } from "next/server";
import { getStudio, recordHeartbeat } from "@/lib/studios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Un seul appel pour l'agent : il envoie son état et reçoit sa config.
 * Auth : studioId + agentKey doivent correspondre.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const studioId = String(body.studioId || "");
  const agentKey = String(body.agentKey || "");
  if (!studioId || !agentKey) {
    return NextResponse.json({ error: "studioId et agentKey requis" }, { status: 400 });
  }

  const studio = await getStudio(studioId);
  if (!studio || studio.agent_key !== agentKey) {
    return NextResponse.json({ error: "Identifiants agent invalides" }, { status: 401 });
  }

  // Heartbeat : on tolère l'absence de certains champs.
  try {
    await recordHeartbeat(studioId, {
      state: String(body.state || "unknown").slice(0, 20),
      status_text: String(body.statusText || "").slice(0, 300),
      device_name: String(body.deviceName || "").slice(0, 120),
      now_playing: body.nowPlaying ?? null,
      version: String(body.version || "").slice(0, 40),
    });
  } catch (e) {
    // Ne bloque pas la récupération de config si le heartbeat échoue.
    console.error("heartbeat error", e);
  }

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    configUpdatedAt: studio.config_updated_at,
    config: studio.config,
    studio: { id: studio.id, name: studio.name, address: studio.address },
  });
}
