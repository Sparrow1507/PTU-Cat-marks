import { useState, useEffect, useMemo } from "react";
import { db, uid, makeSlug } from "../lib/supabase.js";
import { Btn, Card, Label, Alert, Badge, Spinner } from "./UI.jsx";
import { 
  ClipboardList, Users, BarChart3, Edit2, Trash2, CheckCircle2, 
  XCircle, Settings, Eye, ArrowLeft, Download, Plus, Copy, Check 
} from "lucide-react";

// ─── FORM MANAGER ─────────────────────────────────────────────────────────────
export function FormManager({ user, isAdmin }) {
  const [forms, setForms] = useState([]);
  const [view, setView] = useState("list");
  const [editForm, setEditForm] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const all = await db.get("forms");
    setForms(isAdmin ? all : all.filter(f => f.teacherId === user.id));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createForm = async () => {
    const f = { id: uid(), slug: makeSlug(), title: "New Form", description: "", teacherId: user.id, isOpen: false, cats: [], createdAt: new Date().toISOString() };
    await db.insert("forms", f);
    setEditForm(f); setView("builder");
  };

  const deleteForm = async (id) => {
    if (!confirm("Delete this form and ALL its data?")) return;
    await Promise.all([
      db.delWhere("forms", "id", id),
      db.delWhere("students", "formId", id),
      db.delWhere("responses", "formId", id),
    ]);
    load();
  };

  if (view === "builder" && editForm)   return <FormBuilder form={editForm} onBack={() => { load(); setView("list"); }} />;
  if (view === "responses" && selectedForm) return <ResponseViewer form={selectedForm} onBack={() => setView("list")} />;
  if (view === "students" && selectedForm)  return <StudentManager form={selectedForm} onBack={() => setView("list")} />;

  return (
    <div className="fade-in">
      {/* 💡 FIX: Added Media Query for responsive FormCards */}
      <style>{`
        .form-card-layout { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .form-card-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .form-card-layout { flex-direction: column; }
          .form-card-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)" }}>{isAdmin ? "All Forms" : "My Forms"}</h2>
        <Btn variant="primary" onClick={createForm}><Plus size={16} strokeWidth={2.5} /> Create Form</Btn>
      </div>
      {loading ? <Spinner /> : forms.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "48px" }}>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", color: "var(--text-secondary)" }}>
            <ClipboardList size={48} strokeWidth={1.5} />
          </div>
          <p style={{ color: "var(--text-muted)" }}>No forms yet. Create your first one!</p>
        </Card>
      ) : forms.map(f => (
        <FormCard key={f.id} form={f} onEdit={() => { setEditForm(f); setView("builder"); }}
          onStudents={() => { setSelectedForm(f); setView("students"); }}
          onResponses={() => { setSelectedForm(f); setView("responses"); }}
          onDelete={() => deleteForm(f.id)} />
      ))}
    </div>
  );
}

function FormCard({ form: f, onEdit, onStudents, onResponses, onDelete }) {
  const [counts, setCounts] = useState({ students: "…", responses: "…" });
  
  useEffect(() => {
    Promise.all([db.getWhere("students","formId",f.id), db.getWhere("responses","formId",f.id)])
      .then(([s,r]) => setCounts({ students: s.length, responses: r.length }));
  }, [f.id]);

  return (
    // 💡 FIX: Uses the CSS classes defined above to handle layout automatically
    <Card className="form-card-layout" style={{ marginBottom: "16px" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>{f.title}</span>
          <Badge color={f.isOpen ? "green" : "red"}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {f.isOpen ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {f.isOpen ? "Open" : "Closed"}
            </div>
          </Badge>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "6px" }}>
          🔗 /form/{f.slug} · {f.cats?.length || 0} CATs · {counts.students} students · {counts.responses} responses
        </div>
        {f.description && <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{f.description}</div>}
      </div>
      
      <div className="form-card-actions">
        <Btn variant="ghost" onClick={onStudents} style={{ justifyContent: "center" }}><Users size={14} /> Students</Btn>
        <Btn variant="ghost" onClick={onResponses} style={{ justifyContent: "center" }}><BarChart3 size={14} /> Responses</Btn>
        <Btn variant="primary" onClick={onEdit} style={{ justifyContent: "center" }}><Edit2 size={14} /> Edit</Btn>
        <Btn variant="danger" onClick={onDelete} style={{ justifyContent: "center" }}><Trash2 size={14} /> Delete</Btn>
      </div>
    </Card>
  );
}

// ─── FORM BUILDER ─────────────────────────────────────────────────────────────
function FormBuilder({ form: initialForm, onBack }) {
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("settings");

  const save = async (updated = form) => {
    await db.update("forms", updated.id, updated);
    setForm(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const upd = (k, v) => { const u = { ...form, [k]: v }; setForm(u); save(u); };
  const addCat = () => { const c = [...(form.cats||[]), { id: uid(), label: `CAT ${(form.cats?.length||0)+1}`, subjects: [] }]; upd("cats", c); };
  const removeCat = (cId) => upd("cats", form.cats.filter(c => c.id !== cId));
  const updCat = (cId, k, v) => upd("cats", form.cats.map(c => c.id === cId ? {...c,[k]:v} : c));
  const addSubject = (cId) => upd("cats", form.cats.map(c => c.id === cId ? {...c, subjects:[...(c.subjects||[]),{id:uid(),name:"New Subject",questions:[]}]} : c));
  const removeSubject = (cId,sId) => upd("cats", form.cats.map(c => c.id === cId ? {...c,subjects:c.subjects.filter(s=>s.id!==sId)} : c));
  const updSubject = (cId,sId,k,v) => upd("cats", form.cats.map(c => c.id === cId ? {...c,subjects:c.subjects.map(s=>s.id===sId?{...s,[k]:v}:s)} : c));
  const addQuestion = (cId,sId) => {
    const sub = form.cats.find(c=>c.id===cId)?.subjects?.find(s=>s.id===sId);
    const q = { id:uid(), label:`Q${(sub?.questions?.length||0)+1}`, maxMarks:10, required:true };
    upd("cats", form.cats.map(c=>c.id===cId?{...c,subjects:c.subjects.map(s=>s.id===sId?{...s,questions:[...(s.questions||[]),q]}:s)}:c));
  };
  const removeQuestion = (cId,sId,qId) => upd("cats", form.cats.map(c=>c.id===cId?{...c,subjects:c.subjects.map(s=>s.id===sId?{...s,questions:s.questions.filter(q=>q.id!==qId)}:s)}:c));
  const updQuestion = (cId,sId,qId,k,v) => upd("cats", form.cats.map(c=>c.id===cId?{...c,subjects:c.subjects.map(s=>s.id===sId?{...s,questions:s.questions.map(q=>q.id===qId?{...q,[k]:v}:q)}:s)}:c));
  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/form/${form.slug}`); alert("Link copied! Share with students."); };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <Btn variant="ghost" onClick={onBack}><ArrowLeft size={16} /> Back</Btn>
        <h2 style={{ fontWeight: 800, fontSize: "20px", flex: 1, color: "var(--text-primary)" }}>Form Builder</h2>
        {saved && <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--success)", fontSize: "13px", fontWeight: 600 }}><Check size={14} strokeWidth={3} /> Saved</span>}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          ["settings", "Settings", <Settings size={16} key="s" />],
          ["cats", "Structure", <ClipboardList size={16} key="c" />],
          ["preview", "Preview", <Eye size={16} key="p" />]
        ].map(([t, l, icon]) => (
          <Btn key={t} variant={tab===t?"primary":"ghost"} onClick={() => setTab(t)}>
            {icon} {l}
          </Btn>
        ))}
      </div>

      {tab === "settings" && (
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Form Settings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div><Label>Form Title</Label><input value={form.title} onChange={e => upd("title", e.target.value)} /></div>
            <div><Label>Public Slug (URL)</Label><input value={form.slug} readOnly style={{ opacity: 0.6 }} /></div>
            <div style={{ gridColumn: "1/-1" }}>
              <Label>Description</Label>
              <textarea style={{ minHeight: "80px", resize: "vertical" }} value={form.description||""} onChange={e => upd("description", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={!!form.isOpen} onChange={e => upd("isOpen", e.target.checked)}
                style={{ width: "auto", accentColor: "var(--accent)" }} />
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: form.isOpen ? "var(--success)" : "var(--danger)", fontWeight: 600, fontSize: "14px" }}>
                {form.isOpen ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {form.isOpen ? "Form is Open" : "Form is Closed"}
              </span>
            </label>
          </div>
          <div style={{ marginTop: "16px", padding: "12px", background: "rgba(102,126,234,0.08)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", wordBreak: "break-all" }}>
              Public Link: <code style={{ color: "var(--accent)", fontFamily: "DM Mono, monospace" }}>/form/{form.slug}</code>
            </span>
            <Btn variant="primary" onClick={copyLink}><Copy size={14} /> Copy Link</Btn>
          </div>
        </Card>
      )}

      {tab === "cats" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>CAT Structure</h3>
            <Btn variant="success" onClick={addCat}><Plus size={16} strokeWidth={2.5} /> Add CAT</Btn>
          </div>
          {(form.cats||[]).length === 0 && <Card style={{ textAlign: "center", color: "var(--text-muted)" }}>No CATs yet. Add one above.</Card>}
          {(form.cats||[]).map(cat => (
            <Card key={cat.id} accent="var(--accent)" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "14px", alignItems: "center", flexWrap: "wrap" }}>
                <input style={{ fontWeight: 700, flex: "1 1 150px" }} value={cat.label} onChange={e => updCat(cat.id,"label",e.target.value)} />
                <Btn variant="success" onClick={() => addSubject(cat.id)}><Plus size={14} strokeWidth={2.5} /> Subject</Btn>
                <Btn variant="danger" onClick={() => removeCat(cat.id)}><Trash2 size={14} /></Btn>
              </div>
              {(cat.subjects||[]).map(sub => (
                <Card key={sub.id} accent="var(--warning)" style={{ marginLeft: "16px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <input value={sub.name} onChange={e => updSubject(cat.id,sub.id,"name",e.target.value)} placeholder="Subject Name" style={{ flex: "1 1 150px" }} />
                    <Btn variant="primary" onClick={() => addQuestion(cat.id,sub.id)}><Plus size={14} strokeWidth={2.5} /> Q</Btn>
                    <Btn variant="danger" onClick={() => removeSubject(cat.id,sub.id)}><Trash2 size={14} /></Btn>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "8px" }}>
                    {(sub.questions||[]).map(q => (
                      <div key={q.id} style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <input style={{ flex: 1, padding: "6px 8px", fontSize: "13px" }} value={q.label} onChange={e => updQuestion(cat.id,sub.id,q.id,"label",e.target.value)} />
                        <input style={{ width: "60px", padding: "6px 8px", fontSize: "13px" }} type="number" value={q.maxMarks} onChange={e => updQuestion(cat.id,sub.id,q.id,"maxMarks",e.target.value)} title="Max Marks" />
                        <button style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => removeQuestion(cat.id,sub.id,q.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(sub.questions||[]).length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                      Total Max: {sub.questions.reduce((a,q)=>a+Number(q.maxMarks||0),0)} marks
                    </div>
                  )}
                </Card>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab === "preview" && <FormPreview form={form} />}
    </div>
  );
}

function FormPreview({ form }) {
  const [catId, setCatId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const selectedCat = form.cats?.find(c => c.id === catId);
  const selectedSubject = selectedCat?.subjects?.find(s => s.id === subjectId);
  return (
    <Card style={{ maxWidth: "600px" }}>
      <h3 style={{ fontWeight: 800, marginBottom: "4px", color: "var(--text-primary)" }}>{form.title}</h3>
      {form.description && <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "13px" }}>{form.description}</p>}
      <div style={{ marginBottom: "14px" }}><Label>Student Name</Label><input disabled placeholder="Full Name" /></div>
      <div style={{ marginBottom: "14px" }}><Label>Register Number</Label><input disabled placeholder="Reg. No." /></div>
      <div style={{ marginBottom: "14px" }}>
        <Label>Select CAT</Label>
        <select value={catId} onChange={e=>{setCatId(e.target.value);setSubjectId("");}}>
          <option value="">-- Select CAT --</option>
          {form.cats?.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      {catId && <div style={{ marginBottom: "14px" }}><Label>Select Subject</Label><select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">-- Select Subject --</option>{selectedCat?.subjects?.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
      {selectedSubject?.questions?.map(q=>(
        <div key={q.id} style={{ marginBottom: "14px" }}><Label>{q.label} (Max: {q.maxMarks})</Label><input type="number" disabled placeholder="Enter marks" /></div>
      ))}
      <Btn variant="primary" disabled style={{ opacity: 0.6, cursor: "not-allowed", width: "100%", justifyContent: "center" }}>Submit (Preview Mode)</Btn>
    </Card>
  );
}

// ─── STUDENT MANAGER ──────────────────────────────────────────────────────────
export function StudentManager({ form, onBack }) {
  const [students, setStudents] = useState([]);
  const [pasteData, setPasteData] = useState("");
  const [msg, setMsg] = useState(null);
  const [newS, setNewS] = useState({ name: "", regNo: "", dob: "" });
  const [loading, setLoading] = useState(true);

  const load = async () => { setLoading(true); setStudents(await db.getWhere("students","formId",form.id)); setLoading(false); };
  useEffect(() => { load(); }, []);

  const addSingle = async () => {
    if (!newS.name || !newS.regNo || !newS.dob) { setMsg({ type:"error", text:"Fill all fields." }); return; }
    const existing = students.find(s => s.regNo === newS.regNo);
    if (existing) { setMsg({ type:"error", text:"Reg No already exists." }); return; }
    await db.insert("students", { ...newS, id: uid(), formId: form.id });
    setNewS({ name: "", regNo: "", dob: "" });
    setMsg({ type:"success", text:"Student added!" });
    load();
  };

  const parsePaste = async () => {
    const lines = pasteData.trim().split("\n").filter(Boolean);
    let added = 0, skipped = 0;
    for (const line of lines) {
      const parts = line.split(/\t|,/).map(p => p.trim());
      if (parts.length >= 3) {
        const [name, regNo, dob] = parts;
        if (students.find(s => s.regNo === regNo)) { skipped++; continue; }
        await db.insert("students", { id: uid(), name, regNo, dob, formId: form.id });
        added++;
      }
    }
    setPasteData("");
    setMsg({ type:"success", text:`Added ${added} students.${skipped > 0 ? ` ${skipped} skipped (duplicate).` : ""}` });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Remove this student?")) return;
    await db.del("students", id);
    load();
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Btn variant="ghost" onClick={onBack}><ArrowLeft size={16} /> Back</Btn>
        <h2 style={{ fontWeight: 800, fontSize: "20px", color: "var(--text-primary)" }}>Students — {form.title}</h2>
        <Badge color="blue">{students.length} students</Badge>
      </div>

      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Add Single Student</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", alignItems: "end" }}>
          {[["name","Full Name","text"],["regNo","Register No.","text"],["dob","Date of Birth","date"]].map(([k,p,t])=>(
            <div key={k}><Label>{p}</Label><input type={t} value={newS[k]} onChange={e=>setNewS(f=>({...f,[k]:e.target.value}))} placeholder={p} /></div>
          ))}
          <Btn variant="success" onClick={addSingle} style={{ alignSelf: "flex-end" }}><Plus size={16} strokeWidth={2.5} /> Add</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "6px", color: "var(--text-primary)" }}>Bulk Import</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "10px" }}>
          Format: <code style={{ color: "var(--accent)", fontFamily: "DM Mono, monospace" }}>Name [tab] RegNo [tab] DOB(YYYY-MM-DD)</code> — one per row
        </p>
        <textarea style={{ minHeight: "100px", resize: "vertical", fontFamily: "DM Mono, monospace", fontSize: "13px" }}
          value={pasteData} onChange={e => setPasteData(e.target.value)}
          placeholder={"John Doe\t21CS001\t2003-05-12\nJane Smith\t21CS002\t2003-08-20"} />
        <Btn variant="success" style={{ marginTop: "8px" }} onClick={parsePaste}><Download size={14} style={{ transform: "rotate(180deg)" }} /> Import Rows</Btn>
      </Card>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>All Students ({students.length})</h3>
        {loading ? <Spinner /> : students.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No students yet.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["#","Name","Reg No","DOB","Action"].map(h=>(
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s,i)=>(
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{i+1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "DM Mono, monospace", color: "var(--accent)" }}>{s.regNo}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{s.dob}</td>
                    <td style={{ padding: "10px 12px" }}><Btn variant="danger" style={{ fontSize: "12px", padding: "5px 10px" }} onClick={()=>remove(s.id)}><Trash2 size={12} /> Remove</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── RESPONSE VIEWER ──────────────────────────────────────────────────────────
export function ResponseViewer({ form, onBack }) {
  const [responses, setResponses] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterCat, setFilterCat] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [r, a, s] = await Promise.all([
        db.getWhere("responses","formId",form.id),
        db.get("answers"),
        db.getWhere("students","formId",form.id),
      ]);
      setResponses(r); setAnswers(a); setStudents(s);
      setLoading(false);
    };
    load();
  }, [form.id]);

  const filtered = responses.filter(r => {
    if (filterCat && r.catId !== filterCat) return false;
    if (filterSubject && r.subjectId !== filterSubject) return false;
    if (filterStudent && r.studentId !== filterStudent) return false;
    return true;
  });

  const analytics = useMemo(() => {
    const map = {};
    form.cats?.forEach(cat => {
      cat.subjects?.forEach(sub => {
        const subResps = responses.filter(r => r.catId===cat.id && r.subjectId===sub.id);
        const maxTotal = sub.questions?.reduce((a,q)=>a+Number(q.maxMarks||0),0)||0;
        const totals = subResps.map(resp => {
          const ra = answers.filter(a=>a.responseId===resp.id);
          return sub.questions?.reduce((sum,q)=>{ const a=ra.find(a=>a.questionId===q.id); return sum+(a?Number(a.value):0); },0)||0;
        });
        map[`${cat.label}||${sub.name}`] = { count:totals.length, avg:totals.length?(totals.reduce((a,b)=>a+b,0)/totals.length).toFixed(1):0, maxTotal };
      });
    });
    return map;
  }, [responses, answers, form]);

  const deleteResponse = async (id) => {
    if (!confirm("Delete this response?")) return;
    await db.del("responses", id);
    await db.delWhere("answers","responseId",id);
    setResponses(r => r.filter(r => r.id !== id));
  };

  const exportExcel = () => {
    const load = () => buildWorkbook(form, responses, answers, students);
    if (!window.XLSX) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = load; document.head.appendChild(s);
    } else { load(); }
  };

  const selectedCat = form.cats?.find(c => c.id === filterCat);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Btn variant="ghost" onClick={onBack}><ArrowLeft size={16} /> Back</Btn>
        <h2 style={{ fontWeight: 800, fontSize: "20px", flex: 1, color: "var(--text-primary)" }}>Responses — {form.title}</h2>
        <Btn variant="success" onClick={exportExcel}><Download size={16} /> Export Excel</Btn>
      </div>

      {/* Analytics */}
      {Object.keys(analytics).length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "12px", marginBottom: "24px" }}>
          {Object.entries(analytics).map(([key,val]) => {
            const [cat,sub] = key.split("||");
            const pct = val.maxTotal > 0 ? ((val.avg / val.maxTotal)*100).toFixed(0) : 0;
            return (
              <Card key={key} style={{ padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700 }}>{cat} · {sub}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--success)" }}>{val.avg}<span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/{val.maxTotal}</span></div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Avg · {val.count} submissions · {pct}%</div>
              </Card>
            );
          })}
        </div>
      )}

      <Card style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        <div><Label>Filter by CAT</Label>
          <select value={filterCat} onChange={e=>{setFilterCat(e.target.value);setFilterSubject("");}}>
            <option value="">All CATs</option>
            {form.cats?.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div><Label>Filter by Subject</Label>
          <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {(filterCat ? [selectedCat] : form.cats)?.flatMap(c=>c?.subjects?.map(s=><option key={s.id} value={s.id}>{s.name}</option>)||[])}
          </select>
        </div>
        <div><Label>Filter by Student</Label>
          <select value={filterStudent} onChange={e=>setFilterStudent(e.target.value)}>
            <option value="">All Students</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.regNo})</option>)}
          </select>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Responses ({filtered.length})</h3>
        {loading ? <Spinner /> : filtered.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No responses found.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Student","Reg No","CAT","Subject","Marks","Total","Status","Submitted","Action"].map(h=>(
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(resp => {
  const student = students.find(s => s.id === resp.studentId);
  const cat = form.cats?.find(c => c.id === resp.catId);
  const subject = cat?.subjects?.find(s => s.id === resp.subjectId);
  const ra = answers.filter(a => a.responseId === resp.id);

  const maxTotal = subject?.questions?.reduce((a, q) => a + Number(q.maxMarks || 0), 0) || 0;

  const isAbsent = resp.attendance === "absent";

  const total = isAbsent
    ? 0
    : subject?.questions?.reduce((sum, q) => {
        const a = ra.find(a => a.questionId === q.id);
        return sum + (a ? Number(a.value) : 0);
      }, 0) || 0;

  const status = isAbsent ? "Absent" : "Present";
  const color = isAbsent ? "red" : "green";

  return (
    <tr key={resp.id} style={{ borderBottom: "1px solid var(--border)" }}>
      
      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
        {student?.name || "?"}
      </td>

      <td style={{ padding: "10px 12px", fontFamily: "DM Mono, monospace", color: "var(--accent)" }}>
        {student?.regNo}
      </td>

      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
        {cat?.label}
      </td>

      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
        {subject?.name}
      </td>

      <td style={{ padding: "10px 12px" }}>
        {isAbsent ? (
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>Absent</span>
        ) : (
          subject?.questions?.map(q => {
            const a = ra.find(a => a.questionId === q.id);
            return (
              <span key={q.id} style={{ marginRight: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                {q.label}:{a?.value ?? "-"}
              </span>
            );
          })
        )}
      </td>

      <td style={{
        padding: "10px 12px",
        fontWeight: 700,
        color: isAbsent ? "var(--danger)" : "var(--success)"
      }}>
        {`${total}/${maxTotal}`}
      </td>

      <td style={{ padding: "10px 12px" }}>
        <Badge color={color}>{status}</Badge>
      </td>

      <td style={{ padding: "10px 12px", fontSize: "11px", color: "var(--text-muted)" }}>
        {resp.submittedAt
          ? new Date(resp.submittedAt).toLocaleDateString()
          : <Badge color="orange">Draft</Badge>
        }
      </td>

      <td style={{ padding: "10px 12px" }}>
        <Btn
          variant="danger"
          style={{ fontSize: "12px", padding: "6px" }}
          onClick={() => deleteResponse(resp.id)}
        >
          <Trash2 size={14} />
        </Btn>
      </td>

    </tr>
  );
})}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
function buildWorkbook(form, responses, answers, students) {
  const XLSX = window.XLSX;
  if (!XLSX) { alert("Excel library loading, try again in 2 seconds."); return; }

  const wb = XLSX.utils.book_new();

  const infoData = [["Reg No","Name","DOB","Form"]];
  students.forEach(s => infoData.push([s.regNo, s.name, s.dob, form.title]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(infoData), "Student Info");

  const allMarks = [["Reg No","Name","CAT","Subject","Question","Marks","Max Marks","Submitted At"]];

  responses.forEach(resp => {
    const student = students.find(s => s.id === resp.studentId);
    const cat = form.cats?.find(c => c.id === resp.catId);
    const subject = cat?.subjects?.find(s => s.id === resp.subjectId);
    const ra = answers.filter(a => a.responseId === resp.id);

    const isAbsent = resp.attendance === "absent";

    subject?.questions?.forEach(q => {
      const a = ra.find(a => a.questionId === q.id);
      const value = isAbsent ? 0 : (a ? Number(a.value) : 0);

      allMarks.push([
        student?.regNo,
        student?.name,
        cat?.label,
        subject?.name,
        q?.label,
        value,
        q?.maxMarks,
        resp.submittedAt
      ]);
    });
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allMarks), "All Marks");

  form.cats?.forEach(cat => {
    cat.subjects?.forEach(subject => {

      const sr = responses.filter(r =>
        r.catId === cat.id && r.subjectId === subject.id
      );

      const headers = [
        "Reg No",
        "Name",
        ...subject.questions.map(q => `${q.label}(/${q.maxMarks})`),
        "Total",
        "Percentage",
        "Status"
      ];

      const rows = [headers];

      sr.forEach(resp => {
        const student = students.find(s => s.id === resp.studentId);
        const ra = answers.filter(a => a.responseId === resp.id);

        const isAbsent = resp.attendance === "absent";

        const marks = subject.questions.map(q => {
          const a = ra.find(a => a.questionId === q.id);
          return isAbsent ? 0 : (a ? Number(a.value) : 0);
        });

        const total = isAbsent
          ? 0
          : marks.reduce((a, b) => a + b, 0);

        const maxTotal = subject.questions.reduce(
          (a, q) => a + Number(q.maxMarks || 0),
          0
        );

        const percentage = isAbsent
          ? "0%"
          : maxTotal > 0
            ? ((total / maxTotal) * 100).toFixed(1) + "%"
            : "N/A";

        const status = isAbsent ? "Absent" : "Present";

        rows.push([
          student?.regNo,
          student?.name,
          ...marks,
          total,
          percentage,
          status
        ]);
      });

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(rows),
        `${cat.label}-${subject.name}`.slice(0, 31)
      );
    });
  });

  XLSX.writeFile(wb, `${form.title}_Marks.xlsx`);
}