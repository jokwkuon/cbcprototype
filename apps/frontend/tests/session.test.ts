import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { sessionResponse } from "../lib/session-response.ts";

test("REQ-008: all refresh chunks, options, request cookies and cache headers survive redirect", () => {
  const request = new NextRequest("http://localhost/dashboard");
  const session = sessionResponse(request);
  session.setAll([
    { name: "session.0", value: "first", options: { path: "/", httpOnly: true, secure: true, sameSite: "lax" } },
    { name: "session.1", value: "second", options: { path: "/", maxAge: 90 } },
  ], { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Expires": "0" });
  session.setAll([{ name: "old-session", value: "", options: { path: "/", maxAge: 0 } }], {});
  for (const response of [session.response(), session.redirect(new URL("http://localhost/login"))]) {
    assert.equal(response.cookies.get("session.0")?.value, "first");
    assert.equal(response.cookies.get("session.0")?.httpOnly, true);
    assert.equal(response.cookies.get("session.0")?.secure, true);
    assert.equal(response.cookies.get("session.0")?.sameSite, "lax");
    assert.equal(response.cookies.get("session.1")?.maxAge, 90);
    assert.equal(response.cookies.get("old-session")?.maxAge, 0);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("pragma"), "no-cache");
  }
  assert.equal(request.cookies.get("session.0")?.value, "first");
  assert.equal(request.cookies.get("session.1")?.value, "second");
  assert.match(session.response().headers.get("x-middleware-request-cookie") ?? "", /session.0=first/);
});
test("REQ-008: concurrent request closures never share cookies", async () => {
  await Promise.all(Array.from({ length: 25 }, async (_, i) => {
    const session = sessionResponse(new NextRequest("http://localhost/dashboard"));
    await Promise.resolve();
    session.setAll([{ name: "session", value: String(i), options: {} }], {});
    assert.equal(session.response().cookies.get("session")?.value, String(i));
  }));
});
