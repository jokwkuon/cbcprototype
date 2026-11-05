'use client';
import {useState} from 'react';
import { displayValue } from "../lib/presentation";
import type { FieldDefinition } from "../lib/crm-fields";
export function FormField({ field, value, error, onChange }: { field: FieldDefinition; value?: string | number | string[] | null; error?: string; onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> }) {
  const [query,setQuery]=useState(''),[selection,setSelection]=useState<string[]>(Array.isArray(value)?value:[]);
  const id = `field-${field.name}`;
  const shared = { "aria-label": field.label, onChange, id, name: field.name, required: field.required, defaultValue: value ?? "", "aria-invalid": !!error, "aria-describedby": `${id}-hint ${id}-error` };
  return <div><label className="block text-sm font-semibold" htmlFor={id}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
    {field.type==='multiselect'&&<input type="search" aria-label={`Search ${field.label.toLowerCase()} options`} placeholder="Find a person or record…" value={query} onChange={e=>setQuery(e.target.value)}/>}
    {field.type === "textarea" ? <textarea {...shared} rows={4}/> : (field.type === "select" || field.type === "multiselect") ? <select {...shared} {...(field.type==='multiselect'?{onChange:(e:React.ChangeEvent<HTMLSelectElement>)=>{setSelection(Array.from(e.target.selectedOptions,o=>o.value));onChange?.(e);},size:6}:{})} multiple={field.type === "multiselect"}>{field.options?.filter(o=>field.type!=='multiselect'||selection.includes(o.id)||o.name.toLowerCase().includes(query.toLowerCase())).map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select> : <input {...shared} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined}/>}
    <p id={`${id}-hint`} className="field-help">{field.hint}{field.type==='multiselect'&&' Search narrows the list; selected records stay visible. Use Ctrl or Command to select multiple records.'}</p><p id={`${id}-error`} className="form-error">{error}</p>
  </div>;
}
export function DetailFields({ fields }: { fields: [string, React.ReactNode][] }) {
  return <dl className="grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{typeof value === "string" ? displayValue(value) : value ?? "Not specified"}</dd></div>)}</dl>;
}
export function PendingFields({ labels }: { labels: string[] }) {
  return <section className="card mt-5 p-6"><h2 className="mb-4 font-bold">Metrics awaiting definition</h2><p className="field-help">CBC must approve these definitions before values can be calculated.</p><DetailFields fields={labels.map(label => [label, "Definition pending"])} /></section>;
}
