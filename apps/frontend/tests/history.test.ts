import {test} from 'node:test';
import assert from 'node:assert/strict';
import {historyCursor,historyAfter} from '../lib/history-query.ts';
const id='a0000000-0000-4000-8000-000000000001';
test('REQ-005/008: history cursors validate syntax before PostgREST filters',()=>{
  for(const value of ['{','null',JSON.stringify({id:'bad',value:null}),JSON.stringify({id,value:'2026-01-01),id.gt.injected'})])assert.throws(()=>historyCursor(value));
  assert.equal(historyCursor(null),null);
  assert.deepEqual(historyCursor(JSON.stringify({id,value:null})),{id,value:null});
  assert.match(historyAfter('activities',{id,value:'2026-01-01T12:00:00+00:00'}),/occurred_at.lt/);
  assert.match(historyAfter('open',{id,value:'2026-01-01'}),/due_date.is.null/);
  assert.equal(historyAfter('open',{id,value:null}),`and(due_date.is.null,id.gt.${id})`);
  assert.throws(()=>historyAfter('activities',{id,value:null}));
  assert.throws(()=>historyAfter('open',{id,value:'2026-01-01T12:00:00Z'}));
});
