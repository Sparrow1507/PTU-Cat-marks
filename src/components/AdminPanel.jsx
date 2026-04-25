import { useState, useEffect } from "react";
import { db, uid, authAdminClient } from "../lib/supabase.js"; 
import { Sidebar, MainContent } from "./Sidebar.jsx";
import { FormManager } from "./FormManager.jsx";
import { Btn, Card, StatCard, Label, Alert, Badge, Spinner } from "./UI.jsx";
import { LayoutDashboard, Users, Shield, ClipboardList, GraduationCap, CheckCircle, Plus, Eye, EyeOff } from "lucide-react";

export function AdminPanel({ user, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [stats, setStats] = useState({ forms: 0, teachers: 0, students: 0, responses: 0 });
  const [recentForms, setRecentForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [forms, teachers, students, responses] = await Promise.all([
        db.get("forms"), db.get("teachers"), db.get("students"), db.get("responses"),
      ]);
      setStats({ forms: forms.length, teachers: teachers.length, students: students.length, responses: responses.length });
      setRecentForms(forms.slice(-5).reverse());
      setLoading(false);
    };
    if (view === "dashboard") load();
  }, [view]);

  const navItems = [
    { key: "dashboard", icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: "Dashboard" },
    { key: "teachers",  icon: <Users size={20} strokeWidth={1.5} />, label: "Teachers" },
    { key: "admins",    icon: <Shield size={20} strokeWidth={1.5} />,  label: "Admins" },
    { key: "forms",     icon: <ClipboardList size={20} strokeWidth={1.5} />, label: "All Forms" },
  ];

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* 💡 FIX: Added responsive CSS classes for mobile wrapping */}
      <style>{`
        .responsive-input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .responsive-list-item { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); gap: 12px; }
        .responsive-list-info { flex: 1 1 200px; min-width: 0; }
        .responsive-list-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      `}</style>

      <Sidebar navItems={navItems} activeView={view} onNav={setView} role="admin" userName={user.name} onLogout={onLogout} />
      <MainContent>
        {view === "dashboard" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px", color: "var(--text-primary)" }}>Dashboard</h2>
            {loading ? <Spinner /> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                  <StatCard icon={<ClipboardList size={32} strokeWidth={1.5} />} label="Total Forms"   value={stats.forms}     color="var(--accent)" />
                  <StatCard icon={<Users size={32} strokeWidth={1.5} />}         label="Teachers"      value={stats.teachers}  color="var(--success)" />
                  <StatCard icon={<GraduationCap size={32} strokeWidth={1.5} />} label="Students"      value={stats.students}  color="var(--warning)" />
                  <StatCard icon={<CheckCircle size={32} strokeWidth={1.5} />}   label="Responses"     value={stats.responses} color="var(--danger)" />
                </div>
                <Card>
                  <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Recent Forms</h3>
                  {recentForms.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No forms yet.</p> : recentForms.map(f => (
                    <div key={f.id} className="responsive-list-item">
                      <div className="responsive-list-info">
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{f.title}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all" }}>/form/{f.slug}</div>
                      </div>
                      <Badge color={f.isOpen ? "green" : "red"}>{f.isOpen ? "Open" : "Closed"}</Badge>
                    </div>
                  ))}
                </Card>
              </>
            )}
          </div>
        )}
        {view === "teachers" && <TeacherManager />}
        {view === "admins"   && <AdminManager currentAdminId={user.id} />}
        {view === "forms"    && <FormManager user={user} isAdmin={true} />}
      </MainContent>
    </div>
  );
}

