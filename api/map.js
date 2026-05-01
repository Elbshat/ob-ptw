import { sql } from "@vercel/postgres";
import { ensureSchema } from "./_lib/db.js";
import { verifyToken } from "./_lib/auth.js";
import { del } from "@vercel/blob";

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === "POST") {
    try {
      verifyToken(req);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { url, natW, natH } = req.body; // just a URL string now ✅

    // Delete old blob if exists
    const { rows } = await sql`SELECT image_url FROM map WHERE id = 1`;
    if (rows[0]?.image_url) {
      try { await del(rows[0].image_url); } catch {}
    }

    await sql`
      UPDATE map SET image_url=${url}, nat_w=${natW}, nat_h=${natH},
      updated_at=NOW() WHERE id=1
    `;
    return res.json({ ok: true });
  }

  res.status(405).end();
}