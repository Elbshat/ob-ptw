import { useState, useRef, useEffect, useCallback } from "react";
import { typeInfoOf, toLocalInput, getConflictPairs, fmtDT, permitStatus, timeRemaining, smBtn } from "./helpers.js";
import { upload } from "@vercel/blob/client";
import { api } from "./api.js";
import LoginModal from "./LoginModal.jsx";
import AddPermitModal from "./AddPermitModal.jsx";
import DailyReportModal from "./DailyReportModal.jsx";
import ListTab from "./ListTab.jsx";
import Sidebar from "./Sidebar.jsx";
import MapCanvas from "./MapCanvas.jsx";


export default function PTWMap() {
  const [permits, setPermits]       = useState([]);
  const [plotImage, setPlotImage]   = useState(null);
  const [natSize, setNatSize]       = useState({ w: 1, h: 1 });
  const [imageReady, setImageReady] = useState(false);
  const [zoom, setZoom]             = useState(1);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [showModal, setShowModal]   = useState(false);
  const [showLogin, setShowLogin]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [pendingPos, setPendingPos] = useState(null);
  const [form, setForm]             = useState({
    number: "", workCenter: "", description: "",
    type: "hot", validFrom: "", validTo: "",
  });
  const [loginForm, setLoginForm]   = useState({ username: "", password: "", err: "" });
  const [selected, setSelected]     = useState(null);
  const [tab, setTab]               = useState("map");
  const [, forceUpdate]             = useState(0);
  const [, tickClock]               = useState(0);
  const [token, setToken]           = useState(() => localStorage.getItem("ptw_token") || null);
  const [username, setUsername]     = useState(() => localStorage.getItem("ptw_user") || null);
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState("");

  const isEditor = !!token;

  const zoomRef     = useRef(1);
  const panRef      = useRef({ x: 0, y: 0 });
  const permitsRef  = useRef([]);
  const interRef    = useRef(null);
  const didMoveRef  = useRef(false);
  const canvasRef   = useRef(null);
  const fileRef     = useRef(null);
  const tokenRef    = useRef(token);
  const patchTimers = useRef({});
  const plotRef     = useRef(null);

  // Keep refs in sync
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { permitsRef.current = permits; }, [permits]);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { plotRef.current = plotImage; }, [plotImage]);

  // ── Load state from server ──────────────────────────────────────
  const loadState = useCallback(async () => {
    // Don't poll if user is actively interacting (prevents overwriting local changes)
    if (interRef.current) return;
    
    try {
      const { map, permits: srvPermits } = await api.get("/api/state");
      const hydrated = srvPermits.map(p => ({ ...p, typeInfo: typeInfoOf(p.type) }));
      setPermits(hydrated);
      if (map?.image && map.image !== plotRef.current) {
        setPlotImage(map.image);
        if (map.natW && map.natH) setNatSize({ w: map.natW, h: map.natH });
      } else if (!map?.image) {
        setPlotImage(null);
      }
    } catch {
      setSyncStatus("⚠ offline");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadState(); }, []);

  // Poll every 5s so viewers see editor's changes
  // Increased to 1m to reduce interference with editing
  useEffect(() => {
    const t = setInterval(loadState, 60 * 1000);
    return () => clearInterval(t);
  }, [loadState]);

  // Tick clock every 30s for active/expired badges
  useEffect(() => {
    const t = setInterval(() => tickClock(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Auth ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginForm(f => ({ ...f, err: "" }));
    try {
      const { token: tk, username: u } = await api.send("POST", "/api/login", {
        username: loginForm.username,
        password: loginForm.password,
      });
      localStorage.setItem("ptw_token", tk);
      localStorage.setItem("ptw_user", u);
      setToken(tk);
      setUsername(u);
      setShowLogin(false);
      setLoginForm({ username: "", password: "", err: "" });
    } catch {
      setLoginForm(f => ({ ...f, err: "Invalid credentials" }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ptw_token");
    localStorage.removeItem("ptw_user");
    setToken(null);
    setUsername(null);
  };

  // ── API call wrapper with sync status ───────────────────────────
  const apiCall = useCallback(async (fn) => {
    try {
      setSyncStatus("⏳ saving…");
      const result = await fn();
      setSyncStatus("✓ saved");
      setTimeout(() => setSyncStatus(""), 1500);
      return result;
    } catch (e) {
      setSyncStatus("⚠ save failed");
      console.error(e);
      if (String(e.message).includes("Invalid token") || String(e.message).includes("No token")) {
        handleLogout();
        alert("Session expired. Please log in again.");
      }
      throw e;
    }
  }, []);

  // Debounced patch — coalesces rapid drag/resize updates
  const schedulePatch = (id, patch) => {
    if (!tokenRef.current) return;
    clearTimeout(patchTimers.current[id]);
    patchTimers.current[id] = setTimeout(() => {
      apiCall(() => api.send("PATCH", `/api/permits/${id}`, patch, tokenRef.current)).catch(() => {});
    }, 350);
  };

  // ── Derived data ────────────────────────────────────────────────
  const conflictPairs = getConflictPairs(permits);
  const conflictIds   = new Set(conflictPairs.flat());

  // ── Coordinate helpers ──────────────────────────────────────────
  const toImg = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top  - panRef.current.y) / zoomRef.current,
    };
  };

  const applyZoomAt = useCallback((factor, cx, cy) => {
    const oldZ = zoomRef.current;
    const newZ = Math.min(Math.max(oldZ * factor, 0.02), 50);
    if (newZ === oldZ) return;
    const oldP = panRef.current;
    const newP = {
      x: cx - (cx - oldP.x) * (newZ / oldZ),
      y: cy - (cy - oldP.y) * (newZ / oldZ),
    };
    zoomRef.current = newZ;
    panRef.current = newP;
    setZoom(newZ);
    setPan(newP);
  }, []);

  // ── Image load → auto-fit ──────────────────────────────────────
  const handleImageLoad = (e) => {
    const img = e.target;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    setNatSize({ w: nw, h: nh });
    if (!canvasRef.current) return;
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    const fitZ = Math.min(cw / nw, ch / nh) * 0.95;
    const px = (cw - nw * fitZ) / 2;
    const py = (ch - nh * fitZ) / 2;
    zoomRef.current = fitZ;
    panRef.current = { x: px, y: py };
    setZoom(fitZ);
    setPan({ x: px, y: py });
    setImageReady(true);
  };

  // ── Wheel zoom ─────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!plotRef.current) return;
      e.preventDefault();
      const base = e.ctrlKey ? 1.05 : e.shiftKey ? 1.4 : 1.2;
      const factor = e.deltaY < 0 ? base : 1 / base;
      const rect = el.getBoundingClientRect();
      applyZoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [plotImage, applyZoomAt]); // Re-attach when plot image changes or applyZoomAt changes

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (showModal || showLogin || showReport) return;
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (!plotRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      if (e.key === "+" || e.key === "=") applyZoomAt(1.25, cx, cy);
      else if (e.key === "-" || e.key === "_") applyZoomAt(1 / 1.25, cx, cy);
      else if (e.key === "0") resetView();
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selected && isEditor) removePermit(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, showLogin, showReport, selected, isEditor, applyZoomAt, resetView, removePermit]);

  // ── Global drag / resize / pan handlers ─────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      const inter = interRef.current;
      if (!inter) return;
      didMoveRef.current = true;

      if (inter.mode === "drag") {
        const z = zoomRef.current;
        const dx = (e.clientX - inter.startMouseX) / z;
        const dy = (e.clientY - inter.startMouseY) / z;
        const nx = inter.startIX + dx;
        const ny = inter.startIY + dy;
        setPermits(prev => prev.map(p =>
          p.id === inter.id ? { ...p, ix: nx, iy: ny } : p
        ));
        schedulePatch(inter.id, { ix: nx, iy: ny });
      }

      if (inter.mode === "resize") {
        const ip = toImg(e.clientX, e.clientY);
        // Use locked center position from interRef, not current permit position
        const newR = Math.max(0, Math.sqrt(
          (ip.x - inter.centerX) ** 2 + (ip.y - inter.centerY) ** 2
        ));
        setPermits(prev => prev.map(p => {
          if (p.id !== inter.id) return p;
          return { ...p, radius: newR };
        }));
        schedulePatch(inter.id, { radius: newR });
      }

      if (inter.mode === "pan") {
        const newP = {
          x: inter.startPanX + (e.clientX - inter.startMouseX),
          y: inter.startPanY + (e.clientY - inter.startMouseY),
        };
        panRef.current = newP;
        setPan(newP);
      }
    };

    const onUp = () => {
      interRef.current = null;
      forceUpdate(n => n + 1);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Canvas mouse down ──────────────────────────────────────────
  const handleCanvasMouseDown = (e) => {
    if (!plotImage) return;
    e.preventDefault();
    didMoveRef.current = false;

    const ip = toImg(e.clientX, e.clientY);
    const z = zoomRef.current;
    const ps = permitsRef.current;

    // Right / middle click → pan
    if (e.button !== 0) {
      interRef.current = {
        mode: "pan",
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };
      return;
    }

    // Edge of zone circle → resize (editor only)
    if (isEditor) {
      for (const p of ps) {
        if (!p.radius) continue;
        const dist = Math.sqrt((ip.x - p.ix) ** 2 + (ip.y - p.iy) ** 2);
        if (Math.abs(dist - p.radius) < 12 / z) {
          interRef.current = { 
            mode: "resize", 
            id: p.id,
            centerX: p.ix,  // Lock center position
            centerY: p.iy,
            startRadius: p.radius
          };
          setSelected(p.id);
          return;
        }
      }
    }

    // Center dot
    for (const p of ps) {
      const dist = Math.sqrt((ip.x - p.ix) ** 2 + (ip.y - p.iy) ** 2);
      if (dist < 14 / z) {
        if (isEditor) {
          if (p.id === selected && !p.radius) {
            // Selected permit with no radius → drag-out to create zone
            interRef.current = { 
              mode: "resize", 
              id: p.id,
              centerX: p.ix,  // Lock center position
              centerY: p.iy,
              startRadius: 0
            };
          } else {
            interRef.current = {
              mode: "drag",
              id: p.id,
              startMouseX: e.clientX,
              startMouseY: e.clientY,
              startIX: p.ix,
              startIY: p.iy,
            };
          }
        }
        setSelected(p.id);
        return;
      }
    }

    // Empty area → will open modal on mouseup if no movement
    interRef.current = {
      mode: "place",
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      ix: ip.x,
      iy: ip.y,
    };
  };

  // ── Canvas mouse up ────────────────────────────────────────────
  const handleCanvasMouseUp = () => {
    const inter = interRef.current;
    if (!inter) return;
    if (inter.mode === "place" && !didMoveRef.current) {
      if (!isEditor) {
        setSelected(null);
      } else {
        setSelected(null);
        setPendingPos({ ix: inter.ix, iy: inter.iy });
        const now = new Date();
        const later = new Date(now.getTime() + 8 * 3600 * 1000);
        setForm({
          number: "",
          workCenter: "",
          description: "",
          type: "hot",
          validFrom: toLocalInput(now),
          validTo: toLocalInput(later),
        });
        setShowModal(true);
      }
    }
    interRef.current = null;
  };

  // ── Add permit ─────────────────────────────────────────────────
  const handleAddPermit = async () => {
    if (!form.number.trim()) return;
    if (!form.workCenter.trim()) {
      alert("Main Work Center is required");
      return;
    }
    if (
      form.validFrom &&
      form.validTo &&
      new Date(form.validFrom).getTime() > new Date(form.validTo).getTime()
    ) {
      alert("Valid-To must be after Valid-From");
      return;
    }
    try {
      const created = await apiCall(() =>
        api.send(
          "POST",
          "/api/permits",
          {
            number: form.number.trim(),
            workCenter: form.workCenter.trim(),
            description: form.description.trim(),
            type: form.type,
            ix: pendingPos.ix,
            iy: pendingPos.iy,
            radius: 0,
            validFrom: form.validFrom || null,
            validTo: form.validTo || null,
          },
          token
        )
      );
      setPermits(prev => [
        ...prev,
        { ...created, typeInfo: typeInfoOf(created.type) },
      ]);
      setShowModal(false);
    } catch {}
  };

  // ── Update permit ──────────────────────────────────────────────
  const updatePermit = async (id, patch) => {
    if (!isEditor) return;
    setPermits(prev =>
      prev.map(p => (p.id === id ? { ...p, ...patch } : p))
    );
    try {
      await apiCall(() =>
        api.send("PATCH", `/api/permits/${id}`, patch, token)
      );
    } catch {}
  };

  // ── Remove permit ──────────────────────────────────────────────
  const removePermit = useCallback(async (id) => {
    if (!isEditor) return;
    try {
      await apiCall(() =>
        api.send("DELETE", `/api/permits/${id}`, null, token)
      );
      setPermits(prev => prev.filter(p => p.id !== id));
      if (selected === id) setSelected(null);
    } catch {}
  }, [isEditor, token, selected]);

  // ── Map file upload ────────────────────────────────────────────
const onMapFile = async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  if (!isEditor) {
    alert("Only the editor can change the map.");
    return;
  }

  const { natW, natH } = await new Promise((resolve) => {
    const probe = new Image();
    const objectUrl = URL.createObjectURL(f);
    probe.onload = () => {
      resolve({ natW: probe.naturalWidth, natH: probe.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    probe.src = objectUrl;
  });

  try {
    setSyncStatus("⏳ uploading…");

    const { url } = await upload(f.name, f, {
      access: "public",
      handleUploadUrl: "/api/map-token",
      clientPayload: token,
    });

    // ✅ Show image IMMEDIATELY after blob upload — don't wait for DB
    setImageReady(false);
    setPlotImage(url);
    setNatSize({ w: natW, h: natH });
    setPermits([]);
    setSelected(null);

    // Save URL to DB separately — won't block the image display
    await apiCall(() =>
      api.send("POST", "/api/map", { url, natW, natH }, token)
    );

  } catch (err) {
    setSyncStatus("⚠ upload failed");
    console.error(err);
  }
};

  // ── Zoom helpers ───────────────────────────────────────────────
  const zoomBy = (factor) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    applyZoomAt(factor, rect.width / 2, rect.height / 2);
  };

  const resetView = useCallback(() => {
    if (!canvasRef.current) return;
    const cw = canvasRef.current.clientWidth;
    const ch = canvasRef.current.clientHeight;
    const fitZ = Math.min(cw / natSize.w, ch / natSize.h) * 0.95;
    const px = (cw - natSize.w * fitZ) / 2;
    const py = (ch - natSize.h * fitZ) / 2;
    zoomRef.current = fitZ;
    panRef.current = { x: px, y: py };
    setZoom(fitZ);
    setPan({ x: px, y: py });
  }, [natSize]);

  // ── Derived UI state ───────────────────────────────────────────
  const selPermit = permits.find(p => p.id === selected);
  const isInteracting = !!interRef.current;
  const cursorMode =
    isInteracting &&
    (interRef.current.mode === "pan" || interRef.current.mode === "drag")
      ? "grabbing"
      : plotImage
      ? isEditor
        ? "crosshair"
        : "default"
      : "default";

  const tabBtn = (id, label, isAlert) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        background: "transparent",
        border: "none",
        borderBottom:
          tab === id ? "2px solid #FF6B00" : "2px solid transparent",
        color: isAlert
          ? tab === id
            ? "#FF5555"
            : "#663333"
          : tab === id
          ? "#F0F2F5"
          : "#5A6070",
        padding: "8px 16px",
        fontSize: 11,
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: 0.8,
      }}
    >
      {label}
    </button>
  );

  // ── Loading screen ─────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          background: "#0D0F14",
          color: "#5A6070",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
        }}
      >
        Loading…
      </div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono','Courier New',monospace",
        background: "#0D0F14",
        color: "#C8CDD8",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ─── TOP BAR ─── */}
      <div
        style={{
          background: "#13161D",
          borderBottom: "1px solid #1E2330",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#F0F2F5",
              letterSpacing: 1,
            }}
          >
            PTW SPATIAL CHECKER
          </div>
          <div style={{ fontSize: 10, color: "#5A6070" }}>
            BAPETCO · OB GAS FIELD
          </div>
        </div>

        {/* Auth badge */}
        <div
          style={{
            background: isEditor
              ? "rgba(0,230,118,0.1)"
              : "rgba(128,144,160,0.1)",
            border: `1px solid ${isEditor ? "#00E676" : "#5A6070"}`,
            borderRadius: 5,
            padding: "3px 9px",
            fontSize: 11,
            color: isEditor ? "#00E676" : "#8090A0",
          }}
        >
          {isEditor ? `🔓 EDITOR (${username})` : "👁 READ-ONLY"}
        </div>

        {syncStatus && (
          <span style={{ fontSize: 10, color: "#5A6070" }}>{syncStatus}</span>
        )}

        {conflictIds.size > 0 && (
          <div
            style={{
              background: "rgba(255,45,45,0.15)",
              border: "1px solid #FF2D2D",
              borderRadius: 5,
              padding: "3px 9px",
              fontSize: 11,
              color: "#FF5555",
            }}
          >
            ⚠ {conflictPairs.length} CONFLICT
            {conflictPairs.length > 1 ? "S" : ""}
          </div>
        )}
        {conflictIds.size === 0 && permits.length > 0 && (
          <div
            style={{
              background: "rgba(0,230,118,0.1)",
              border: "1px solid #00E676",
              borderRadius: 5,
              padding: "3px 9px",
              fontSize: 11,
              color: "#00E676",
            }}
          >
            ✓ ALL CLEAR
          </div>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Daily report button */}
          <button
            onClick={() => setShowReport(true)}
            title="Daily PTW report"
            style={{
              ...smBtn,
              padding: "5px 12px",
              fontSize: 10,
              color: "#FFB347",
              borderColor: "#FFB34744",
            }}
          >
            📋 DAILY REPORT
          </button>

          {plotImage && (
            <>
              <button
                onClick={() => zoomBy(1 / 1.4)}
                style={{ ...smBtn, width: 30, height: 28, fontSize: 18 }}
              >
                −
              </button>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={Math.log(zoom) * 10}
                onChange={(e) => {
                  const newZ = Math.exp(parseFloat(e.target.value) / 10);
                  if (!canvasRef.current) return;
                  const rect = canvasRef.current.getBoundingClientRect();
                  applyZoomAt(
                    newZ / zoomRef.current,
                    rect.width / 2,
                    rect.height / 2
                  );
                }}
                style={{ width: 110, accentColor: "#FF6B00" }}
              />
              <button
                onClick={() => zoomBy(1.4)}
                style={{ ...smBtn, width: 30, height: 28, fontSize: 18 }}
              >
                +
              </button>
              <span
                style={{
                  fontSize: 11,
                  color: "#8090A0",
                  minWidth: 50,
                  textAlign: "center",
                }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={resetView}
                style={{ ...smBtn, padding: "4px 10px", fontSize: 10 }}
              >
                FIT
              </button>
              <div
                style={{ width: 1, height: 20, background: "#1E2330" }}
              />
            </>
          )}

          {isEditor ? (
            <>
              <button
                onClick={() => fileRef.current.click()}
                style={{ ...smBtn, padding: "5px 12px", fontSize: 10 }}
              >
                {plotImage ? "🔄 CHANGE MAP" : "📂 LOAD MAP"}
              </button>
              <button
                onClick={handleLogout}
                style={{ ...smBtn, padding: "5px 12px", fontSize: 10 }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={{
                ...smBtn,
                padding: "5px 12px",
                fontSize: 10,
                color: "#FF6B00",
                borderColor: "#FF6B0066",
              }}
            >
              🔐 LOGIN
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onMapFile}
          />
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div
        style={{
          background: "#13161D",
          borderBottom: "1px solid #1E2330",
          display: "flex",
          flexShrink: 0,
        }}
      >
        {tabBtn("map", "MAP", false)}
        {tabBtn("list", `PERMITS (${permits.length})`, false)}
        {tabBtn(
          "conflicts",
          `CONFLICTS (${conflictPairs.length})`,
          conflictPairs.length > 0
        )}
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* MAP TAB */}
        {tab === "map" && (
          <>
            <MapCanvas
              canvasRef={canvasRef}
              plotImage={plotImage}
              imageReady={imageReady}
              pan={pan}
              zoom={zoom}
              natSize={natSize}
              permits={permits}
              conflictPairs={conflictPairs}
              conflictIds={conflictIds}
              selected={selected}
              isEditor={isEditor}
              handleImageLoad={handleImageLoad}
              handleCanvasMouseDown={handleCanvasMouseDown}
              handleCanvasMouseUp={handleCanvasMouseUp}
              cursorMode={cursorMode}
              fileRef={fileRef}
            />
            <Sidebar
              selPermit={selPermit}
              conflictIds={conflictIds}
              isEditor={isEditor}
              plotImage={plotImage}
              selected={selected}
              updatePermit={updatePermit}
              removePermit={removePermit}
            />
          </>
        )}

        {/* LIST TAB */}
        {tab === "list" && (
          <ListTab
            permits={permits}
            conflictIds={conflictIds}
            isEditor={isEditor}
            removePermit={removePermit}
          />
        )}

        {/* CONFLICTS TAB */}
        {tab === "conflicts" && (
          <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
            {conflictPairs.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#00E676",
                  marginTop: 60,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 12 }}>
                  No conflicts detected. All zones clear.
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 640 }}>
                <div
                  style={{
                    marginBottom: 14,
                    fontSize: 12,
                    color: "#FF5555",
                  }}
                >
                  ⚠ {conflictPairs.length} overlapping pair
                  {conflictPairs.length > 1 ? "s" : ""} (spatial + temporal):
                </div>
                {conflictPairs.map(([aId, bId], idx) => {
                  const a = permits.find(p => p.id === aId);
                  const b = permits.find(p => p.id === bId);
                  if (!a || !b) return null;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(255,45,45,0.06)",
                        border: "1px solid #FF2D2D44",
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#FF5555",
                          marginBottom: 8,
                        }}
                      >
                        ⚠ CONFLICT #{idx + 1}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[a, b].map((p, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              background: "#1A1E28",
                              borderRadius: 5,
                              padding: "8px 10px",
                              border: `1px solid ${p.typeInfo.color}33`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 3,
                              }}
                            >
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: p.typeInfo.color,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: p.typeInfo.color,
                                }}
                              >
                                {p.number}
                              </span>
                            </div>
                            <div
                              style={{ fontSize: 10, color: "#8090A0" }}
                            >
                              {p.typeInfo.label}
                            </div>
                            {p.workCenter && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#FFB347",
                                  marginTop: 3,
                                }}
                              >
                                📍 {p.workCenter}
                              </div>
                            )}
                            {p.description && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#A0B0C0",
                                  marginTop: 3,
                                  lineHeight: 1.4,
                                  maxHeight: 40,
                                  overflow: "hidden",
                                }}
                              >
                                {p.description}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 10,
                                color: "#6070A0",
                                marginTop: 4,
                              }}
                            >
                              {fmtDT(p.validFrom)}
                            </div>
                            <div
                              style={{ fontSize: 10, color: "#6070A0" }}
                            >
                              → {fmtDT(p.validTo)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      {showModal && (
        <AddPermitModal
          form={form}
          setForm={setForm}
          onAdd={handleAddPermit}
          onClose={() => setShowModal(false)}
        />
      )}

      {showLogin && (
        <LoginModal
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showReport && (
        <DailyReportModal
          permits={permits}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
