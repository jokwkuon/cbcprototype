import {test} from 'node:test';import assert from 'node:assert/strict';
import {localDate,recordReference} from '../lib/presentation.ts';
import {monthlyCash,exactCents} from '../lib/chart-data.ts';
test('REQ-006/013 V2 chart sums exact dated receipts without crossing year or future months',()=>{const totals=monthlyCash([{received_on:'2025-01-01',amount:'0.10'},{received_on:'2025-01-31',amount:'0.20'},{received_on:'2025-02-01',amount:'99999999999999999999.99'},{received_on:'2024-01-01',amount:'10.00'},{received_on:'2025-12-01',amount:'20.00'}],2025,2);assert.deepEqual(totals,[30n,9999999999999999999999n]);assert.equal(exactCents(totals[0]),'0.30');assert.equal(exactCents(-10n),'-0.10');assert.throws(()=>monthlyCash([],2025,13));});
test('REQ-006 V2 dates preserve calendar dates and Calgary time including DST',()=>{assert.match(localDate('2026-01-01'),/Jan 1, 2026/);assert.match(localDate('2026-01-01T07:00:00Z',true),/Jan 1, 2026/);assert.match(localDate('2026-07-01T06:00:00Z',true),/Jul 1, 2026/);assert.equal(recordReference('b0000000-0000-4000-8000-000000000002'),'b000·0002');});

import {statusTone} from '../lib/status-tone.ts';
test('REQ-004/006/009 exact module statuses never imply success for partial or unknown values',()=>{assert.equal(statusTone('Partially Received','payment'),'warning');assert.equal(statusTone('Received','payment'),'success');assert.equal(statusTone('Unpaid','payment'),'warning');assert.equal(statusTone(null,'payment'),'neutral');assert.equal(statusTone('Not fully received','payment'),'neutral');assert.equal(statusTone('Scheduled','mentorship'),'info');assert.equal(statusTone('Overdue','membership'),'danger');assert.equal(statusTone('Active','funding'),'neutral');});
import {readFileSync} from 'node:fs';
test('REQ-008 visual token pairs meet WCAG AA normal text contrast',()=>{
 const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')+readFileSync(new URL('../app/visual-system.css',import.meta.url),'utf8');
 const token=(name:string)=>{const matches=[...css.matchAll(new RegExp(`--cbc-${name}:\\s*(#[0-9a-fA-F]{3,6})(?=[;}])`,'g'))];assert.ok(matches.length,name);let hex=matches.at(-1)![1].slice(1);if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);};
 const luminance=(rgb:number[])=>rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const pairs=[['ink','surface'],['muted','surface'],['muted','bg'],['surface','primary'],['surface','primary-hover'],['success','success-light'],['warning','warning-light'],['danger','danger-light'],['info','info-light']];
 for(const [fg,bg]of pairs){const a=luminance(token(fg)),b=luminance(token(bg)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,`${fg}/${bg}: ${ratio.toFixed(2)}:1`);}
});
