import { useState, useEffect } from "react";
import { db, uid } from "../lib/supabase.js";
import { GlassCard, Btn, Label, Alert, Badge, Spinner, ThemeToggle } from "./UI.jsx";
import { useTheme } from "../lib/theme.jsx";
import { Search, Lock, GraduationCap, User, FileText, Edit2, CheckCircle2, XCircle, Save, AlertTriangle, X } from "lucide-react";

// ─── HELPER: GET MAX MARKS ────────────────────────────────────────────────────
const getSubjectMax = (sub) => {
  if (!sub) return 0;
  if (sub.overrideMax && Number(sub.overrideMax) > 0) return Number(sub.overrideMax);
  return sub.questions?.reduce((a, q) => a + Number(q.maxMarks || 0), 0) || 0;
};

// ─── GPAY SUCCESS ANIMATION COMPONENT ─────────────────────────────────────────
const GPaySuccessAnimation = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }} className="fade-in">
    <style>
      {`
        .gpay-circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #43E97B; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .gpay-check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards; }
        .gpay-pop { animation: scale 0.3s ease-in-out 0.9s both; }
        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
      `}
    </style>
    <svg className="gpay-pop" width="100" height="100" viewBox="0 0 52 52" style={{ borderRadius: '50%', display: 'block', margin: '0 auto' }}>
      <circle className="gpay-circle" cx="26" cy="26" r="25" />
      <path className="gpay-check" fill="none" stroke="#43E97B" strokeWidth="4" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
    </svg>
    <h3 style={{ marginTop: '24px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '20px' }}>
      Successfully Submitted!
    </h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
      Your response has been securely recorded.
    </p>
  </div>
);

// ─── PUBLIC FORM ROUTE ────────────────────────────────────────────────────────
export function PublicFormPage({ slug }) {
  const [form, setForm] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const forms = await db.get("forms");
      setForm(forms.find(f => f.slug === slug) || null);
      setLoading(false);
    };
    load();
  }, [slug]);

  const { theme, toggle } = useTheme();

  const Wrapper = ({ children }) => (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative" }}>
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 10 }}>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)", top: "-80px", right: "10%" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,151,30,0.07) 0%, transparent 70%)", bottom: "-40px", left: "5%" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "560px" }}>{children}</div>
    </div>
  );

  if (loading) return <Wrapper><div style={{ textAlign: "center", padding: "60px" }}><Spinner size={36} /></div></Wrapper>;

  if (!form) return (
    <Wrapper>
      <GlassCard style={{ padding: "48px", textAlign: "center" }} className="fade-in">
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", color: "var(--text-secondary)" }}>
          <Search size={48} strokeWidth={1.5} />
        </div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Form Not Found</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>The form link may be invalid or expired.</p>
      </GlassCard>
    </Wrapper>
  );

  if (!form.isOpen) return (
    <Wrapper>
      <GlassCard style={{ padding: "48px", textAlign: "center" }} className="fade-in">
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", color: "var(--text-secondary)" }}>
          <Lock size={48} strokeWidth={1.5} />
        </div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Form is Closed</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>This form is not currently accepting responses.</p>
      </GlassCard>
    </Wrapper>
  );

  if (!student) return <Wrapper><StudentLogin form={form} onLogin={setStudent} /></Wrapper>;
  return <Wrapper><StudentForm form={form} student={student} onLogout={() => setStudent(null)} /></Wrapper>;
}

