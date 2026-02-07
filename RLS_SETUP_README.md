RLS Setup - Baby Steps (Supabase)

Goal: Enable Row Level Security on `contact_messages` and `volunteer_applications` so anonymous website visitors can INSERT form submissions, while only admins (via authenticated admin accounts) can read/update/delete.

Prerequisites
- You must be project owner/admin in Supabase.
- Know your Supabase project URL and have access to the SQL editor.

Step-by-step (baby steps)

1) Open Supabase Dashboard
- Go to https://app.supabase.com and select your project.

2) Open SQL editor
- In the left menu click "SQL" -> "New query".

3) Back up data (recommended)
- Optional but safe: run `SELECT * FROM public.contact_messages;` and `SELECT * FROM public.volunteer_applications;` and save results.

4) Run the prepared SQL script
- Open the file `supabase_rls_setup.sql` in this repo, copy its contents.
- Paste into the SQL editor.
- Click "Run".
- You should see "Query executed successfully" (or similar).

5) Add admin user(s)
- Find admin user id(s): in Supabase Dashboard -> Authentication -> Users, copy the `id` (uuid) of each admin account.
- In SQL editor run (replace <admin-uuid>):

  INSERT INTO public.admins (user_id) VALUES ('<admin-uuid>');

- Repeat to add more admins.

6) Test as anonymous (what the website uses)
- Use curl or Postman to INSERT a test row. Replace the placeholders with your project values.

  Example (INSERT as anon):

  curl -X POST \
    'https://<project>.supabase.co/rest/v1/contact_messages' \
    -H 'Content-Type: application/json' \
    -H 'apikey: <ANON_PUBLIC_KEY>' \
    -H 'Authorization: Bearer <ANON_PUBLIC_KEY>' \
    -d '{"name":"Test","email":"test@example.com","message":"hello"}'

  Expected: 201 Created (insert works).

  Now try a SELECT as anon (should fail):

  curl -X GET \
    'https://<project>.supabase.co/rest/v1/contact_messages' \
    -H 'apikey: <ANON_PUBLIC_KEY>' \
    -H 'Authorization: Bearer <ANON_PUBLIC_KEY>'

  Expected: 401/403 or empty/permission denied.

7) Test as admin (authenticated)
- Sign in via your app as an admin account to get a JWT, or use the Supabase dashboard SQL editor to run a SELECT to confirm admin access.
- Example: in your admin UI (client authenticated as admin) perform a GET of `/rest/v1/contact_messages` and verify results are returned.

8) If admin UI needs server-side access (optional)
- If your admin panel runs on the server, the server can use the `service_role` key (server-only) to bypass RLS for bulk tasks. Never put `service_role` in browser JS.

9) Troubleshooting
- If INSERT fails for anon: make sure you used the anon/public key (not service_role), and that RLS is enabled and `anon` insert policy exists.
- If SELECT still works for anon: double-check you revoked PUBLIC privileges and enabled RLS. Run `
  SELECT relrowsecurity, relacl FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND relname='contact_messages';
` to inspect.

10) Want me to apply changes?
- I cannot run queries against your Supabase project from here, but I created `supabase_rls_setup.sql` ready to run in your SQL editor.
- If you want, I can also create a small helper script (Node.js) to add/remove admins using the service_role key for convenience. Ask and I will add it.

Security reminders
- Never expose `service_role` to the browser.
- Prefer policies over broad grants. Keep `anon` minimal (INSERT-only here).

If you want, I can now:
- Provide the Node.js helper script to add admins, or
- Provide curl examples adapted to your project URL and anon key if you paste them here.
