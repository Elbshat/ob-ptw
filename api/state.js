import { sql } from "@vercel/postgres";
import { ensureSchema, rowToPermit } from "./_lib/db.js";
import { handleCors } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    await ensureSchema();

    const mapRes = await sql`
      SELECT image_url AS image, nat_w AS "natW", nat_h AS "natH", updated_at AS "updatedAt"
      FROM map WHERE id = 1
    `;
    const permitsRes = await sql`SELECT * FROM permits ORDER BY id ASC`;

    res.json({
      map: mapRes.rows[0] || null,
      permits: permitsRes.rows.map(rowToPermit),
    });
  } catch (e) {
    console.error("state error:", e.message);
    res.status(500).json({ error: e.message });
  }
}