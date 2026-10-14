# CBC CRM frontend

## Local setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
2. Apply `../../database/migrations/202610130001_initial_crm.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Create approved synthetic users in Supabase Auth. The signup trigger creates a viewer profile; an administrator must assign `admin` or `staff` in the database using a trusted SQL session.
4. Run `npm install`, then `npm run dev`.

The browser only receives the Supabase anon key. Never add a service-role key to `.env.local`, client code, or this repository.

## Verification

`npm run typecheck` and `npm run lint` are the local static checks. `npm run build` requires a compatible TypeScript/Next dependency install; use the lockfile and a network-enabled environment when dependency resolution is available.
