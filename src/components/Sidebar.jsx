import { useState } from "react";
import { useTheme } from "../lib/theme.jsx";
import { ThemeToggle } from "./UI.jsx";
import { GraduationCap, Shield, User, LogOut, Menu, X } from "lucide-react";

export function Sidebar({ navItems, activeView, onNav, role, userName, onLogout }) {
  const { theme, toggle } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const roleColor = role === "admin" ? "#f7971e" : "var(--success)";
  const roleLabel = role === "admin" ? "ADMIN PANEL" : "TEACHER PANEL";

  return (
    <>
      {/* ─── INJECTED MOBILE STYLES (Isolated) ─── */}
      <style>{`
        .mobile-topbar { display: none; }
        .sidebar-overlay { display: none; }
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .desktop-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .desktop-sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open {
            display: block; position: fixed; inset: 0;
            background: rgba(0,0,0,0.5); z-index: 999;
            backdrop-filter: blur(3px);
          }
          .mobile-close-btn { display: block !important; }
        }
      `}</style>

      {/* ─── MOBILE HEADER ─── */}
      <div className="mobile-topbar" style={{
        alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", background: "var(--bg-base)",
        borderBottom: "1px solid var(--border)", position: "fixed",
        top: 0, left: 0, right: 0, zIndex: 998
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "var(--text-primary)" }}>
          <GraduationCap size={24} color="var(--accent)" /> PTU-EduMarks
        </div>
        <button onClick={() => setIsOpen(true)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", cursor: "pointer" }}>
          <Menu size={26} />
        </button>
      </div>

      {/* ─── MOBILE OVERLAY ─── */}
      <div className={`sidebar-overlay ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(false)} />

      {/* ─── ORIGINAL SIDEBAR ─── */}
      <div className={`desktop-sidebar ${isOpen ? "open" : ""}`} style={{
        width: "230px", minHeight: "100vh", flexShrink: 0,
        background: "var(--sidebar-bg)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid var(--border)",
        padding: "24px 14px",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        overflowY: "auto",
      }}>
        
        {/* Mobile Close Button */}
        <div className="mobile-close-btn" style={{ display: "none", textAlign: "right", marginBottom: "10px" }}>
          <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center", color: "var(--accent)" }}>
            <GraduationCap size={40} strokeWidth={1.5} />
          </div>
          <div style={{ fontWeight: 800, fontSize: "17px", background: "linear-gradient(135deg,#667eea,#f64f59)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PTU-EduMarks
          </div>
          <div style={{ fontSize: "10px", color: roleColor, fontWeight: 700, letterSpacing: "0.08em", marginTop: "2px" }}>
            {roleLabel}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map(n => {
            const active = activeView === n.key;
            return (
              <button
                key={n.key}
                onClick={() => { onNav(n.key); setIsOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%", padding: "11px 14px", borderRadius: "10px",
                  border: "none", cursor: "pointer", marginBottom: "4px",
                  background: active ? "linear-gradient(135deg,#667eea,#764ba2)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  fontWeight: 600, fontSize: "13px", textAlign: "left",
                  fontFamily: "inherit", transition: "all 0.18s",
                  boxShadow: active ? "0 2px 12px rgba(102,126,234,0.3)" : "none",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-glass-hover)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>
                {role === "admin" ? <Shield size={14} color="#f7971e" /> : <User size={14} color="var(--success)" />} 
                {userName}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "capitalize", marginTop: "2px" }}>{role}</div>
            </div>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%", padding: "9px", borderRadius: "8px",
              border: "1px solid var(--border)", cursor: "pointer",
              background: "transparent", color: "var(--danger)",
              fontWeight: 600, fontSize: "12px", fontFamily: "inherit",
              transition: "all 0.18s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(246,79,89,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </>
  );
}

export function MainContent({ children }) {
  return (
    <>
      {/* Adds padding to the top ONLY on mobile so content doesn't hide under the header */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-main-content { padding: 80px 16px 24px 16px !important; }
        }
      `}</style>
      <div className="mobile-main-content" style={{ flex: 1, padding: "32px", overflowY: "auto", minHeight: "100vh" }}>
        {children}
      </div>
    </>
  );
}