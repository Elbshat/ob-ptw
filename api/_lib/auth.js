import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET      = process.env.JWT_SECRET      || "change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME  || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD  || "ptw2025";

export function verifyCredentials(username, password) {
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compareSync(password || "", ADMIN_PASSWORD);
}

export function signToken(username) {
  return jwt.sign({ role: "editor", username }, JWT_SECRET, { expiresIn: "12h" });
}

export function requireEditor(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return { ok: false, status: 401, error: "No token" };
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    if (decoded.role !== "editor") return { ok: false, status: 403, error: "Read-only" };
    return { ok: true, user: decoded };
  } catch {
    return { ok: false, status: 401, error: "Invalid token" };
  }
}

export function handleCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return true; }
  return false;
}