// ─── TEACHER MANAGER ──────────────────────────────────────────────────────────
function TeacherManager() {
  const [teachers, setTeachers] = useState([]);
  const [newT, setNewT] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => { setLoading(true); setTeachers(await db.get("teachers")); setLoading(false); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newT.name || !newT.email || !newT.password) { setMsg({ type: "error", text: "Fill all required fields." }); return; }
    if (teachers.find(t => t.email === newT.email)) { setMsg({ type: "error", text: "Teacher with this email already exists." }); return; }
    
    setMsg(null);
    
    const { data: authData, error: authErr } = await authAdminClient.auth.signUp({
      email: newT.email.trim(),
      password: newT.password,
    });

    if (authErr) { setMsg({ type: "error", text: authErr.message }); return; }
    if (!authData?.user) { setMsg({ type: "error", text: "Failed to create user account." }); return; }

    await db.insert("teachers", { 
      id: uid(), 
      name: newT.name, 
      email: newT.email.trim(), 
      auth_id: authData.user.id,
      active: true, 
      createdAt: new Date().toISOString() 
    });
    
    setNewT({ name: "", email: "", password: "" });
    setShowPassword(false);
    setMsg({ type: "success", text: "Teacher account created successfully!" });
    load();
  };

  const toggleActive = async (t) => {
    await db.update("teachers", t.id, { active: !t.active });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Remove this teacher? Their forms will remain.")) return;
    await db.del("teachers", id);
    load();
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px", color: "var(--text-primary)" }}>Manage Teachers</h2>

      <Card style={{ marginBottom: "24px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Create New Teacher</h3>

        {/* 💡 FIX: Applied responsive grid class */}
        <div className="responsive-input-grid" style={{ marginBottom: "12px" }}>
          {[
            ["name", "Full Name *", "text"],
            ["email", "Teacher Email *", "email"],
            ["password", "Password *", "password"]
          ].map(([k, p, t]) => (
            <div key={k}>
              <Label>{p}</Label>
              {t === "password" ? (
                <div style={{ position: "relative" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newT[k]} 
                    placeholder="Min 6 characters"
                    onChange={e => setNewT(f => ({...f,[k]:e.target.value}))} 
                    style={{ width: "100%", paddingRight: "36px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                      display: "flex", alignItems: "center", padding: "4px"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              ) : (
                <input type={t} value={newT[k]} placeholder={p.replace(" *","")}
                  onChange={e => setNewT(f => ({...f,[k]:e.target.value}))} />
              )}
            </div>
          ))}
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
        <Btn variant="success" onClick={add} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} strokeWidth={2} /> Create Teacher Account
        </Btn>
      </Card>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
          All Teachers {loading ? "" : `(${teachers.length})`}
        </h3>
        {loading ? <Spinner /> : teachers.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No teachers added yet.</p>
        ) : teachers.map(t => (
          // 💡 FIX: Applied responsive list classes
          <div key={t.id} className="responsive-list-item">
            <div className="responsive-list-info">
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all" }}>{t.email}</div>
            </div>
            <div className="responsive-list-actions">
              <Badge color={t.active !== false ? "green" : "red"}>{t.active !== false ? "Active" : "Deactivated"}</Badge>
              <Btn variant="ghost" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => toggleActive(t)}>
                {t.active !== false ? "Deactivate" : "Activate"}
              </Btn>
              <Btn variant="danger" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => remove(t.id)}>Remove</Btn>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── ADMIN MANAGER ────────────────────────────────────────────────────────────
function AdminManager({ currentAdminId }) {
  const [admins, setAdmins] = useState([]);
  const [newA, setNewA] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => { setLoading(true); setAdmins(await db.get("admins")); setLoading(false); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newA.name || !newA.email || !newA.password) { setMsg({ type: "error", text: "All fields required." }); return; }
    if (newA.password.length < 6) { setMsg({ type: "error", text: "Password min 6 chars." }); return; }
    if (admins.find(a => a.email === newA.email)) { setMsg({ type: "error", text: "Admin with this email already exists." }); return; }
    
    setMsg(null);

    const { data: authData, error: authErr } = await authAdminClient.auth.signUp({
      email: newA.email.trim(),
      password: newA.password,
    });

    if (authErr) { setMsg({ type: "error", text: authErr.message }); return; }
    if (!authData?.user) { setMsg({ type: "error", text: "Failed to create user account." }); return; }

    await db.insert("admins", { 
      id: uid(), 
      name: newA.name, 
      email: newA.email.trim(), 
      auth_id: authData.user.id,
      active: true, 
      createdAt: new Date().toISOString() 
    });
    
    setNewA({ name: "", email: "", password: "" });
    setShowPassword(false);
    setMsg({ type: "success", text: "Admin account created successfully!" });
    load();
  };

  const toggleActive = async (a) => {
    if (a.id === currentAdminId) { setMsg({ type: "error", text: "Cannot deactivate yourself." }); return; }
    await db.update("admins", a.id, { active: !a.active });
    load();
  };

  const remove = async (id) => {
    if (id === currentAdminId) { setMsg({ type: "error", text: "Cannot remove yourself." }); return; }
    if (admins.filter(a => a.active !== false).length <= 1) { setMsg({ type: "error", text: "Must keep at least one active admin." }); return; }
    if (!confirm("Remove this admin account?")) return;
    await db.del("admins", id);
    load();
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px", color: "var(--text-primary)" }}>Manage Admins</h2>

      <Card style={{ marginBottom: "24px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Create New Admin</h3>
        
        {/* 💡 FIX: Applied responsive grid class */}
        <div className="responsive-input-grid" style={{ marginBottom: "12px" }}>
          {[
            ["name", "Display Name *", "text"],
            ["email", "Admin Email *", "email"],
            ["password", "Password *", "password"]
          ].map(([k, p, t]) => (
            <div key={k}>
              <Label>{p}</Label>
              {t === "password" ? (
                <div style={{ position: "relative" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newA[k]} 
                    placeholder="Min 6 characters"
                    onChange={e => setNewA(f => ({...f,[k]:e.target.value}))} 
                    style={{ width: "100%", paddingRight: "36px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                      display: "flex", alignItems: "center", padding: "4px"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              ) : (
                <input type={t} value={newA[k]} placeholder={p.replace(" *","")}
                  onChange={e => setNewA(f => ({...f,[k]:e.target.value}))} />
              )}
            </div>
          ))}
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
        <Btn variant="primary" onClick={add} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
           <Plus size={16} strokeWidth={2} /> Create Admin Account
        </Btn>
      </Card>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
          All Admins {loading ? "" : `(${admins.length})`}
        </h3>
        {loading ? <Spinner /> : admins.map(a => (
          // 💡 FIX: Applied responsive list classes
          <div key={a.id} className="responsive-list-item">
            <div className="responsive-list-info">
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.name} {a.id === currentAdminId && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>(you)</span>}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all" }}>{a.email}</div>
            </div>
            <div className="responsive-list-actions">
              <Badge color={a.active !== false ? "green" : "red"}>{a.active !== false ? "Active" : "Deactivated"}</Badge>
              {a.id !== currentAdminId && <>
                <Btn variant="ghost" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => toggleActive(a)}>
                  {a.active !== false ? "Deactivate" : "Activate"}
                </Btn>
                <Btn variant="danger" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => remove(a.id)}>Remove</Btn>
              </>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}