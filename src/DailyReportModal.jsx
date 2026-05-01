import { useState } from "react";
import { overlapsDay, csvEscape, inputStyle, smBtn } from "./helpers.js";

export default function DailyReportModal({ permits, onClose }) {
  const todayStr = (() => {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  })();
  const [day, setDay] = useState(todayStr);

  const dayStart = new Date(`${day}T00:00:00`).getTime();
  const dayEnd   = new Date(`${day}T23:59:59.999`).getTime();

  const dayPermits = permits
    .filter(p => overlapsDay(p, dayStart, dayEnd))
    .sort((a, b) => (a.workCenter || "").localeCompare(b.workCenter || "") || a.number.localeCompare(b.number));

  const downloadCSV = () => {
    const header = ["PTW Number", "Main Work Center", "Description"];
    const rows = dayPermits.map(p => [p.number, p.workCenter || "", p.description || ""]);
    const csv = [header, ...rows].map(r => r.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `PTW_Daily_Report_${day}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return alert("Pop-up blocked. Please allow pop-ups.");
    const rowsHtml = dayPermits.map((p, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${(p.number || "").replace(/</g, "&lt;")}</td>
        <td>${(p.workCenter || "").replace(/</g, "&lt;")}</td>
        <td>${(p.description || "").replace(/</g, "&lt;")}</td>
      </tr>`).join("");
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>PTW Daily Report — ${day}</title>
<style>
body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#222}
h1{margin:0 0 4px;font-size:20px}
.sub{color:#666;font-size:12px;margin-bottom:18px}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #999;padding:6px 9px;vertical-align:top}
th{background:#f0f0f0;text-align:left}
td:first-child{width:36px}td:nth-child(2){width:160px;font-weight:bold}td:nth-child(3){width:200px}
.empty{color:#888;text-align:center;padding:30px}
@media print{body{padding:12px}button{display:none}}
</style></head><body>
<h1>PTW Daily Report</h1>
<div class="sub">Date: ${day} · Total: ${dayPermits.length} permit${dayPermits.length === 1 ? "" : "s"} · Generated ${new Date().toLocaleString()}</div>
${dayPermits.length === 0
  ? `<div class="empty">No permits valid on ${day}.</div>`
  : `<table><thead><tr><th>#</th><th>PTW Number</th><th>Main Work Center</th><th>Description</th></tr></thead><tbody>${rowsHtml}</tbody></table>`}
<script>setTimeout(()=>window.print(),200)</script>
</body></html>`);
    win.document.close();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#13161D", border: "1px solid #2E3445", borderRadius: 10, padding: 22, width: 760, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F2F5", letterSpacing: 1 }}>📋 DAILY PTW REPORT</div>
            <div style={{ fontSize: 10, color: "#5A6070", marginTop: 2 }}>Permits valid on the selected day</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5A6070", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 11, color: "#8090A0" }}>Date:</label>
          <input type="date" value={day} onChange={e => setDay(e.target.value)} style={{ ...inputStyle, width: 170 }} />
          <button onClick={() => setDay(todayStr)} style={smBtn}>TODAY</button>
          <span style={{ fontSize: 11, color: "#8090A0", marginLeft: 8 }}>
            {dayPermits.length} permit{dayPermits.length === 1 ? "" : "s"}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={printReport} disabled={dayPermits.length === 0}
              style={{ ...smBtn, opacity: dayPermits.length === 0 ? 0.4 : 1 }}>🖨 PRINT</button>
            <button onClick={downloadCSV} disabled={dayPermits.length === 0}
              style={{ background: "linear-gradient(135deg,#FF6B00,#FF2D78)", border: "none", borderRadius: 4, color: "#fff", padding: "6px 14px", fontSize: 11, cursor: dayPermits.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 700, opacity: dayPermits.length === 0 ? 0.4 : 1 }}>
              ⬇ DOWNLOAD CSV
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", border: "1px solid #1E2330", borderRadius: 6 }}>
          {dayPermits.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#3A4050", fontSize: 12 }}>No permits valid on {day}.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead style={{ position: "sticky", top: 0, background: "#1A1E28", zIndex: 1 }}>
                <tr>
                  {["PTW NUMBER", "MAIN WORK CENTER", "DESCRIPTION"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#FFB347", borderBottom: "1px solid #2E3445", fontWeight: 700, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayPermits.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "7px 10px", color: p.typeInfo.color, fontWeight: 700, borderBottom: "1px solid #1E2330", verticalAlign: "top", whiteSpace: "nowrap" }}>{p.number}</td>
                    <td style={{ padding: "7px 10px", color: "#C8CDD8", borderBottom: "1px solid #1E2330", verticalAlign: "top", whiteSpace: "nowrap" }}>{p.workCenter || "—"}</td>
                    <td style={{ padding: "7px 10px", color: "#A0B0C0", borderBottom: "1px solid #1E2330", verticalAlign: "top", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{p.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
