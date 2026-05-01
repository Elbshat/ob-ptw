import { PERMIT_TYPES, toLocalInput, inputStyle, smBtn } from "./helpers.js";

export default function AddPermitModal({ form, setForm, onAdd, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#13161D", border: "1px solid #2E3445", borderRadius: 10, padding: 22, width: 420, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F2F5", marginBottom: 16 }}>ADD PERMIT TO WORK</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>PTW NUMBER *</div>
          <input value={form.number}
            onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) onAdd(); }}
            placeholder="e.g. PTW-2025-0412" autoFocus style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>MAIN WORK CENTER *</div>
          <input value={form.workCenter}
            onChange={e => setForm(p => ({ ...p, workCenter: e.target.value }))}
            placeholder="e.g. WELLHEAD-A / COMPRESSION" list="work-centers" style={inputStyle} />
          <datalist id="work-centers">
            <option value="WELLHEAD" /><option value="MANIFOLD" />
            <option value="SEPARATION" /><option value="COMPRESSION" />
            <option value="METERING" /><option value="UTILITIES" />
            <option value="FLARE" /><option value="CONTROL ROOM" />
            <option value="STORAGE" /><option value="LOADING" />
          </datalist>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>PTW DESCRIPTION</div>
          <textarea value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Brief description of work scope…" rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.4 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 8 }}>PERMIT TYPE</div>
          <div style={{ display: "flex", gap: 8 }}>
            {PERMIT_TYPES.map(t => (
              <button key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))} style={{
                flex: 1, padding: "9px 0", borderRadius: 6, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                background: form.type === t.id ? t.color + "22" : "#1A1E28",
                border: form.type === t.id ? `2px solid ${t.color}` : "1px solid #2E3445",
                color: form.type === t.id ? t.color : "#6070A0",
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>VALID FROM</div>
            <input type="datetime-local" value={form.validFrom}
              onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>VALID TO</div>
            <input type="datetime-local" value={form.validTo}
              onChange={e => setForm(p => ({ ...p, validTo: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[{ lbl: "+4 h", hrs: 4 }, { lbl: "+8 h", hrs: 8 }, { lbl: "+12 h", hrs: 12 }, { lbl: "+24 h", hrs: 24 }].map(b => (
            <button key={b.lbl}
              onClick={() => {
                const start = form.validFrom ? new Date(form.validFrom) : new Date();
                const end = new Date(start.getTime() + b.hrs * 3600 * 1000);
                setForm(p => ({ ...p, validFrom: toLocalInput(start), validTo: toLocalInput(end) }));
              }}
              style={{ ...smBtn, flex: 1, padding: "5px 0", fontSize: 10 }}>{b.lbl}</button>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "#3A4050", marginBottom: 16, lineHeight: 1.6 }}>
          A {form.type === "hot" ? "🔴 red" : "🔵 blue"} dot will be placed. Select it later and drag outward to set the zone of influence.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#1A1E28", border: "1px solid #2E3445", borderRadius: 6, color: "#8090A0", padding: "8px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
          <button onClick={onAdd} style={{ flex: 2, background: "linear-gradient(135deg,#FF6B00,#FF2D78)", border: "none", borderRadius: 6, color: "#fff", padding: "8px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>ADD ➔</button>
        </div>
      </div>
    </div>
  );
}
