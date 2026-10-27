# CBC CRM frontend

## Local setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
2. Apply `../../database/migrations/202610130001_initial_crm.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Create approved synthetic users in Supabase Auth. The signup trigger creates a viewer profile; an administrator must assign `admin` or `staff` in the database using a trusted SQL session.
4. Run `npm install`, then `npm run dev`.

The browser only receives the Supabase anon key. Never add a service-role key to `.env.local`, client code, or this repository.

## Verification

`npm run typecheck` and `npm run lint` are the local static checks. `npm run build` requires a compatible TypeScript/Next dependency install; use the lockfile and a network-enabled environment when dependency resolution is available.

## Next.js security maintenance

Next.js is pinned to 16.4.3 (upgraded from 16.4.0), with the npm lockfile updated
and `experimental.agentUpgrade` set to `"security"`. Existing Server Actions
origin configuration is preserved. This maintenance supports REQ-008 (Access);
it does not establish approval of the proposed access rules.

Verified with npm install, `npm exec -- next --version`, `npm run lint`,
`npm run typecheck`, `NODE_ENV=production npm run build`, and `npm audit`
(zero vulnerabilities). Use a standard `NODE_ENV`: the inherited nonstandard
value caused a prerender failure that disappeared with `production`.
The existing middleware deprecation warning remains.

Demo verification: start the production build on localhost with synthetic
configuration, open `/login` and confirm the sign-in form renders; unauthenticated
requests to `/`, `/dashboard`, `/contacts`, and `/organizations` redirect to
`/login`. These checks passed without live records or credentials. Authenticated
workflows and relevant CBC approval remain pending.
