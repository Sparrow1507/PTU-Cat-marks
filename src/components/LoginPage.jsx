import { useState } from "react";
import { db, supabase } from "../lib/supabase.js"; 
import { GlassCard, Btn, Label, Alert, ThemeToggle } from "./UI.jsx";
import { useTheme } from "../lib/theme.jsx";
import { 
  Shield, GraduationCap, User, ArrowRight, Mail, 
  ArrowLeft, Eye, EyeOff 
} from "lucide-react";

export function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("admin");
  const [view, setView] = useState("login"); // "login" | "reset"
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(""); 
  const [loading, setLoading] = useState(false);
  const { theme, toggle } = useTheme();

  const handleLogin = async () => {
    setError(""); setMsg(""); setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (authError) throw new Error("Invalid email or password.");
      const authId = authData.user.id;

      if (tab === "admin") {
        const admins = await db.getWhere("admins", "auth_id", authId);
        if (admins.length > 0 && admins[0].active) {
          onLogin({ role: "admin", name: admins[0].name, id: admins[0].id });
        } else {
          await supabase.auth.signOut();
          throw new Error("You do not have Admin access.");
        }
      } else {
        const teachers = await db.getWhere("teachers", "auth_id", authId);
        if (teachers.length > 0 && teachers[0].active) {
          onLogin({ role: "teacher", name: teachers[0].name, id: teachers[0].id, ...teachers[0] });
        } else {
          await supabase.auth.signOut();
          throw new Error("You do not have Teacher access.");
        }
      }
    } catch (err) {
      setError(err.message || "Connection error.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!form.email) {
      setError("Please enter your email address first.");
      return;
    }
    setError(""); setMsg(""); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
        redirectTo: window.location.origin, 
      });
      if (error) throw error;
      setMsg("Reset link sent! Check your email inbox.");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative" }}>
      {/* Dynamic Background Orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(102,126,234,0.08) 0%, transparent 70%)", top: "-100px", left: "-100px" }} />
      </div>

      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 10 }}>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>

      <GlassCard style={{ padding: "48px", width: "100%", maxWidth: "400px", zIndex: 1 }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", color: "var(--accent)" }}>
            <GraduationCap size={52} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, background: "linear-gradient(135deg,#667eea,#f64f59)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "4px" }}>
            PTU-EduMarks
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {view === "login" ? "Student Marks Management System" : "Recover your account"}
          </p>
        </div>

        {view === "login" ? (
          <div key="login-view">
            {/* Tab Switcher */}
            <div style={{ display: "flex", background: "var(--bg-elevated)", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
              {[["admin", "Admin", <Shield size={14} key="a"/>], ["teacher", "Teacher", <User size={14} key="t"/>]].map(([t, label, icon]) => (
                <button key={t} onClick={() => { setTab(t); setError(""); setMsg(""); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "7px", border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: "13px", background: tab === t ? "linear-gradient(135deg,#667eea,#764ba2)" : "transparent",
                    color: tab === t ? "#fff" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    transition: "all 0.2s ease"
                  }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: "14px" }}>
              <Label>Email</Label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ptu.edu" />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <Label>Password</Label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type={showPass ? "text" : "password"} 
                  value={form.password} 
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", paddingRight: "45px" }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "12px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <button onClick={() => { setView("reset"); setError(""); setMsg(""); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Forgot Password?
              </button>
            </div>

            {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}

            <Btn variant="primary" style={{ width: "100%", padding: "14px", justifyContent: "center", display: "flex", gap: "8px" }} onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : <>Sign In <ArrowRight size={18} /></>}
            </Btn>
          </div>
        ) : (
          /* RESET VIEW - Fixed Button and Layout */
          <div className="fade-in" key="reset-view">
            <div style={{ marginBottom: "24px" }}>
              <Label>Email Address</Label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                placeholder="name@ptu.edu" 
                style={{ width: "100%" }}
              />
            </div>

            {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}
            {msg && <Alert type="success" style={{ marginBottom: '16px' }}>{msg}</Alert>}

            <Btn 
              variant="primary" 
              style={{ 
                width: "100%", 
                padding: "14px", 
                marginBottom: "20px", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                gap: "10px", 
                fontWeight: "700" 
              }} 
              onClick={handleResetPassword} 
              disabled={loading}
            >
              {loading ? "Sending..." : (
                <>
                  <span>Send Reset Link</span>
                  <Mail size={18} />
                </>
              )}
            </Btn>

            <button onClick={() => { setView("login"); setError(""); setMsg(""); }} 
              style={{ 
                background: "none", border: "none", color: "var(--text-secondary)", 
                fontSize: "13px", fontWeight: 600, cursor: "pointer", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                gap: "8px", width: "100%" 
              }}>
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}