# 📘 EduMarks — Supabase Setup Guide
## Step-by-step for first-time users

---

## STEP 1 — Create a Supabase Account

1. Go to https://supabase.com and click **"Start your project"**
2. Sign up with GitHub or email
3. Click **"New Project"**
4. Enter a project name (e.g. `edumarks`), set a database password, choose a region close to you
5. Click **"Create new project"** and wait ~2 minutes for it to initialize

---

## STEP 2 — Get Your API Keys

1. In your Supabase project, go to **Settings → API** (left sidebar)
2. Copy two values:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

3. In your project folder, copy `.env.example` to `.env` and fill in the values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## STEP 3 — Create the Database Tables

1. In Supabase, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy and paste the entire SQL block below, then click **"Run"**

```sql
-- ── app_config ─────────────────────────────────────────────────────────────
create table if not exists app_config (
  key   text primary key,
  value text
);

-- ── admins ─────────────────────────────────────────────────────────────────
create table if not exists admins (
  id         text primary key,
  name       text not null,
  username   text not null unique,
  password   text not null,
  active     boolean default true,
  "createdAt" timestamptz default now()
);

-- ── teachers ───────────────────────────────────────────────────────────────
create table if not exists teachers (
  id         text primary key,
  name       text not null,
  username   text not null unique,
  password   text not null,
  email      text,
  active     boolean default true,
  "createdAt" timestamptz default now()
);

-- ── forms ──────────────────────────────────────────────────────────────────
create table if not exists forms (
  id          text primary key,
  slug        text not null unique,
  title       text not null,
  description text,
  "teacherId" text,
  "isOpen"    boolean default false,
  cats        jsonb default '[]',
  "createdAt" timestamptz default now()
);

-- ── students ───────────────────────────────────────────────────────────────
create table if not exists students (
  id       text primary key,
  name     text not null,
  "regNo"  text not null,
  dob      text not null,
  "formId" text not null
);

-- ── responses ──────────────────────────────────────────────────────────────
create table if not exists responses (
  id          text primary key,
  "formId"    text not null,
  "studentId" text not null,
  "catId"     text not null,
  "subjectId" text not null,
  attendance  text default 'present',
  "submittedAt" timestamptz
);

-- ── answers ────────────────────────────────────────────────────────────────
create table if not exists answers (
  id           text primary key,
  "responseId" text not null,
  "questionId" text not null,
  value        text
);
```

4. You should see **"Success. No rows returned"** — that means the tables were created.

---

## STEP 4 — Disable Row Level Security (for now)

By default Supabase blocks all reads/writes. Since EduMarks manages its own
login system, you need to either:

**Option A (Quick — Development):** Disable RLS on all tables

Go to **Table Editor** → click each table → click **"RLS disabled"** toggle
to keep it disabled. Do this for: `app_config`, `admins`, `teachers`, `forms`,
`students`, `responses`, `answers`.

**Option B (Recommended — Production):** Run this SQL:

```sql
alter table app_config  disable row level security;
alter table admins      disable row level security;
alter table teachers    disable row level security;
alter table forms       disable row level security;
alter table students    disable row level security;
alter table responses   disable row level security;
alter table answers     disable row level security;
```

---

## STEP 5 — Run the App

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you'll see the **First-Time Setup** screen.
Create your admin account. Done! 🎉

---

## NOTES

- **Passwords** are stored in plain text in Supabase in this version. Your
  Supabase database is private and access-controlled, but for production you
  should add password hashing (bcrypt). This is a known limitation.

- **The anon key** is safe to expose in frontend code — it only allows what
  Supabase's RLS rules permit. Since you've disabled RLS, keep your project
  URL/key private and don't share your `.env` file.

- To **reset the app** (e.g. for a fresh setup), run in Supabase SQL Editor:
  ```sql
  delete from app_config where key = 'setup_done';
  delete from admins;
  ```
  Then refresh the app — you'll see the Setup screen again.
