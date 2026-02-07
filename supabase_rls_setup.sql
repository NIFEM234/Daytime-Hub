-- Supabase RLS setup script for contact_messages and volunteer_applications
-- Run this in the Supabase SQL editor (SQL editor -> New query) as a project admin.
BEGIN;
-- 1) Enable RLS on the tables
ALTER TABLE
  IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.volunteer_applications ENABLE ROW LEVEL SECURITY;
-- 2) Revoke public (broad) privileges
  REVOKE ALL ON TABLE public.contact_messages
FROM
  PUBLIC;
REVOKE ALL ON TABLE public.volunteer_applications
FROM
  PUBLIC;
-- 3) Create admins helper table (one-time)
  CREATE TABLE IF NOT EXISTS public.admins (user_id uuid PRIMARY KEY);
-- 4) Drop any existing policies we will recreate (safe idempotent step)
  DROP POLICY IF EXISTS anon_insert_contact_messages ON public.contact_messages;
DROP POLICY IF EXISTS anon_insert_volunteer_applications ON public.volunteer_applications;
DROP POLICY IF EXISTS admins_select_contact_messages ON public.contact_messages;
DROP POLICY IF EXISTS admins_update_contact_messages ON public.contact_messages;
DROP POLICY IF EXISTS admins_delete_contact_messages ON public.contact_messages;
DROP POLICY IF EXISTS admins_insert_contact_messages ON public.contact_messages;
DROP POLICY IF EXISTS admins_select_volunteer_applications ON public.volunteer_applications;
DROP POLICY IF EXISTS admins_update_volunteer_applications ON public.volunteer_applications;
DROP POLICY IF EXISTS admins_delete_volunteer_applications ON public.volunteer_applications;
DROP POLICY IF EXISTS admins_insert_volunteer_applications ON public.volunteer_applications;
-- 5) Allow anonymous website users to INSERT only
  CREATE POLICY anon_insert_contact_messages ON public.contact_messages FOR
INSERT
  TO anon WITH CHECK (true);
CREATE POLICY anon_insert_volunteer_applications ON public.volunteer_applications FOR
INSERT
  TO anon WITH CHECK (true);
-- 6) Allow authenticated admin users (listed in public.admins) to SELECT/UPDATE/DELETE
  CREATE POLICY admins_select_contact_messages ON public.contact_messages FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
CREATE POLICY admins_update_contact_messages ON public.contact_messages FOR
UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
CREATE POLICY admins_delete_contact_messages ON public.contact_messages FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
CREATE POLICY admins_select_volunteer_applications ON public.volunteer_applications FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
CREATE POLICY admins_update_volunteer_applications ON public.volunteer_applications FOR
UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
CREATE POLICY admins_delete_volunteer_applications ON public.volunteer_applications FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
-- 7) Optional: allow authenticated admins to INSERT via admin UI
  CREATE POLICY admins_insert_contact_messages ON public.contact_messages FOR
INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
CREATE POLICY admins_insert_volunteer_applications ON public.volunteer_applications FOR
INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        public.admins
      WHERE
        user_id = auth.uid()
    )
  );
COMMIT;
-- NOTES:
  -- - Do NOT expose the `service_role` key to client-side code.
  -- - To add an admin: INSERT INTO public.admins (user_id) VALUES ('<admin-uuid>');
  -- - Get user IDs from Supabase Auth > Users or run: SELECT id, email FROM auth.users;