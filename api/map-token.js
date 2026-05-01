import { handleUpload } from "@vercel/blob/multipart";
import { verifyToken } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  
  try {
    verifyToken(req); // only editors can upload
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const jsonResponse = await handleUpload({
    body: req.body,
    request: req,
    onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes: ["image/png", "image/jpeg"],
      maximumSizeInBytes: 20 * 1024 * 1024, // 20MB allowed
    }),
    onUploadCompleted: async ({ blob }) => {
      // optionally save URL to DB here
    },
  });

  return res.json(jsonResponse);
}