import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMembership} from '../lib/membership-validation.ts';
const id='60000000-0000-4000-8000-000000000001';
function form(extra:Record<string,string>={}){const f=new FormData();for(const [k,v]of Object.entries({contact_id:id,membership_type:'Synthetic Member',start_date:'2026-01-01',...extra}))f.set(k,v);return f;}
test('REQ-009 exact optional money and manual labels',()=>{assert.equal(parseMembership(form({fee:'0.10',payment_status:'Unknown'})).fee,'0.10');assert.equal(parseMembership(form()).fee,null);});
test('REQ-009 member identity, dates, money and affiliation validation',()=>{for(const v of [{contact_id:''},{member_organization_id:id},{renewal_date:'2025-12-31'},{start_date:'2026-02-30'},{fee:'NaN'},{fee:'1.001'},{fee:'-1'},{organization_id:'invalid'}] as Record<string,string>[])assert.throws(()=>parseMembership(form(v)));});
