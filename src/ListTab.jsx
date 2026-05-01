import { useState } from "react";
import { permitStatus, timeRemaining, fmtDT } from "./helpers.js";

export default function ListTab({ permits, conflictIds, isEditor, removePermit }) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [centerFilter, setCF] = useState("all");

  const workCenters = Array.from(new Set(permits.map(p => p.workCenter).filter(Boolean))).sort();

  const filtered = permits.filter(p => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${p.number} ${p.workCenter || ""} ${p.description || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (centerFilter !== "all" && p.workCenter !== centerFilter) return false;
    if (filter === "hot"      && p.type !== "hot")  return false;
    if (filter === "cold"     && p.type !== "cold") return false;
    if (filter === "active"   && permitStatus(p).code !== "active")   return false;
    if (filter === "conflict" && !conflictIds.has(p.id)) return false;
    return true;
  });

  const is = { background: "#1A1E28", border: "1px solid #2E3445", borderRadius: 5, color: "#C8CDD8", padding: "6px 9px", fontSize: 11, fontFamily: "inherit" };
  const chip = (id, label, active) => (
    <button key={id} onClick={() => setFilter(id)} style={{
      background: active ? "#FF6B0022" : "#1A1E28",
      border: active ? "1px solid #FF6B00" : "1px solid #2E3445",
      color: active ? "#FF6B00" : "#8090A0",
      borderRadius: 4, padding: "4px 10px", fontSize: 10, cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  );

  return (
    <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", maxWidth: 900 }}>
        <input placeholder="🔍 Search number, work center, description…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...is, flex: 1, minWidth: 220 }} />
        <select value={centerFilter} onChange={e => setCF(e.target.value)} style={is}>
          <option value="all">All work centers</option>
          {workCenters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {chip("all", "ALL", filter === "all")}
        {chip("hot", "HOT", filter === "hot")}
        {chip("cold", "COLD", filter === "cold")}
        {chip("active", "ACTIVE", filter === "active")}
        {chip("conflict", "CONFLICT", filter === "conflict")}
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign: "center", color: "#3A4050", marginTop: 60, fontSize: 12 }}>
            {permits.length === 0 ? "No permits added yet." : "No permits match your filter."}
          </div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 900 }}>
            {filtered.map(p => {
              const st = permitStatus(p);
              const remain = timeRemaining(p);
              return (
                <div key={p.id} style={{ background: "#13161D", border: `1px solid ${conflictIds.has(p.id) ? "#FF2D2D" : "#1E2330"}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: p.typeInfo.color, flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F2F5" }}>{p.number}</span>
                      {p.workCenter && (
                        <span style={{ fontSize: 10, color: "#FFB347", background: "rgba(255,179,71,0.1)", border: "1px solid #FFB34744", borderRadius: 3, padding: "1px 6px" }}>{p.workCenter}</span>
                      )}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: 11, color: "#A0B0C0", marginTop: 4, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{p.description}</div>
                    )}
                    <div style={{ fontSize: 11, color: "#8090A0", marginTop: 4 }}>
                      {p.typeInfo.label} · Zone: {p.radius > 0 ? `${Math.round(p.radius)} px` : "not set"}
                    </div>
                    <div style={{ fontSize: 10, color: "#6070A0", marginTop: 2 }}>
                      {fmtDT(p.validFrom)} → {fmtDT(p.validTo)}
                      {remain && st.code === "active" && <span style={{ color: "#00E676" }}> · {remain}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: st.color, background: st.color + "1A", border: `1px solid ${st.color}55`, borderRadius: 4, padding: "2px 7px", fontWeight: 700, flexShrink: 0 }}>{st.label}</span>
                  {conflictIds.has(p.id)
                    ? <span style={{ fontSize: 11, color: "#FF5555", background: "rgba(255,45,45,0.1)", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>⚠</span>
                    : <span style={{ fontSize: 11, color: "#00E676", background: "rgba(0,230,118,0.08)", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>✓</span>}
                  {isEditor && (
                    <button onClick={() => removePermit(p.id)} style={{ background: "none", border: "none", color: "#3A4050", cursor: "pointer", fontSize: 18, flexShrink: 0 }}>×</button>
                  )}
                </div>
              );
            })}
          </div>}
    </div>
  );
}
