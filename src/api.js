const API_BASE = "";

export const api = {
  async get(path) {
    const r = await fetch(`${API_BASE}${path}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async send(method, path, body, token) {
    const r = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(err || `${method} ${path} failed`);
    }
    return r.status === 204 ? null : r.json();
  },
};
