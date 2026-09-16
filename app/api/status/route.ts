import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listStudios, getStatuses, isOnline } from "@/lib/studios";
import { currentSlot } from "@/lib/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  const [studios, statuses] = await Promise.all([listStudios(), getStatuses()]);
  const now = new Date();
  const data = studios.map((s) => {
    const st = statuses[s.id];
    let scheduled = "—";
    try {
      scheduled = currentSlot(s.config, now).label;
    } catch {}
    return {
      id: s.id,
      name: s.name,
      address: s.address,
      online: isOnline(st),
      state: st?.state ?? "unknown",
      statusText: st?.status_text ?? "",
      deviceName: st?.device_name ?? "",
      nowPlaying: st?.now_playing ?? null,
      updatedAt: st?.updated_at ?? null,
      version: st?.version ?? "",
      scheduled,
    };
  });
  return NextResponse.json({ studios: data, serverTime: now.toISOString() });
}
