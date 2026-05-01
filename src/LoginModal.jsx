import { inputStyle } from "./helpers.js";

export default function LoginModal({ loginForm, setLoginForm, handleLogin, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#13161D", border: "1px solid #2E3445", borderRadius: 10, padding: 22, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#F0F2F5", marginBottom: 16 }}>🔐 EDITOR LOGIN</div>

        {loginForm.err && (
          <div style={{ background: "rgba(255,45,45,0.1)", border: "1px solid #FF2D2D44", borderRadius: 5, padding: "6px 10px", fontSize: 11, color: "#FF5555", marginBottom: 12 }}>
            {loginForm.err}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>USERNAME</div>
          <input value={loginForm.username}
            onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
            autoFocus style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#5A6070", marginBottom: 4 }}>PASSWORD</div>
          <input type="password" value={loginForm.password}
            onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
            style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#1A1E28", border: "1px solid #2E3445", borderRadius: 6, color: "#8090A0", padding: "8px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
          <button onClick={handleLogin} style={{ flex: 2, background: "linear-gradient(135deg,#FF6B00,#FF2D78)", border: "none", borderRadius: 6, color: "#fff", padding: "8px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>LOGIN ➔</button>
        </div>
      </div>
    </div>
  );
}
