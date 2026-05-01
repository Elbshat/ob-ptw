import { sql } from "@vercel/postgres";
import { ensureSchema, rowToPermit } from "../_lib/db.js";
import { requireEditor, handleCors } from "../_lib/auth.js";

// Safely parse datetime-local string → ISO string Postgres accepts
const toISO = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = requireEditor(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  try {
    await ensureSchema();
  } catch (e) {
    return res.status(500).json({ error: "Schema init failed: " + e.message });
  }

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

    // ✅ Convert to proper ISO timestamps
    const vFrom = toISO(validFrom);
    const vTo   = toISO(validTo);

    try {
      const result = await sql`
        INSERT INTO permits
          (number, work_center, description, type, ix, iy, radius, valid_from, valid_to)
        VALUES
          (${number}, ${workCenter}, ${description}, ${type}, ${ix}, ${iy}, ${radius},
           ${vFrom}, ${vTo})
        RETURNING *
      `;
      return res.json(rowToPermit(result.rows[0]));
    } catch (e) {
      console.error("Insert permit failed:", e.message);
      return res.status(500).json({ error: "DB insert failed: " + e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM permits`;
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}