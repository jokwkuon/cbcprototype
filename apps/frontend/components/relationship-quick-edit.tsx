'use client';

import {useActionState, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {quickEditRelationship,type QuickEditState} from '../app/relationships-actions';
import type {RelationshipKind} from '../lib/relationship-directory';
import {FormField} from './fields';
import type {FieldDefinition} from '../lib/crm-fields';
import {levels,relationshipStatuses} from '../lib/crm-validation';

export function RelationshipQuickEdit({kind,id,updatedAt,values}:{kind:RelationshipKind;id:string;updatedAt:string;values:Record<string,string|null>}) {
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), dirtyRef = useRef(false);
  const [session,setSession] = useState(0);
  const [editing,setEditing] = useState(false);
  function close() {
    if (dirtyRef.current && !window.confirm('Discard your unsaved quick edits?')) return;
    dirtyRef.current = false; dialog.current?.close();setEditing(false); trigger.current?.focus();
  }
  useEffect(() => {
    const unload = (event:BeforeUnloadEvent) => {if (dirtyRef.current) {event.preventDefault();event.returnValue = '';}};
    window.addEventListener('beforeunload',unload);
    return () => window.removeEventListener('beforeunload',unload);
  },[]);
  return <><button ref={trigger} className="button" onClick={() => {setEditing(true);setSession(s => s+1);dialog.current?.showModal();}}>Quick edit</button>
    <dialog ref={dialog} className="relationship-edit-dialog" aria-labelledby={`quick-edit-${id}`} onCancel={event => {event.preventDefault();close();}}>
      {editing && <QuickEditForm key={session} kind={kind} id={id} updatedAt={updatedAt} values={values} dirtyRef={dirtyRef} close={close}/>}
    </dialog></>;
}
function QuickEditForm({kind,id,updatedAt,values,dirtyRef,close}:{kind:RelationshipKind;id:string;updatedAt:string;values:Record<string,string|null>;dirtyRef:React.RefObject<boolean>;close:()=>void}) {
  const [changed,setChanged] = useState(false);
  const [state,action,pending] = useActionState(async (previous:QuickEditState,form:FormData) => {
    const result = await quickEditRelationship(kind,previous,form);
    if (result.success) {dirtyRef.current = false;setChanged(false);}
    return result;
  },{});
  const plural = kind === 'organization' ? 'organizations' : 'contacts';
  const fields:FieldDefinition[] = kind === 'organization' ? [
    {name:'relationship_status',label:'Relationship Status',type:'select',options:relationshipStatuses.map(x => ({id:x,name:x}))},
    {name:'priority_level',label:'Priority Level',type:'select',options:levels.map(x => ({id:x,name:x}))},
    {name:'location',label:'Location'}, {name:'notes',label:'Notes',type:'textarea'},
  ] : [ {name:'title',label:'Title'}, {name:'email',label:'Email',type:'email'}, {name:'phone',label:'Phone'}, {name:'contact_type',label:'Contact Type'}, {name:'notes',label:'Notes',type:'textarea'} ];
  const shown = {...values,...state.values};
  return <form action={action} onChange={() => {dirtyRef.current = true;setChanged(true);}}>
    <header><div><h2 id={`quick-edit-${id}`}>Quick edit {kind}</h2><p>Update the essentials. Other record fields stay as they are.</p></div><button type="button" aria-label="Close quick edit" disabled={pending} onClick={close}>×</button></header>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="updated_at" value={state.updatedAt || updatedAt}/>
    {state.message && <p role="alert" className="quick-edit-error">{state.message}</p>}
    {state.success && !changed && <p role="status" className="quick-edit-success">Changes saved successfully.</p>}
    <fieldset key={JSON.stringify(state.values)} disabled={pending} className="quick-edit-fields">{fields.map(field => <FormField key={field.name} field={field} value={shown[field.name]} error={state.errors?.[field.name]}/>)}</fieldset>
    <footer><Link href={`/${plural}/${id}/edit`} onClick={event => {if (dirtyRef.current && !window.confirm('Leave quick edit? Unsaved changes will be lost.')) event.preventDefault();else dirtyRef.current = false;}}>Full record editor</Link><button type="button" className="button" disabled={pending} onClick={close}>Done</button><button className="button button-primary" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button></footer>
  </form>;
}
