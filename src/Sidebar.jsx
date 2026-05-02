import { PERMIT_TYPES, permitStatus, timeRemaining, inputStyle,toLocalInput } from "./helpers.js";

export default function Sidebar({ selPermit, conflictIds, isEditor, plotImage, selected, updatePermit, removePermit }) {
  return (
    <div style={{ width: 280, background: "#13161D", borderLeft: "1px solid #1E2330", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E2330" }}>
        <div style={{ fontSize: 10, color: "#5A6070", letterSpacing: 1, marginBottom: 8 }}>PERMIT TYPES</div>
        {PERMIT_TYPES.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#8090A0" }}>{t.label}</span>
          </div>
        ))}
      </div>

      {selPermit ? (
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #1E2330", overflowY: "auto", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#5A6070", letterSpacing: 1, marginBottom: 8 }}>SELECTED</div>
          <div style={{ background: "#1A1E28", borderRadius: 6, padding: "10px 12px", border: `1px solid ${conflictIds.has(selPermit.id) ? "#FF2D2D55" : selPermit.typeInfo.color + "44"}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: selPermit.typeInfo.color, marginBottom: 2 }}>{selPermit.number}</div>
            <div style={{ fontSize: 10, color: "#8090A0", marginBottom: 8 }}>{selPermit.typeInfo.label}</div>

            {(() => {
              const st     = selPermit.liveStatus    || permitStatus(selPermit);
              const remain = selPermit.liveRemaining || timeRemaining(selPermit);
              return (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: st.color, background: st.color + "1A", border: `1px solid ${st.color}55`, padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>● {st.label}</span>
                  {remain && st.code === "active" && <span style={{ fontSize: 10, color: "#A0B0C0", marginLeft: 6 }}>{remain}</span>}
                </div>
              );
            })()}

            <div style={{ fontSize: 9, color: "#5A6070", marginBottom: 3, marginTop: 8 }}>WORK CENTER</div>
            {isEditor ? (
              <input value={selPermit.workCenter || ""}
                onChange={e => updatePermit(selPermit.id, { workCenter: e.target.value })}
                placeholder="—" style={{ ...inputStyle, fontSize: 11, padding: "5px 7px", marginBottom: 8 }} />
            ) : (
              <div style={{ fontSize: 11, color: "#A0B0C0", marginBottom: 8, padding: "3px 0" }}>{selPermit.workCenter || "—"}</div>
            )}

            <div style={{ fontSize: 9, color: "#5A6070", marginBottom: 3 }}>DESCRIPTION</div>
            {isEditor ? (
              <textarea value={selPermit.description || ""}
                onChange={e => updatePermit(selPermit.id, { description: e.target.value })}
                placeholder="—" rows={3}
                style={{ ...inputStyle, fontSize: 11, padding: "5px 7px", marginBottom: 8, resize: "vertical", fontFamily: "inherit", lineHeight: 1.4 }} />
            ) : (
              <div style={{ fontSize: 11, color: "#A0B0C0", marginBottom: 8, padding: "3px 0", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{selPermit.description || "—"}</div>
            )}

            <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 6 }}>
              Zone: <span style={{ color: "#A0B0C0" }}>{selPermit.radius > 0 ? `${Math.round(selPermit.radius)} px` : "not set"}</span>
            </div>

            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "#5A6070", marginBottom: 3 }}>VALID FROM</div>
              <input type="datetime-local" value={selPermit.validFrom ? toLocalInput(new Date(selPermit.validFrom)) : ""} disabled={!isEditor}
                onChange={e => updatePermit(selPermit.id, { validFrom: e.target.value })}
                style={{ ...inputStyle, fontSize: 10, padding: "5px 7px", marginBottom: 6 }} />
              <div style={{ fontSize: 9, color: "#5A6070", marginBottom: 3 }}>VALID TO</div>
              <input type="datetime-local" value={selPermit.validFrom ? toLocalInput(new Date(selPermit.validFrom)) : ""} disabled={!isEditor}
                onChange={e => updatePermit(selPermit.id, { validTo: e.target.value })}
                style={{ ...inputStyle, fontSize: 10, padding: "5px 7px" }} />
            </div>

            {selPermit.radius === 0 && isEditor && (
              <div style={{ fontSize: 10, color: "#3A5060", marginBottom: 8, lineHeight: 1.5 }}>Drag the dot outward to draw the zone of influence</div>
            )}
            {selPermit.radius > 0 && isEditor && (
              <div style={{ fontSize: 10, color: "#3A5060", marginBottom: 8, lineHeight: 1.5 }}>Drag circle edge to resize zone</div>
            )}
            {conflictIds.has(selPermit.id) && (
              <div style={{ fontSize: 10, color: "#FF5555", background: "rgba(255,45,45,0.1)", borderRadius: 4, padding: "3px 7px", marginBottom: 8 }}>⚠ ZONE + TIME CONFLICT</div>
            )}

            {isEditor && (
              <button onClick={() => removePermit(selPermit.id)}
                style={{ width: "100%", background: "rgba(255,45,45,0.08)", border: "1px solid #FF2D2D33", borderRadius: 4, color: "#FF5555", padding: "5px", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                REMOVE PERMIT
              </button>
            )}
          </div>
        </div>
      ) : plotImage && (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#2A3040", lineHeight: 2.2 }}>
            Click empty map → add permit<br />
            Click dot → select<br />
            Drag dot → move<br />
            Selected + drag out → set zone<br />
            Drag circle edge → resize<br />
            Right-drag → pan · Scroll → zoom
          </div>
        </div>
      )}
    </div>
  );
}
