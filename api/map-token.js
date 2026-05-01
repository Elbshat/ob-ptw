import { handleUpload } from "@vercel/blob/client"; // ✅ back to /client
import { requireEditor, handleCors } from "./_lib/auth.js"; // ✅ correct functions

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const fakeReq = {
          headers: { authorization: `Bearer ${clientPayload}` },
        };
        const auth = requireEditor(fakeReq);
        if (!auth.ok) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/jpg"],
          maximumSizeInBytes: 30 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob }) => {},
    });

    return res.json(jsonResponse);
  } catch (err) {
    console.error("map-token error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}