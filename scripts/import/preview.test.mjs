import {test} from 'node:test';import assert from 'node:assert/strict';import {preview,parseCsv} from './preview.mjs';
test('REQ-007 quoted CSV, newline, nulls, provenance and deterministic dry run',()=>{
 const input='name,notes,website\r\n"Cedar Harbour Partners","Discuss \"\"Future Builders\"\"\nmentorship",https://example.test\r\nWillow Ridge Foundation,,\r\n';
 const r=preview(input);assert.equal(r.rowCount,2);assert.equal(r.errors.length,0);assert.equal(r.records[1].values.notes,null);assert.match(r.records[0].values.notes,/\n/);assert.equal(r.sha256,preview(input).sha256);assert.equal(r.dryRun,true);
});
test('REQ-007 errors are row/field scoped; matching names never merge',()=>{
 const r=preview('name,website\nAlderbrook Partners,javascript:alert(1)\nAlderbrook Partners,https://example.test\n,\nBad width\n');
 assert.equal(r.candidates.length,1);assert.equal(r.records.length,3);assert.deepEqual(r.errors.map(e=>e.code),['invalid_url','required','column_count']);
});
test('REQ-007 rejects malformed CSV, mapping and oversize payloads',()=>{
 for(const input of ['name,name\nx,x','unknown\nx','name\n"unclosed','name\na"b','name\n"a"x'])assert.throws(()=>preview(input));
 assert.throws(()=>parseCsv('x'.repeat(5*1024*1024+1)));
 assert.throws(()=>preview('name\n'+Array.from({length:10001},()=> 'Cedar Harbour Partners').join('\n')));
});
