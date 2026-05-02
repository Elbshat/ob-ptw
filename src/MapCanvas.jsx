import { permitStatus } from "./helpers.js";

export default function MapCanvas({
  canvasRef, plotImage, imageReady, pan, zoom, natSize,
  permits, conflictPairs, conflictIds, selected, isEditor,
  handleImageLoad, handleCanvasMouseDown, handleCanvasMouseUp,
  cursorMode, fileRef,
}) {
  return (
    <div ref={canvasRef}
      style={{ flex: 1, position: "relative", overflow: "hidden", background: "#090B10", cursor: cursorMode }}
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleCanvasMouseUp}
      onContextMenu={e => e.preventDefault()}>

      {!plotImage && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 10, color: "#2A3040", textAlign: "center", lineHeight: 2.2 }}>
            {isEditor ? "Load your plot plan (PNG / JPG)" : "No map loaded yet. Waiting for editor…"}
          </div>
          {isEditor && (
            <button onClick={() => fileRef.current.click()} style={{ background: "linear-gradient(135deg,#FF6B00,#FF2D78)", border: "none", borderRadius: 6, color: "#fff", padding: "8px 20px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              LOAD PLOT PLAN
            </button>
          )}
        </div>
      )}

      {plotImage && (
        <div style={{
          position: "absolute",
          transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0", userSelect: "none",
          visibility: imageReady ? "visible" : "hidden",
        }}>
          <img key={plotImage} src={plotImage} onLoad={handleImageLoad}
            style={{ display: "block", width: natSize.w, height: natSize.h, maxWidth: "none" }}
            draggable={false} alt="plot plan" crossOrigin="anonymous" />
          <svg width={natSize.w} height={natSize.h}
            style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }}>
            
            {/* CSS Animation for active permits */}
            <defs>
              <style>{`
                @keyframes pulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                }
                .active-pulse {
                  animation: pulse 2s ease-in-out infinite;
                  transform-origin: center;
                  transform-box: fill-box;
                }
              `}</style>
            </defs>

            {conflictPairs.map(([aId, bId], idx) => {
              const a = permits.find(p => p.id === aId);
              const b = permits.find(p => p.id === bId);
              if (!a || !b) return null;
              return (
                <g key={`cl-${idx}`}>
                  <line x1={a.ix} y1={a.iy} x2={b.ix} y2={b.iy}
                    stroke="#FF2D2D" strokeWidth={2/zoom}
                    strokeDasharray={`${8/zoom} ${4/zoom}`} opacity={0.5} />
                  <text x={(a.ix+b.ix)/2} y={(a.iy+b.iy)/2 - 8/zoom}
                    textAnchor="middle" fill="#FF5555"
                    fontSize={10/zoom} fontFamily="monospace" fontWeight="bold">⚠ CONFLICT</text>
                </g>
              );
            })}

            {permits.map(p => {
              const isConflict = conflictIds.has(p.id);
              const isSel = selected === p.id;
              const status = permitStatus(p);
              const dimmed = status.code === "expired" || status.code === "scheduled";
              const col = p.typeInfo.color;
              const dotR = 8/zoom;
              const opacity = status.code === "expired" ? 0.35 : status.code === "scheduled" ? 0.7 : 1;
              return (
                <g key={p.id} opacity={opacity}>
                  <title>{p.number}{p.workCenter ? ` · ${p.workCenter}` : ""}{p.description ? `\n${p.description}` : ""}</title>
                  {p.radius > 0 && (
                    <circle cx={p.ix} cy={p.iy} r={p.radius}
                      fill={isConflict ? "rgba(255,45,45,0.12)" : p.typeInfo.bg}
                      stroke={isConflict ? "#FF2D2D" : col}
                      strokeWidth={isSel ? 2.5/zoom : 1.5/zoom}
                      strokeDasharray={isConflict || dimmed ? `${8/zoom} ${4/zoom}` : "none"}
                      className={status.code === "active" && !isConflict ? "active-pulse" : ""} />
                  )}
                  {isSel && p.radius > 0 && isEditor && (
                    <circle cx={p.ix + p.radius} cy={p.iy} r={7/zoom} fill={col} stroke="#fff" strokeWidth={1.5/zoom} />
                  )}
                  {isSel && (
                    <circle cx={p.ix} cy={p.iy} r={dotR + 6/zoom} fill="none" stroke={col} strokeWidth={1.5/zoom} opacity={0.4} />
                  )}
                  <circle cx={p.ix} cy={p.iy} r={dotR} fill={col}
                    stroke={isConflict ? "#FF2D2D" : "#0D0F14"} strokeWidth={2/zoom} />
                  <text x={p.ix} y={p.iy + dotR + 12/zoom}
                    textAnchor="middle" fill={col}
                    fontSize={10/zoom} fontFamily="monospace" fontWeight="bold">{p.number}</text>
                  <text x={p.ix} y={p.iy + dotR + 24/zoom}
                    textAnchor="middle" fill={status.color}
                    fontSize={8/zoom} fontFamily="monospace">{status.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {plotImage && (
        <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: 10, color: "#2A3540", pointerEvents: "none", lineHeight: 1.7 }}>
          Scroll/+-/0 → zoom · Right-drag → pan{isEditor ? " · Drag dot → move · Edge → resize zone" : ""}
        </div>
      )}
    </div>
  );
}
