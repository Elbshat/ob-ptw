import { sql } from "@vercel/postgres";
import { ensureSchema, rowToPermit } from "../_lib/db.js";
import { requireEditor, handleCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = requireEditor(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  await ensureSchema();
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "Bad id" });

  if (req.method === "PATCH") {
    const existing = await sql`SELECT * FROM permits WHERE id = ${id}`;
    if (!existing.rows[0]) return res.status(404).json({ error: "Not found" });

    const cur = existing.rows[0];
    const b = req.body || {};
    const merged = {
      number:      b.number      ?? cur.number,
      workCenter:  b.workCenter  ?? cur.work_center,
      description: b.description ?? cur.description,
      type:        b.type        ?? cur.type,
      ix:          b.ix          ?? cur.ix,
      iy:          b.iy          ?? cur.iy,
      radius:      b.radius      ?? cur.radius,
      validFrom:   "validFrom" in b ? b.validFrom : cur.valid_from,
      validTo:     "validTo"   in b ? b.validTo   : cur.valid_to,
    };

    const updated = await sql`
      UPDATE permits SET
        number      = ${merged.number},
        work_center = ${merged.workCenter},
        description = ${merged.description},
        type        = ${merged.type},
        ix          = ${merged.ix},
        iy          = ${merged.iy},
        radius      = ${merged.radius},
        valid_from  = ${merged.validFrom},
        valid_to    = ${merged.validTo},
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return res.json(rowToPermit(updated.rows[0]));
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM permits WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
