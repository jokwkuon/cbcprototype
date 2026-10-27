import type { Reporter,TestCase,TestResult,FullResult } from "@playwright/test/reporter";
import { writeFileSync,mkdirSync } from "node:fs";
import { resolve } from "node:path";
// Keep generated credentials out of console call logs, traces, screenshots and public artifacts.
export default class PrivateReporter implements Reporter {
 results:{title:string;status:string;errors:unknown[]}[]=[];
 onTestEnd(test:TestCase,result:TestResult){
  this.results.push({title:test.title,status:result.status,errors:result.errors});
  console.log(`${result.status==='passed'?'PASS':'FAIL'}: ${test.title}`);
 }
 onEnd(result:FullResult){
  const directory=resolve(__dirname,"../../../.local/cbc-demo");mkdirSync(directory,{recursive:true,mode:0o700});
  writeFileSync(resolve(directory,"browser-verification.json"),JSON.stringify({status:result.status,tests:this.results},null,2),{mode:0o600});
  console.log(`Local real-Supabase browser suite: ${result.status}. Private diagnostics saved; no credential values printed.`);
 }
}
