'use server';

import {revalidatePath} from 'next/cache';
import {crmContext} from '../lib/crm-context';
import {formValues, parseCrmForm, recordId, ValidationError, type FormState} from '../lib/crm-validation';
import type {RelationshipKind} from '../lib/relationship-directory';

export type QuickEditState = FormState & {success?: boolean; updatedAt?: string};

// Validate with the same domain parser, then write only the explicit quick-edit fields.
// Never send the merged record back: that could overwrite unrelated changes or ownership.
export async function quickEditRelationship(kind: RelationshipKind, _state: QuickEditState, form: FormData): Promise<QuickEditState> {
  try {
    if (!['organization','contact'].includes(kind)) throw new Error('Invalid record type.');
    const {client,canWrite} = await crmContext();
    if (!canWrite) throw new Error('Your role cannot edit these records.');
    const id = recordId(form), table = kind === 'organization' ? 'organizations' : 'contacts';
    const {data:current,error:loadError} = await client.from(table).select('*').eq('id',id).single();
    if (loadError || !current) throw new Error('Unable to load this record. Your changes have not been saved.');
    const version = String(form.get('updated_at') || '');
    if (!version || current.updated_at !== version) throw new Error('This record changed since you opened it. Reopen quick edit to review the latest values before saving.');
    const allowed = kind === 'organization' ? ['relationship_status','priority_level','location','notes'] : ['title','email','phone','contact_type','notes'];
    const merged = new FormData();
    for (const [key,value] of Object.entries(current)) if (value !== null) merged.set(key,String(value));
    for (const key of allowed) if (form.has(key)) merged.set(key,String(form.get(key)));
    const parsed = parseCrmForm(kind,merged);
    const patch = Object.fromEntries(allowed.filter(key => form.has(key)).map(key => [key,parsed[key]]));
    if (!Object.keys(patch).length) throw new Error('No editable values were supplied.');
    const {data,error} = await client.from(table).update(patch).eq('id',id).eq('updated_at',version).select('updated_at').maybeSingle();
    if (error) throw new Error('Unable to save. Check your access and connection, then try again.');
    if (!data) throw new Error('This record changed while saving. Reopen quick edit to review the latest values.');
    for (const path of ['/organizations','/contacts','/dashboard','/interests','/programs','/reports','/membership','/mentorship']) revalidatePath(path,'layout');
    return {success:true,updatedAt:data.updated_at,values:formValues(form)};
  } catch (error) {
    return {values:formValues(form),message:error instanceof Error ? error.message : 'Unable to save.',errors:error instanceof ValidationError ? error.errors : undefined};
  }
}
