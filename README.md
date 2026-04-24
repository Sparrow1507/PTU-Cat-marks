# EduMarks — Refactored

## File Structure

```
src/
├── App.jsx                    ← Root router + setup check
├── lib/
│   ├── supabase.js            ← Supabase client + all async db helpers
│   └── theme.jsx              ← Light/dark theme context + CSS variables
└── components/
    ├── UI.jsx                 ← Shared primitives (Btn, Card, Badge, Spinner…)
    ├── Sidebar.jsx            ← Sidebar + main content layout
    ├── LoginPage.jsx          ← Login + First-time setup screen
    ├── AdminPanel.jsx         ← Admin dashboard, teacher manager, admin manager
    ├── TeacherPanel.jsx       ← Teacher dashboard
    ├── FormManager.jsx        ← Form list, builder, student manager, response viewer
    └── StudentForm.jsx        ← Public form page + student login + mark entry
```

## What changed from the original

### Bugs fixed
- All `db.get()` calls were synchronous — now fully async with `useEffect` + loading states
- `submit()` used `await` but wasn't declared `async` (syntax error)  
- `await db.del("responses", id)` used undefined `id` (should be `respId`)
- `seedData()` was called on every render — removed entirely (tables created via SQL)
- `db.get("answers")` inside submit was synchronous — fixed

### Security
- `ADMIN_CREDS` hardcoded constant **removed**
- Admin credentials now stored in Supabase `admins` table
- First-time setup screen creates the initial admin
- Admin panel can add / deactivate / remove additional admins

### New features
- **Light/dark theme toggle** — persisted to localStorage, on every page
- **Attendance toggle** on student form — Present shows mark entry, Absent auto-submits 0 marks
- **Admin management** — add, deactivate, remove admin accounts from within the panel
- **Teacher deactivate** — deactivate without removing (login blocked, data kept)
- Proper loading spinners throughout
- CSS variables for consistent theming — no more hardcoded colors in components

## Setup
See `SUPABASE_SETUP.md` for step-by-step Supabase instructions.
