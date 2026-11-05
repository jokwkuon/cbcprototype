import type { SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server.js";

// A fresh closure per HTTP request; never share session state across requests.
export function sessionResponse(request: NextRequest) {
  let current = NextResponse.next({ request });
  const setAll: SetAllCookies = (items, headers) => {
    for (const { name, value } of items) request.cookies.set(name, value);
    const next = NextResponse.next({ request });
    // SSR can write more than once; retain earlier chunks/deletions and headers.
    for (const cookie of current.cookies.getAll()) next.cookies.set(cookie);
    for (const key of ["cache-control", "expires", "pragma"]) {
      const value = current.headers.get(key);
      if (value) next.headers.set(key, value);
    }
    for (const { name, value, options } of items) next.cookies.set(name, value, options);
    for (const [key, value] of Object.entries(headers)) next.headers.set(key, value);
    current = next;
  };
  return {
    setAll,
    response: () => current,
    redirect(url: URL) {
      const redirect = NextResponse.redirect(url);
      for (const cookie of current.cookies.getAll()) redirect.cookies.set(cookie);
      for (const key of ["cache-control", "expires", "pragma"]) {
        const value = current.headers.get(key);
        if (value) redirect.headers.set(key, value);
      }
      return redirect;
    },
  };
}
