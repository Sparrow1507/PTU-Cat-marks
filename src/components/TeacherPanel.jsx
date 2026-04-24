import { useState, useEffect } from "react";
import { db } from "../lib/supabase.js";
import { Sidebar, MainContent } from "./Sidebar.jsx";
import { FormManager } from "./FormManager.jsx";
import { StatCard, Spinner } from "./UI.jsx";
// ─── NEW: Import Icons ────────────────────────────────────────────────────────
import { LayoutDashboard, ClipboardList, GraduationCap, CheckCircle } from "lucide-react";

export function TeacherPanel({ user, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [stats, setStats] = useState({ forms: 0, students: 0, responses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view !== "dashboard") return;
    const load = async () => {
      setLoading(true);
      const [forms, students, responses] = await Promise.all([
        db.getWhere("forms", "teacherId", user.id),
        db.get("students"),
        db.get("responses"),
      ]);
      const formIds = forms.map(f => f.id);
      setStats({
        forms: forms.length,
        students: students.filter(s => formIds.includes(s.formId)).length,
        responses: responses.filter(r => formIds.includes(r.formId)).length,
      });
      setLoading(false);
    };
    load();
  }, [view, user.id]);

  // Replaced emojis with Lucide icons
  const navItems = [
    { key: "dashboard", icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: "Dashboard" },
    { key: "forms",     icon: <ClipboardList size={20} strokeWidth={1.5} />, label: "My Forms" },
  ];

  return (
    <div style={{ display: "flex", background: "var(--bg-base)", minHeight: "100vh" }}>
      <Sidebar navItems={navItems} activeView={view} onNav={setView} role="teacher" userName={user.name} onLogout={onLogout} />
      <MainContent>
        {view === "dashboard" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px", color: "var(--text-primary)" }}>
              Welcome back, {user.name} 👋
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "28px", fontSize: "14px" }}>Here's a snapshot of your activity.</p>
            {loading ? <Spinner /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: "16px" }}>
                <StatCard icon={<ClipboardList size={32} strokeWidth={1.5} />} label="My Forms"   value={stats.forms}     color="var(--accent)" />
                <StatCard icon={<GraduationCap size={32} strokeWidth={1.5} />} label="Students"   value={stats.students}  color="var(--warning)" />
                <StatCard icon={<CheckCircle size={32} strokeWidth={1.5} />}   label="Responses"  value={stats.responses} color="var(--success)" />
              </div>
            )}
          </div>
        )}
        {view === "forms" && <FormManager user={user} isAdmin={false} />}
      </MainContent>
    </div>
  );
}