// ─── STUDENT LOGIN ────────────────────────────────────────────────────────────
function StudentLogin({ form, onLogin }) {
  const [regNo, setRegNo] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError(""); setLoading(true);
    const students = await db.get("students");
    const student = students.find(s => s.regNo.trim() === regNo.trim() && s.dob === dob && s.formId === form.id);
    if (student) {
      onLogin(student);
    } else {
      setError("Invalid Register Number or Date of Birth. Please contact your teacher.");
    }
    setLoading(false);
  };

  return (
    <GlassCard style={{ padding: "40px" }} className="fade-in">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center", color: "var(--accent)" }}>
          <GraduationCap size={44} strokeWidth={1.5} />
        </div>
        <h2 style={{ fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>{form.title}</h2>
        {form.description && <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "4px" }}>{form.description}</p>}
        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>Enter your credentials to access the form</div>
      </div>
      <div style={{ marginBottom: "14px" }}>
        <Label>Register Number</Label>
        <input value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="e.g. 21CS001"
          onKeyDown={e => e.key === "Enter" && login()} />
      </div>
      <div style={{ marginBottom: "24px" }}>
        <Label>Date of Birth</Label>
        <input type="date" value={dob} onChange={e => setDob(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()} />
      </div>
      {error && <Alert type="error">{error}</Alert>}
      <Btn variant="primary" style={{ width: "100%", padding: "12px", justifyContent: "center" }}
        onClick={login} disabled={loading}>
        {loading ? "Checking…" : "Enter Form →"}
      </Btn>
    </GlassCard>
  );
}

