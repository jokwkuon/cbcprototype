'use client';
import {useActionState} from 'react';
import type {FormState} from '../lib/crm-validation';
export type RecordField={name:string;label:string;required?:boolean;type?:string;options?:{id:string;name:string}[]};
export function RecordForm({fields,initial={},action,label='Save record'}:{fields:RecordField[];initial?:Record<string,string|null>;action:(s:FormState,f:FormData)=>Promise<FormState>;label?:string}){
 const [state,submit,pending]=useActionState(action,{} as FormState);const values={...initial,...state.values};
 return <form action={submit} className="card grid gap-4 p-5 md:grid-cols-2">{initial.id&&<input name="id" type="hidden" value={initial.id}/>}{state.message&&<p className="md:col-span-2" role="alert">{state.message}</p>}<fieldset className="contents" disabled={pending} key={JSON.stringify(state.values)}>{fields.map(f=><label key={f.name}>{f.label}{f.options?<select aria-label={f.label} name={f.name} required={f.required} defaultValue={String(values[f.name]??'')}><option value="">Unlinked</option>{f.options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>:<input aria-label={f.label} name={f.name} type={f.type||'text'} required={f.required} defaultValue={String(values[f.name]??'')}/>} {state.errors?.[f.name]&&<span role="alert">{state.errors[f.name]}</span>}</label>)}</fieldset><button disabled={pending} className="rounded bg-[var(--cbc-primary)] p-3 text-white">{pending?'Saving…':label}</button></form>;
}
