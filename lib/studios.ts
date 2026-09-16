import crypto from "crypto";
import { sql, ensureSchema } from "./db";
import { Studio, StudioStatus, StudioConfig, starterConfig } from "./types";

export function newAgentKey(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function slugify(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function listStudios(): Promise<Studio[]> {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM studios ORDER BY name`) as unknown as Studio[];
  return rows;
}

export async function getStudio(id: string): Promise<Studio | null> {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM studios WHERE id = ${id}`) as unknown as Studio[];
  return rows[0] ?? null;
}

export async function createStudio(name: string, address: string): Promise<Studio> {
  await ensureSchema();
  const base = slugify(name) || "studio";
  let id = base;
  let n = 2;
  while (await getStudio(id)) id = `${base}-${n++}`;
  const key = newAgentKey();
  const config = starterConfig();
  const rows = (await sql()`
    INSERT INTO studios (id, name, address, agent_key, config)
    VALUES (${id}, ${name}, ${address}, ${key}, ${JSON.stringify(config)}::jsonb)
    RETURNING *`) as unknown as Studio[];
  return rows[0];
}

export async function updateStudioMeta(id: string, name: string, address: string): Promise<void> {
  await ensureSchema();
  await sql()`UPDATE studios SET name = ${name}, address = ${address} WHERE id = ${id}`;
}

export async function saveConfig(id: string, config: StudioConfig): Promise<void> {
  await ensureSchema();
  await sql()`
    UPDATE studios
    SET config = ${JSON.stringify(config)}::jsonb, config_updated_at = now()
    WHERE id = ${id}`;
}

export async function rotateAgentKey(id: string): Promise<string> {
  await ensureSchema();
  const key = newAgentKey();
  await sql()`UPDATE studios SET agent_key = ${key} WHERE id = ${id}`;
  return key;
}

export async function deleteStudio(id: string): Promise<void> {
  await ensureSchema();
  await sql()`DELETE FROM studios WHERE id = ${id}`;
}

export async function getStatuses(): Promise<Record<string, StudioStatus>> {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM studio_status`) as unknown as StudioStatus[];
  const out: Record<string, StudioStatus> = {};
  for (const r of rows) out[r.studio_id] = r;
  return out;
}

export async function recordHeartbeat(
  studioId: string,
  patch: {
    state: string;
    status_text: string;
    device_name: string;
    now_playing: StudioStatus["now_playing"];
    version: string;
  }
): Promise<void> {
  await ensureSchema();
  await sql()`
    INSERT INTO studio_status (studio_id, updated_at, state, status_text, device_name, now_playing, version)
    VALUES (${studioId}, now(), ${patch.state}, ${patch.status_text}, ${patch.device_name},
            ${patch.now_playing ? JSON.stringify(patch.now_playing) : null}::jsonb, ${patch.version})
    ON CONFLICT (studio_id) DO UPDATE SET
      updated_at = now(),
      state = EXCLUDED.state,
      status_text = EXCLUDED.status_text,
      device_name = EXCLUDED.device_name,
      now_playing = EXCLUDED.now_playing,
      version = EXCLUDED.version`;
}

/** Un agent est "en ligne" s'il a battu il y a moins de 90 s. */
export function isOnline(status?: StudioStatus): boolean {
  if (!status) return false;
  return Date.now() - new Date(status.updated_at).getTime() < 90_000;
}
