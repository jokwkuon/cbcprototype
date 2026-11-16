import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { sessionResponse } from "./lib/session-response";

export async function proxy(request: NextRequest) {
  const session = sessionResponse(request);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: session.setAll } },
  );
  // Remote verification also observes revoked users. Authorization remains in
  // crmContext and database RLS; Proxy is only a session/redirect boundary.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname !== "/login") return session.redirect(new URL("/login", request.url));
  if (user && request.nextUrl.pathname === "/login") return session.redirect(new URL("/dashboard", request.url));
  return session.response();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
