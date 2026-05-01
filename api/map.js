import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";
import { ensureSchema } from "./_lib/db.js";
import { requireEditor, handleCors } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = requireEditor(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await ensureSchema();

  const { url, natW, natH } = req.body;
  if (!url || !natW || !natH) return res.status(400).json({ error: "Missing fields" });

  // ✅ Safely delete old blob — fully isolated, never crashes the handler
  try {
    const prev = await sql`SELECT image_url FROM map WHERE id = 1`;
    const prevUrl = prev.rows[0]?.image_url;
    if (prevUrl && typeof prevUrl === "string" && prevUrl.startsWith("https://")) {
      await del(prevUrl);
    }
  } catch (e) {
    console.warn("Old blob delete skipped:", e.message);
  }

  // ✅ Save new URL
  try {
    await sql`
      UPDATE map SET image_url = ${url}, nat_w = ${natW}, nat_h = ${natH}, updated_at = NOW()
      WHERE id = 1
    `;
    await sql`DELETE FROM permits`;
  } catch (e) {
    console.error("DB update failed:", e.message);
    return res.status(500).json({ error: "DB update failed: " + e.message });
  }

  res.json({ ok: true, imageUrl: url });
}