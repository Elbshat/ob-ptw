import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";
import { ensureSchema } from "./_lib/db.js";
import { requireEditor, handleCors } from "./_lib/auth.js"; // ✅ correct imports

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = requireEditor(req); // ✅ not verifyToken
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await ensureSchema();

  const { url, natW, natH } = req.body; // ✅ URL only, no base64
  if (!url || !natW || !natH) return res.status(400).json({ error: "Missing fields" });

  try {
    const prev = await sql`SELECT image_url FROM map WHERE id = 1`;
    const prevUrl = prev.rows[0]?.image_url;
    if (prevUrl) await del(prevUrl);
  } catch { /* non-fatal */ }

  await sql`
    UPDATE map SET image_url = ${url}, nat_w = ${natW}, nat_h = ${natH}, updated_at = NOW()
    WHERE id = 1
  `;
  await sql`DELETE FROM permits`;

  res.json({ ok: true, imageUrl: url });
}