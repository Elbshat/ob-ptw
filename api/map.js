import { sql } from "@vercel/postgres";
import { put, del } from "@vercel/blob";
import { ensureSchema } from "./_lib/db.js";
import { requireEditor, handleCors } from "./_lib/auth.js";

export const config = { api: { bodyParser: { sizeLimit: "15mb" } } };

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = requireEditor(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await ensureSchema();
  const { image, natW, natH } = req.body;
  if (!image || !natW || !natH) return res.status(400).json({ error: "Missing fields" });

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(image);
  if (!match) return res.status(400).json({ error: "Invalid image data" });
  const [, mime, b64] = match;
  const ext = mime.split("/")[1].replace("+xml", "");
  const buffer = Buffer.from(b64, "base64");

  try {
    const prev = await sql`SELECT image_url FROM map WHERE id = 1`;
    const prevUrl = prev.rows[0]?.image_url;
    if (prevUrl) await del(prevUrl);
  } catch (e) { /* non-fatal */ }

  const filename = `plot-${Date.now()}.${ext}`;
  const blob = await put(filename, buffer, { access: "public", contentType: mime });

  await sql`
    UPDATE map SET image_url = ${blob.url}, nat_w = ${natW}, nat_h = ${natH}, updated_at = NOW()
    WHERE id = 1
  `;
  await sql`DELETE FROM permits`;

  res.json({ ok: true, imageUrl: blob.url });
}
