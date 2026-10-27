import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {root,local,prepare,requireLocalUrl} from "./prepare.mjs";
test("REQ-008: demo helpers reject remote and wrong-port endpoints",()=>{
 for(const value of ["https://example.supabase.co","http://127.0.0.1:54321","http://127.0.0.1:54421@example.test:54421"]){assert.throws(()=>requireLocalUrl(value,54421));}
 assert.equal(requireLocalUrl("http://127.0.0.1:54421",54421).hostname,"127.0.0.1");
});
test("REQ-008: generated migration copies match canonical files and exclude proposals",()=>{
 const manifest=prepare();assert.equal(manifest.length,4);assert.equal(manifest[0].name,"202610130001_initial_crm.sql");
 for(const item of manifest){const copy=readFileSync(resolve(root,"environments/demo/supabase/migrations",item.name));assert.equal(createHash("sha256").update(copy).digest("hex"),item.sha256);assert.ok(!item.name.includes("draft"));}
});
test("REQ-008: runtime keys, passwords and generated artifacts remain ignored and private",()=>{
 assert.equal(statSync(local).mode&0o777,0o700);
 for(const name of ["status.json","accounts.json"]){const path=resolve(local,name);assert.equal(statSync(path).mode&0o777,0o600);execFileSync("git",["check-ignore","--quiet",path],{cwd:root});}
});
