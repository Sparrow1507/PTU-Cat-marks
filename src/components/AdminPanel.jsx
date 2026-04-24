import { useState, useEffect } from "react";
import { db, uid } from "../lib/supabase.js";
import { Sidebar, MainContent } from "./Sidebar.jsx";
import { FormManager } from "./FormManager.jsx";
import { Btn, Card, StatCard, Label, Alert, Badge, Spinner } from "./UI.jsx";
// ─── NEW: Import Icons ────────────────────────────────────────────────────────
import { LayoutDashboard, Users, Shield, ClipboardList, GraduationCap, CheckCircle, Plus } from "lucide-react";

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

  // Replaced emojis with Lucide icons
  const navItems = [
    { key: "dashboard", icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: "Dashboard" },
    { key: "teachers",  icon: <Users size={20} strokeWidth={1.5} />, label: "Teachers" },
    { key: "admins",    icon: <Shield size={20} strokeWidth={1.5} />,  label: "Admins" },
    { key: "forms",     icon: <ClipboardList size={20} strokeWidth={1.5} />, label: "All Forms" },
  ];

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar navItems={navItems} activeView={view} onNav={setView} role="admin" userName={user.name} onLogout={onLogout} />
      <MainContent>
        {view === "dashboard" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px", color: "var(--text-primary)" }}>Dashboard</h2>
            {loading ? <Spinner /> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "16px", marginBottom: "28px" }}>
                  <StatCard icon={<ClipboardList size={32} strokeWidth={1.5} />} label="Total Forms"   value={stats.forms}     color="var(--accent)" />
                  <StatCard icon={<Users size={32} strokeWidth={1.5} />}         label="Teachers"      value={stats.teachers}  color="var(--success)" />
                  <StatCard icon={<GraduationCap size={32} strokeWidth={1.5} />} label="Students"      value={stats.students}  color="var(--warning)" />
                  <StatCard icon={<CheckCircle size={32} strokeWidth={1.5} />}   label="Responses"     value={stats.responses} color="var(--danger)" />
                </div>
                <Card>
                  <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Recent Forms</h3>
                  {recentForms.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No forms yet.</p> : recentForms.map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{f.title}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>/form/{f.slug}</div>
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
  const [newT, setNewT] = useState({ name: "", username: "", password: "", email: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setTeachers(await db.get("teachers")); setLoading(false); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newT.name || !newT.username || !newT.password) { setMsg({ type: "error", text: "Fill all required fields." }); return; }
    const existing = teachers.find(t => t.username === newT.username);
    if (existing) { setMsg({ type: "error", text: "Username already taken." }); return; }
    await db.insert("teachers", { ...newT, id: uid(), active: true, createdAt: new Date().toISOString() });
    setNewT({ name: "", username: "", password: "", email: "" });
    setMsg({ type: "success", text: "Teacher added successfully!" });
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
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Add New Teacher</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          {[["name","Full Name *","text"],["username","Username *","text"],["password","Password *","password"],["email","Email","email"]].map(([k,p,t]) => (
            <div key={k}>
              <Label>{p}</Label>
              <input type={t} value={newT[k]} placeholder={p.replace(" *","")}
                onChange={e => setNewT(f => ({...f,[k]:e.target.value}))} />
            </div>
          ))}
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
        <Btn variant="success" onClick={add} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} strokeWidth={2} /> Add Teacher
        </Btn>
      </Card>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
          All Teachers {loading ? "" : `(${teachers.length})`}
        </h3>
        {loading ? <Spinner /> : teachers.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No teachers added yet.</p>
        ) : teachers.map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>@{t.username}{t.email ? ` · ${t.email}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
  const [newA, setNewA] = useState({ name: "", username: "", password: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setAdmins(await db.get("admins")); setLoading(false); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newA.name || !newA.username || !newA.password) { setMsg({ type: "error", text: "All fields required." }); return; }
    if (newA.password.length < 6) { setMsg({ type: "error", text: "Password min 6 chars." }); return; }
    if (admins.find(a => a.username === newA.username)) { setMsg({ type: "error", text: "Username taken." }); return; }
    await db.insert("admins", { ...newA, id: uid(), active: true, createdAt: new Date().toISOString() });
    setNewA({ name: "", username: "", password: "" });
    setMsg({ type: "success", text: "Admin added!" });
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
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Add New Admin</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          {[["name","Display Name","text"],["username","Username","text"],["password","Password","password"]].map(([k,p,t]) => (
            <div key={k}>
              <Label>{p} *</Label>
              <input type={t} value={newA[k]} placeholder={p}
                onChange={e => setNewA(f => ({...f,[k]:e.target.value}))} />
            </div>
          ))}
        </div>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}
        <Btn variant="primary" onClick={add} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
           <Plus size={16} strokeWidth={2} /> Add Admin
        </Btn>
      </Card>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
          All Admins {loading ? "" : `(${admins.length})`}
        </h3>
        {loading ? <Spinner /> : admins.map(a => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.name} {a.id === currentAdminId && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>(you)</span>}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>@{a.username}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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