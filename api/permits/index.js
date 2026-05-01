import { sql } from "@vercel/postgres";
import { ensureSchema, rowToPermit } from "../_lib/db.js";
import { requireEditor, handleCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = requireEditor(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  await ensureSchema();

  if (req.method === "POST") {
    const {
      number, type, ix, iy,
      radius = 0,
      workCenter = null,
      description = null,
      validFrom = null,
      validTo = null,
    } = req.body || {};
    if (!number || !type) return res.status(400).json({ error: "Missing fields" });

    const result = await sql`
      INSERT INTO permits
        (number, work_center, description, type, ix, iy, radius, valid_from, valid_to)
      VALUES
        (${number}, ${workCenter}, ${description}, ${type}, ${ix}, ${iy}, ${radius},
         ${validFrom}, ${validTo})
      RETURNING *
    `;
    return res.json(rowToPermit(result.rows[0]));
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM permits`;
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
