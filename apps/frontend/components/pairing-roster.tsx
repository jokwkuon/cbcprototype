'use client';
import {useState,type ReactNode} from 'react';
import Link from 'next/link';
import type {Pair} from '../lib/mentorship-data';
import {localDate} from '../lib/presentation';
import {StatusBadge} from './data-table-client';
export function PairingRoster({pairs,children}:{pairs:Pair[];children:ReactNode}){
 const [view,setView]=useState<'roster'|'table'>('roster');
 return <><div className="roster-controls" role="group" aria-label="Pairing view"><button className="button" aria-pressed={view==='roster'} onClick={()=>setView('roster')}>Pairing roster</button><button className="button" aria-pressed={view==='table'} onClick={()=>setView('table')}>Table</button></div>{view==='table'?children:<div className="pairing-roster">{pairs.map(p=><article className="card pairing-card" key={p.id}><header><span>{p.program_name} · {p.cohort_label}</span><StatusBadge value={p.status} domain="mentorship"/></header><Link href={`/mentorship/${p.id}`} className="pairing-people"><span><small>Mentor</small><strong>{p.mentor_name}</strong></span><span aria-hidden="true">↔</span><span><small>Mentee</small><strong>{p.mentee_name}</strong></span></Link><p>{p.organization_name}</p><dl><div><dt>Last check-in</dt><dd>{localDate(p.last_checkin)}</dd></div><div><dt>Next action</dt><dd>{p.next_action||'No next action recorded'}{p.action_due_date&&<small>Due {localDate(p.action_due_date)}</small>}</dd></div></dl><Link className="button button-secondary" href={`/mentorship/${p.id}`}>Open pairing →</Link></article>)}{!pairs.length&&<p>No pairings match your filters.</p>}</div>}</>;
}
