import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCrmForm, recordId, ValidationError } from "../lib/crm-validation.ts";
function form(values: Record<string, string>) { const f = new FormData(); for (const [key,value] of Object.entries(values)) f.set(key,value); return f; }
test("REQ-001: trims manual values, normalizes website and preserves unspecified owner", () => {
  const result = parseCrmForm("organization", form({ name: " Demo Org ", website: "example.test", estimated_opportunity: "123.50", potential: "High" }));
  assert.equal(result.name, "Demo Org"); assert.equal(result.website, "https://example.test/"); assert.equal(result.estimated_opportunity, 123.5); assert.equal(result.potential,"High"); assert.equal(Object.hasOwn(result,"relationship_owner"),false);
});
test("REQ-001/002: returns field errors together", () => {
  assert.throws(() => parseCrmForm("organization",form({ name: "  ", website:"javascript:alert(1)", relationship_strength:"Huge", estimated_opportunity:"Infinity", relationship_owner:"forged" })), (error: unknown) => {
    assert.ok(error instanceof ValidationError); assert.deepEqual(Object.keys(error.errors).sort(), ["estimated_opportunity","name","relationship_owner","relationship_strength","website"]); return true;
  });
});
test("REQ-002: contact fields, optional nulls, email and FK validation", () => {
  const result = parseCrmForm("contact",form({first_name:" Demo ",last_name:" Contact ",contact_type:"Board",influence_level:"High",interests:"Scholarships",notes:"Synthetic only"}));
  assert.equal(result.first_name,"Demo"); assert.equal(result.phone,null); assert.equal(result.notes,"Synthetic only");
  assert.throws(()=>parseCrmForm("contact",form({first_name:"Demo",last_name:"Contact",email:"bad",organization_id:"invalid"})),ValidationError);
});
test("REQ-001: rejects unsafe URLs, allows HTTP(S), validates record identity", () => {
  for(const website of ["https://name:password@example.test","data:text/html,demo","file:///etc/passwd","example.test bad"]){ assert.throws(()=>parseCrmForm("organization",form({name:"Demo",website})),ValidationError); }
  assert.equal(parseCrmForm("organization",form({name:"Demo",website:"http://example.test/path"})).website,"http://example.test/path");
  assert.throws(()=>recordId(form({id:"injected"})),ValidationError);
  assert.equal(recordId(form({id:"20000000-0000-4000-8000-000000000001"})),"20000000-0000-4000-8000-000000000001");
});
test("REQ-001: explicit owner clearing differs from omitted owner", () => {
 assert.equal(parseCrmForm("organization",form({name:"Demo",relationship_owner:""})).relationship_owner,null);
});
