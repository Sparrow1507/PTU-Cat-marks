// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────
import { Sun, Moon } from "lucide-react";

export function Btn({ variant = "primary", children, style, ...props }) {
  const base = {
    padding: "9px 20px", borderRadius: "8px", border: "none",
    cursor: "pointer", fontWeight: 600, fontSize: "13px",
    transition: "all 0.18s", display: "inline-flex", alignItems: "center",
    gap: "6px", whiteSpace: "nowrap", fontFamily: "inherit",
  };
  const variants = {
    primary:  { background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", boxShadow: "0 2px 12px rgba(102,126,234,0.35)" },
    success:  { background: "linear-gradient(135deg,#43e97b,#38f9d7)", color: "#0d1a10", boxShadow: "0 2px 12px rgba(67,233,123,0.25)" },
    danger:   { background: "linear-gradient(135deg,#f64f59,#c0392b)", color: "#fff", boxShadow: "0 2px 12px rgba(246,79,89,0.25)" },
    warning:  { background: "linear-gradient(135deg,#f7971e,#ffd200)", color: "#1a0a00", boxShadow: "0 2px 12px rgba(247,151,30,0.25)" },
    ghost:    { background: "var(--bg-glass)", color: "var(--text-secondary)", border: "1px solid var(--border) !important", boxShadow: "none" },
    outline:  { background: "transparent", color: "var(--accent)", border: "1px solid var(--accent) !important", boxShadow: "none" },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, style, accent, ...props }) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: `1px solid var(--border)`,
        borderRadius: "14px",
        padding: "20px",
        marginBottom: "16px",
        boxShadow: "var(--shadow)",
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCard({ children, style, ...props }) {
  return (
    <div
      style={{
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        boxShadow: "var(--shadow-lg)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function Label({ children, style, error }) {
  return (
    <label style={{
      display: "block", fontSize: "11px", fontWeight: 700,
      color: error ? "var(--danger)" : "var(--text-muted)",
      marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.06em",
      ...style,
    }}>
      {children}
    </label>
  );
}

export function Badge({ color = "blue", children }) {
  const colors = {
    green:  { bg: "rgba(67,233,123,0.12)",  border: "rgba(67,233,123,0.3)",  text: "var(--success)" },
    red:    { bg: "rgba(246,79,89,0.12)",   border: "rgba(246,79,89,0.3)",   text: "var(--danger)" },
    blue:   { bg: "rgba(102,126,234,0.12)", border: "rgba(102,126,234,0.3)", text: "var(--accent)" },
    orange: { bg: "rgba(247,151,30,0.12)",  border: "rgba(247,151,30,0.3)",  text: "var(--warning)" },
    purple: { bg: "rgba(118,75,162,0.15)",  border: "rgba(118,75,162,0.3)",  text: "#b794f4" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 700,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>
      {children}
    </span>
  );
}

export function Spinner({ size = 20, color = "var(--accent)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}22`,
      borderTop: `2px solid ${color}`,
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}

export function Alert({ type = "info", children }) {
  const colors = { info: "var(--accent)", success: "var(--success)", error: "var(--danger)", warning: "var(--warning)" };
  const bg     = { info: "rgba(102,126,234,0.1)", success: "rgba(67,233,123,0.1)", error: "rgba(246,79,89,0.1)", warning: "rgba(247,151,30,0.1)" };
  return (
    <div style={{
      padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
      background: bg[type], border: `1px solid ${colors[type]}44`,
      color: colors[type], marginBottom: "12px",
    }}>
      {children}
    </div>
  );
}

export function StatCard({ icon, label, value, color }) {
  return (
    <Card style={{ textAlign: "center", padding: "24px 16px" }}>
      <div style={{ fontSize: "30px", marginBottom: "8px", display: "flex", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: "30px", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600 }}>{label}</div>
    </Card>
  );
}

export function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        background: "var(--bg-glass)", border: "1px solid var(--border)",
        borderRadius: "8px", padding: "7px 10px", cursor: "pointer",
        color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
    </button>
  );
}

// Inject spin keyframe once
if (typeof document !== "undefined" && !document.getElementById("em-spin")) {
  const s = document.createElement("style");
  s.id = "em-spin";
  s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}