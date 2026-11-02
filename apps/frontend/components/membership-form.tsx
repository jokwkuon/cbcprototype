'use client';
import { useActionState } from 'react';
import { saveMembership } from '../app/membership/actions';
import { membershipFields } from '../lib/membership-validation';
import type { FormState } from '../lib/crm-validation';
export const membershipLabels:Record<string,string>={contact_id:'Contact member',member_organization_id:'Organization member',organization_id:'Affiliated organization',membership_type:'Membership Type',industry:'Industry',start_date:'Start Date',renewal_date:'Renewal Date',fee:'Membership Fee (CAD)',payment_status:'Payment Status (manual)',notes:'Notes'};
export function MembershipForm({record={},contacts,organizations}:{record?:Record<string,string|null>;contacts:{id:string;name:string}[];organizations:{id:string;name:string}[]}){
 const [state,action,pending]=useActionState(saveMembership.bind(null,Boolean(record.id)),{} as FormState);
 const values={...record,...state.values};
 return <form action={action} className="card grid gap-4 p-5 md:grid-cols-2">
 {record.id&&<input type="hidden" name="id" value={record.id}/>}
 <p className="md:col-span-2">Choose exactly one member. Fee and payment status are planning metadata, separate from received Giving cash. Status uses provisional Calgary date boundaries.</p>
 {state.message&&<p role="alert" className="md:col-span-2">{state.message}</p>}
 <fieldset className="contents" disabled={pending} key={JSON.stringify(state.values)}>{membershipFields.map(k=><label key={k}>{membershipLabels[k]}{k.endsWith('_id')?<select aria-label={membershipLabels[k]} name={k} defaultValue={String(values[k]??'')}><option value="">Unlinked</option>{(k==='contact_id'?contacts:organizations).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>:<input aria-label={membershipLabels[k]} name={k} type={k.endsWith('_date')?'date':'text'} required={['membership_type','start_date'].includes(k)} defaultValue={String(values[k]??'')} inputMode={k==='fee'?'decimal':undefined}/>}{state.errors?.[k]&&<span role="alert">{state.errors[k]}</span>}</label>)}</fieldset>
 <button disabled={pending} className="rounded bg-[var(--cbc-primary)] p-3 text-white">{pending?'Saving…':'Save membership'}</button></form>;
}
