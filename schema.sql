-- ============================================================
--  INTERN~FLOW — Complete Supabase SQL Setup
--  Run this entire script in your Supabase SQL Editor.
--  Supabase Auth handles the auth.users table automatically.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. CUSTOM TYPES (enumerations)
-- ────────────────────────────────────────────────────────────

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'dept_head', 'staff', 'intern');

-- Account status (pending until admin approves)
CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected');

-- Mood options logged by interns
CREATE TYPE mood_type AS ENUM ('great', 'good', 'okay', 'struggling');

-- Internship completion status
CREATE TYPE internship_status_type AS ENUM (
  'incomplete',
  'completed',
  'high performer',
  'top performer'
);


-- ────────────────────────────────────────────────────────────
-- 2. TABLES
-- ────────────────────────────────────────────────────────────

-- 2a. users
--   Mirrors auth.users (id FK → auth.users.id).
--   Stores profile + role approval workflow.
CREATE TABLE IF NOT EXISTS public.users (
  id                 UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT          NOT NULL,
  full_name          TEXT,

  -- Role granted after admin approval (stored as text so it survives
  -- intermediate states; the code always validates values at app level)
  role               TEXT          NOT NULL DEFAULT 'intern'
                       CHECK (role IN ('admin', 'dept_head', 'staff', 'intern')),

  -- What the user requested during signup (may differ from role)
  requested_role     TEXT          CHECK (requested_role IN ('admin', 'dept_head', 'staff', 'intern')),

  -- Approval workflow
  status             TEXT          NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Internship tracking (managed by admins)
  joining_date       DATE,
  end_date           DATE,
  is_certified       BOOLEAN       NOT NULL DEFAULT FALSE,
  internship_status  TEXT          NOT NULL DEFAULT 'incomplete'
                       CHECK (internship_status IN ('incomplete', 'completed', 'high performer', 'top performer')),

  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2b. projects
--   Created by admins/dept_heads; interns are assigned to them.
CREATE TABLE IF NOT EXISTS public.projects (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT          NOT NULL,
  description  TEXT,
  created_by   UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2c. project_assignments
--   Many-to-many: which intern is on which project.
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id          UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID   NOT NULL REFERENCES public.projects(id)  ON DELETE CASCADE,
  intern_id   UUID   NOT NULL REFERENCES public.users(id)     ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (project_id, intern_id)   -- prevent duplicate assignments
);

-- 2d. daily_logs
--   One log per intern per day. Core of the app.
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id          UUID          NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  project_id         UUID          REFERENCES public.projects(id)          ON DELETE SET NULL,

  log_date           DATE          NOT NULL,
  tasks_completed    TEXT          NOT NULL,
  hours_worked       NUMERIC(4,1)  NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 24),
  blockers           TEXT,
  mood               TEXT          NOT NULL DEFAULT 'good'
                       CHECK (mood IN ('great', 'good', 'okay', 'struggling')),
  productivity_score NUMERIC(4,1)  CHECK (productivity_score >= 0 AND productivity_score <= 10),

  -- Admin feedback written from the Overview page
  admin_feedback     TEXT,

  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- One log per intern per day
  UNIQUE (intern_id, log_date)
);


-- ────────────────────────────────────────────────────────────
-- 3. INDEXES  (improve common query patterns)
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_role           ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status         ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_intern    ON public.daily_logs(intern_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date      ON public.daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project   ON public.daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_assign_project  ON public.project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_assign_intern   ON public.project_assignments(intern_id);


-- ────────────────────────────────────────────────────────────
-- 4. UPDATED_AT TRIGGER  (auto-stamp updated_at)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 5. AUTO-CREATE users ROW ON AUTH SIGNUP
--    Fires when a new auth.users record is inserted.
--    The Signup.jsx page then upserts with full_name/role/status.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop then recreate so re-running this script doesn't error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 6. ROW-LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
-- Enable RLS on every table.
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs         ENABLE ROW LEVEL SECURITY;


-- ── Helper function: get current user's role from DB ───────
-- Used inside policies to avoid circular references on auth.uid()
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_status()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT status FROM public.users WHERE id = auth.uid();
$$;


-- ────────────────────────── users ──────────────────────────

-- Anyone can read all user rows (needed for name lookups, admin lists)
CREATE POLICY "Users: anyone approved can read"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can UPSERT their own row (signup flow)
CREATE POLICY "Users: can upsert own row"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can UPDATE their own name/password-related fields.
-- Admins/dept_heads can update any user row (for approvals, internship tracking).
CREATE POLICY "Users: self or privileged can update"
  ON public.users FOR UPDATE
  USING (
    id = auth.uid()
    OR get_my_role() IN ('admin', 'dept_head')
  );

-- Only admins/dept_heads can DELETE a users row
CREATE POLICY "Users: admin/dept_head can delete"
  ON public.users FOR DELETE
  USING (get_my_role() IN ('admin', 'dept_head'));


-- ─────────────────────────── projects ──────────────────────

-- Any approved user can read projects
CREATE POLICY "Projects: approved users can read"
  ON public.projects FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND get_my_status() = 'approved'
  );

