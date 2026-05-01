import { put } from "@vercel/blob";
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  // Convert base64 body → Buffer → upload to Blob
  const { imageBase64, natW, natH } = req.body;
  const buffer = Buffer.from(imageBase64.split(",")[1], "base64");

  const { url } = await put("plot-plan.png", buffer, { access: "public" });

  await sql`
    UPDATE map SET image_url = ${url}, nat_w = ${natW}, nat_h = ${natH},
    updated_at = NOW() WHERE id = 1
  `;

  res.json({ ok: true, url });
}