import { verifyCredentials, signToken, handleCors } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password } = req.body || {};
  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken(username);
  return res.json({ token, role: "editor", username });
}