-- Only admins / dept_heads / staff can create projects
CREATE POLICY "Projects: privileged can insert"
  ON public.projects FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'dept_head', 'staff'));

-- Only admins / dept_heads / staff can update projects
CREATE POLICY "Projects: privileged can update"
  ON public.projects FOR UPDATE
  USING (get_my_role() IN ('admin', 'dept_head', 'staff'));

-- Only admins / dept_heads can delete projects
CREATE POLICY "Projects: admin/dept_head can delete"
  ON public.projects FOR DELETE
  USING (get_my_role() IN ('admin', 'dept_head'));


-- ──────────────────── project_assignments ───────────────────

-- Interns can see their own assignments; admins see all
CREATE POLICY "Assignments: intern sees own, admins see all"
  ON public.project_assignments FOR SELECT
  USING (
    intern_id = auth.uid()
    OR get_my_role() IN ('admin', 'dept_head', 'staff')
  );

-- Only privileged roles can assign interns
CREATE POLICY "Assignments: privileged can insert"
  ON public.project_assignments FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'dept_head', 'staff'));

-- Only privileged roles can remove assignments
CREATE POLICY "Assignments: privileged can delete"
  ON public.project_assignments FOR DELETE
  USING (get_my_role() IN ('admin', 'dept_head', 'staff'));


-- ──────────────────────── daily_logs ────────────────────────

-- Interns: read own logs. Admins/staff/dept_heads: read all.
CREATE POLICY "Logs: intern reads own, admins read all"
  ON public.daily_logs FOR SELECT
  USING (
    intern_id = auth.uid()
    OR get_my_role() IN ('admin', 'dept_head', 'staff')
  );

-- Interns can only insert their own log
CREATE POLICY "Logs: intern inserts own"
  ON public.daily_logs FOR INSERT
  WITH CHECK (intern_id = auth.uid());

-- Interns can update their own log; admins can update any (for admin_feedback)
CREATE POLICY "Logs: intern updates own, admins update any"
  ON public.daily_logs FOR UPDATE
  USING (
    intern_id = auth.uid()
    OR get_my_role() IN ('admin', 'dept_head', 'staff')
  );

-- Admins/dept_heads can delete any log; intern can delete their own
CREATE POLICY "Logs: admin or owner can delete"
  ON public.daily_logs FOR DELETE
  USING (
    intern_id = auth.uid()
    OR get_my_role() IN ('admin', 'dept_head')
  );


-- ────────────────────────────────────────────────────────────
-- 7. INITIAL ADMIN ACCOUNT
--    After running this schema, create the first admin user
--    through Supabase Auth (Authentication > Users > Invite user),
--    then run the following UPDATE to grant admin rights:
--
--    UPDATE public.users
--    SET role = 'admin', status = 'approved'
--    WHERE email = 'samadshaikh1825@gmail.com';
--
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- 8. GRANT PERMISSIONS TO authenticated ROLE
-- ────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users               TO authenticated;
GRANT ALL ON public.projects            TO authenticated;
GRANT ALL ON public.project_assignments TO authenticated;
GRANT ALL ON public.daily_logs          TO authenticated;

-- anon role only needs very limited access (signup trigger only)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.users TO anon;
