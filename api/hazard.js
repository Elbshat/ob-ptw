import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";
import { ensureSchema } from "./_lib/db.js";
import { requireEditor, handleCors } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

    if (req.method === "POST" || req.method === "DELETE") {
  return res.status(403).json({ error: "Hazard layer changes are currently disabled." });
}

  // GET — return current hazard URL (for polling)
  if (req.method === "GET") {
    try {
      await ensureSchema();
      const result = await sql`SELECT hazard_url FROM map WHERE id = 1`;
      return res.json({ hazardUrl: result.rows[0]?.hazard_url || null });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }



  // POST — save new hazard URL
  if (req.method === "POST") {
    const auth = requireEditor(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing url" });

    try {
      await ensureSchema();

      // Delete old hazard blob
      const prev = await sql`SELECT hazard_url FROM map WHERE id = 1`;
      const prevUrl = prev.rows[0]?.hazard_url;
      if (prevUrl && prevUrl.startsWith("https://")) {
        try { await del(prevUrl); } catch {}
      }

      await sql`UPDATE map SET hazard_url = ${url}, updated_at = NOW() WHERE id = 1`;
      return res.json({ ok: true, hazardUrl: url });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE — remove hazard layer
  if (req.method === "DELETE") {
    const auth = requireEditor(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    try {
      await ensureSchema();
      const prev = await sql`SELECT hazard_url FROM map WHERE id = 1`;
      const prevUrl = prev.rows[0]?.hazard_url;
      if (prevUrl && prevUrl.startsWith("https://")) {
        try { await del(prevUrl); } catch {}
      }
      await sql`UPDATE map SET hazard_url = NULL, updated_at = NOW() WHERE id = 1`;
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}