// ─── STUDENT FORM ─────────────────────────────────────────────────────────────
function StudentForm({ form, student, onLogout }) {
  const [catId, setCatId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [attendance, setAttendance] = useState(null); 
  const [marks, setMarks] = useState({});
  const [errors, setErrors] = useState({});
  const [existingResp, setExistingResp] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [isEditing, setIsEditing] = useState(true);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const selectedCat = form.cats?.find(c => c.id === catId);
  const selectedSubject = selectedCat?.subjects?.find(s => s.id === subjectId);

  useEffect(() => {
    if (!catId || !subjectId) { 
      setExistingResp(null); setMarks({}); setAttendance(null); 
      setSubmitted(false); setIsEditing(true); setShowSuccessAnim(false);
      return; 
    }
    const load = async () => {
      const responses = await db.getWhere("responses", "studentId", student.id);
      const existing = responses.find(r => r.formId === form.id && r.catId === catId && r.subjectId === subjectId);
      if (existing) {
        setExistingResp(existing);
        setAttendance(existing.attendance || "present");
        if (existing.attendance !== "absent") {
          const allAnswers = await db.get("answers");
          const m = {};
          allAnswers.filter(a => a.responseId === existing.id).forEach(a => { m[a.questionId] = a.value; });
          setMarks(m);
        }
        
        const isSubmitted = !!existing.submittedAt;
        setSubmitted(isSubmitted);
        setIsEditing(!isSubmitted); 
      } else {
        setExistingResp(null); setMarks({}); setAttendance(null); 
        setSubmitted(false); setIsEditing(true);
      }
      setShowSuccessAnim(false); 
      setMsg(null);
    };
    load();
  }, [catId, subjectId, student.id, form.id]);

  const validate = () => {
    if (attendance === "absent") return true; 
    const errs = {};
    selectedSubject?.questions?.forEach(q => {
      const val = marks[q.id];
      if (val === undefined || val === "") { errs[q.id] = "Required"; return; }
      
      if (val !== "NA") {
        if (Number(val) < 0) { errs[q.id] = "Cannot be negative"; return; }
        if (Number(val) > Number(q.maxMarks)) { errs[q.id] = `Max is ${q.maxMarks}`; }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (isDraft = false) => {
    if (!attendance) { setMsg({ type: "error", text: "Please select attendance (Present / Absent) before submitting." }); return; }
    if (!isDraft && !validate()) return;
    setSaving(true);

    try {
      let respId;
      const now = isDraft ? null : new Date().toISOString();

      if (existingResp) {
        respId = existingResp.id;
        await db.update("responses", respId, { submittedAt: now, attendance });
        await db.delWhere("answers", "responseId", respId);
      } else {
        respId = uid();
        await db.insert("responses", {
          id: respId, formId: form.id, studentId: student.id,
          catId, subjectId, submittedAt: now, attendance,
        });
      }

      if (attendance === "absent") {
        const zeroAnswers = (selectedSubject?.questions || []).map(q => ({
          id: uid(), responseId: respId, questionId: q.id, value: "0",
        }));
        for (const a of zeroAnswers) await db.insert("answers", a);
      } else {
        const newAnswers = Object.entries(marks).map(([questionId, value]) => ({
          id: uid(), responseId: respId, questionId, value,
        }));
        for (const a of newAnswers) await db.insert("answers", a);
      }

      setExistingResp({ id: respId, attendance, submittedAt: now }); 

      if (isDraft) {
        setMsg({ type: "success", text: "Draft saved successfully!" });
      } else {
        setSubmitted(true);
        setShowSuccessAnim(true);
        setMsg(null);
        
        setTimeout(() => {
          setShowSuccessAnim(false);
          setIsEditing(false);
        }, 2500);
      }
    } catch (e) {
      setMsg({ type: "error", text: "Submit failed. Please try again." });
    }
    setSaving(false);
  };

  const total = attendance === "absent" ? 0 : Object.values(marks).reduce((a, b) => {
    return a + (b === "NA" ? 0 : (Number(b) || 0));
  }, 0);
  
  const maxTotal = getSubjectMax(selectedSubject);

  return (
    <GlassCard style={{ padding: "36px" }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "20px", color: "var(--text-primary)", marginBottom: "4px" }}>{form.title}</h2>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
            <User size={14} /> {student.name} <span style={{ margin: "0 4px" }}>·</span> <span style={{ color: "var(--accent)", fontFamily: "DM Mono, monospace" }}>{student.regNo}</span>
          </div>
        </div>
        
        {/* Close / Logout Button */}
        <button 
          onClick={onLogout}
          title="Sign Out"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            cursor: "pointer",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "var(--danger)"; }}
          onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* CAT select */}
      <div style={{ marginBottom: "14px" }}>
        <Label>Select CAT</Label>
        <select value={catId} onChange={e => { setCatId(e.target.value); setSubjectId(""); setAttendance(null); setMarks({}); setIsEditing(true); setShowSuccessAnim(false); }}>
          <option value="">-- Select CAT --</option>
          {form.cats?.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Subject select */}
      {catId && (
        <div style={{ marginBottom: "20px" }}>
          <Label>Select Subject</Label>
          <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setAttendance(null); setMarks({}); setIsEditing(true); setShowSuccessAnim(false); }}>
            <option value="">-- Select Subject --</option>
            {selectedCat?.subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Main Content Area */}
      {subjectId && (
        <>
          {/* GPay Success Animation Screen */}
          {showSuccessAnim ? (
            <GPaySuccessAnimation />
          ) : 
          
          /* Already Submitted Screen */
          submitted && !isEditing ? (
            <div style={{ textAlign: "center", padding: "40px 10px", borderTop: "1px solid var(--border)", marginTop: "10px" }} className="fade-in">
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", color: "var(--success)" }}>
                 <FileText size={48} strokeWidth={1.5} />
              </div>
              <h3 style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: 800 }}>You have already submitted!</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>
                Your response for <strong>{selectedSubject?.name}</strong> has been saved.
                {existingResp?.attendance === "absent" && " (Marked as Absent)"}
              </p>
              <Btn variant="ghost" style={{ justifyContent: "center", padding: "12px 24px", margin: "0 auto", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit your response
              </Btn>
            </div>
          ) : 
          
          /* Editing / Input Screen */
          (
            <div className="fade-in">
              {/* Prior draft banner */}
              {existingResp && !submitted && (
                <Alert type="warning">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={16} /> Draft saved. Complete and submit.
                  </div>
                </Alert>
              )}
              {/* Editing an already submitted form banner */}
              {existingResp && submitted && isEditing && (
                <Alert type="warning">
                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Edit2 size={16} /> You are editing a previously submitted response.
                  </div>
                </Alert>
              )}

              {/* ─── ATTENDANCE TOGGLE ─────────────────────────────── */}
              <div style={{ marginBottom: "20px" }}>
                <Label>Attendance for this CAT / Subject</Label>
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  {[
                    ["present", "Present", "var(--success)", "rgba(67,233,123,0.12)", <CheckCircle2 size={18} key="p" />],
                    ["absent", "Absent", "var(--danger)", "rgba(246,79,89,0.12)", <XCircle size={18} key="a" />]
                  ].map(([val, label, color, bg, icon]) => (
                    <button
                      key={val}
                      onClick={() => { setAttendance(val); if (val === "absent") setMarks({}); }}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px", border: `2px solid ${attendance === val ? color : "var(--border)"}`,
                        background: attendance === val ? bg : "var(--input-bg)",
                        color: attendance === val ? color : "var(--text-secondary)",
                        fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.18s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Absent message */}
              {attendance === "absent" && (
                <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(246,79,89,0.08)", border: "1px solid rgba(246,79,89,0.2)", marginBottom: "20px", textAlign: "center" }}>
                  <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center", color: "var(--danger)" }}>
                    <XCircle size={32} />
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: "4px" }}>Marked as Absent</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>All questions will be automatically submitted with <strong>0 marks</strong>.</div>
                </div>
              )}

              {/* Mark entry — only if present */}
              {attendance === "present" && (
                <>
                  {selectedSubject?.questions?.map(q => (
                    <div key={q.id} style={{ marginBottom: "14px" }}>
                      <Label error={!!errors[q.id]}>
                        {q.label} <span style={{ color: "var(--accent)" }}>(Max: {q.maxMarks})</span>
                        {q.required && <span style={{ color: "var(--danger)" }}> *</span>}
                        {errors[q.id] && <span style={{ color: "var(--danger)", marginLeft: "6px", textTransform: "none", letterSpacing: "normal" }}>{errors[q.id]}</span>}
                      </Label>
                      
                      {q.isChoice ? (
                        <select
                          value={marks[q.id] ?? ""}
                          onChange={e => { setMarks(m => ({...m,[q.id]:e.target.value})); setErrors(er => ({...er,[q.id]:""})); }}
                          style={{ 
                            width: "100%", padding: "10px", borderRadius: "8px", 
                            border: `1px solid ${errors[q.id] ? "var(--danger)" : "var(--border)"}`, 
                            background: "var(--input-bg)", color: "var(--text-primary)", outline: "none",
                            fontFamily: "inherit", fontSize: "14px"
                          }}
                        >
                          <option value="" disabled>Select marks or NA...</option>
                          <option value="NA">NA (Left in choice)</option>
                          {Array.from({ length: Number(q.maxMarks) + 1 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number" min={0} max={q.maxMarks}
                          value={marks[q.id] ?? ""}
                          onChange={e => { setMarks(m => ({...m,[q.id]:e.target.value})); setErrors(er => ({...er,[q.id]:""})); }}
                          placeholder={`0 – ${q.maxMarks}`}
                          style={{ borderColor: errors[q.id] ? "var(--danger)" : undefined }}
                        />
                      )}
                    </div>
                  ))}

                  {selectedSubject?.questions?.length > 0 && (
                    <div style={{ padding: "12px", background: "rgba(102,126,234,0.08)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--accent)" }}>
                        {total} <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 400 }}>/ {maxTotal}</span>
                      </span>
                    </div>
                  )}
                </>
              )}

              {msg && (
                <Alert type={msg.type}>
                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} 
                    {msg.text}
                  </div>
                </Alert>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                {attendance === "present" && (
                  <Btn variant="ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={() => submit(true)} disabled={saving}>
                    <Save size={16} /> Save Draft
                  </Btn>
                )}
                <Btn variant={attendance === "absent" ? "danger" : "primary"} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  onClick={() => submit(false)} disabled={saving || !attendance}>
                  {saving ? (
                    "Submitting…"
                  ) : attendance === "absent" ? (
                    <><XCircle size={16} /> Submit as Absent</>
                  ) : (
                    <><CheckCircle2 size={16} /> Submit</>
                  )}
                </Btn>
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}