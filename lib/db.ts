import { neon } from "@neondatabase/serverless";

function connString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    "";
  if (!url) {
    throw new Error(
      "Base de données non configurée : aucune variable POSTGRES_URL / DATABASE_URL trouvée."
    );
  }
  return url;
}

let _sql: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!_sql) _sql = neon(connString());
  return _sql;
}

let migrated = false;

/** Crée les tables au premier appel. Idempotent. */
export async function ensureSchema(): Promise<void> {
  if (migrated) return;
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS studios (
      id                text PRIMARY KEY,
      name              text NOT NULL,
      address           text NOT NULL DEFAULT '',
      agent_key         text NOT NULL,
      config            jsonb NOT NULL,
      created_at        timestamptz NOT NULL DEFAULT now(),
      config_updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  await db`
    CREATE TABLE IF NOT EXISTS studio_status (
      studio_id    text PRIMARY KEY REFERENCES studios(id) ON DELETE CASCADE,
      updated_at   timestamptz NOT NULL DEFAULT now(),
      state        text NOT NULL DEFAULT 'unknown',
      status_text  text NOT NULL DEFAULT '',
      device_name  text NOT NULL DEFAULT '',
      now_playing  jsonb,
      version      text NOT NULL DEFAULT ''
    )`;
  migrated = true;
}

export function dbConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING
  );
}
