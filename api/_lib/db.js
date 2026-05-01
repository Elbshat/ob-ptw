import { sql } from "@vercel/postgres";

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS map (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      image_url   TEXT,
      nat_w       INTEGER,
      nat_h       INTEGER,
      updated_at  TIMESTAMPTZ
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS permits (
      id          SERIAL PRIMARY KEY,
      number      TEXT NOT NULL,
      work_center TEXT,
      description TEXT,
      type        TEXT NOT NULL,
      ix          DOUBLE PRECISION NOT NULL,
      iy          DOUBLE PRECISION NOT NULL,
      radius      DOUBLE PRECISION DEFAULT 0,
      valid_from  TIMESTAMPTZ,
      valid_to    TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`INSERT INTO map (id) VALUES (1) ON CONFLICT DO NOTHING;`;
  initialized = true;
}

export const rowToPermit = (r) => ({
  id:          r.id,
  number:      r.number,
  workCenter:  r.work_center,
  description: r.description,
  type:        r.type,
  ix:          Number(r.ix),
  iy:          Number(r.iy),
  radius:      Number(r.radius),
  validFrom:   r.valid_from ? new Date(r.valid_from).toISOString() : null,
  validTo:     r.valid_to   ? new Date(r.valid_to).toISOString()   : null,
  createdAt:   r.created_at ? new Date(r.created_at).toISOString() : null,
  updatedAt:   r.updated_at ? new Date(r.updated_at).toISOString() : null,
});
