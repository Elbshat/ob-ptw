export const PERMIT_TYPES = [
  { id: "hot",  label: "Hot Work",  color: "#FF3A2D", bg: "rgba(255,58,45,0.13)"  },
  { id: "cold", label: "Cold Work", color: "#2D9EFF", bg: "rgba(45,158,255,0.13)" },
];

export const typeInfoOf = (type) =>
  PERMIT_TYPES.find(t => t.id === type) || PERMIT_TYPES[0];

export const toLocalInput = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fmtDT = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const permitStatus = (p, now = Date.now()) => {
  if (!p.validFrom && !p.validTo) return { code: "open", label: "NO TIME", color: "#8090A0" };
  const s = p.validFrom ? new Date(p.validFrom).getTime() : -Infinity;
  const e = p.validTo   ? new Date(p.validTo).getTime()   :  Infinity;
  if (now < s) return { code: "scheduled", label: "SCHEDULED", color: "#FFB347" };
  if (now > e) return { code: "expired",   label: "EXPIRED",   color: "#5A6070" };
  return { code: "active", label: "ACTIVE", color: "#00E676" };
};

export const timeRemaining = (p, now = Date.now()) => {
  if (!p.validTo) return null;
  const diff = new Date(p.validTo).getTime() - now;
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h left`;
  if (h > 0)   return `${h}h ${m}m left`;
  return `${m}m left`;
};

export const timeOverlaps = (a, b) => {
  const aS = a.validFrom ? new Date(a.validFrom).getTime() : -Infinity;
  const aE = a.validTo   ? new Date(a.validTo).getTime()   :  Infinity;
  const bS = b.validFrom ? new Date(b.validFrom).getTime() : -Infinity;
  const bE = b.validTo   ? new Date(b.validTo).getTime()   :  Infinity;
  return aS <= bE && bS <= aE;
};

export const overlapsDay = (p, dayStart, dayEnd) => {
  const s = p.validFrom ? new Date(p.validFrom).getTime() : -Infinity;
  const e = p.validTo   ? new Date(p.validTo).getTime()   :  Infinity;
  return s <= dayEnd && e >= dayStart;
};

export function getConflictPairs(permits) {
  const pairs = [];
  for (let i = 0; i < permits.length; i++) {
    for (let j = i + 1; j < permits.length; j++) {
      const a = permits[i], b = permits[j];
      if (!a.radius || !b.radius) continue;
      if (!timeOverlaps(a, b)) continue;
      if (Math.sqrt((a.ix - b.ix) ** 2 + (a.iy - b.iy) ** 2) < a.radius + b.radius)
        pairs.push([a.id, b.id]);
    }
  }
  return pairs;
}

export const csvEscape = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const smBtn = {
  background: "#1E2330", border: "1px solid #2E3445", borderRadius: 4,
  color: "#A0AAB8", cursor: "pointer", fontFamily: "inherit",
};

export const inputStyle = {
  width: "100%", background: "#1A1E28", border: "1px solid #2E3445",
  borderRadius: 5, color: "#C8CDD8", padding: "7px 10px",
  fontSize: 12, fontFamily: "inherit", boxSizing: "border-box",
};
