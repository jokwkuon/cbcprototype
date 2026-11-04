import {Shell} from '../../../components/shell';
import {CrmForm} from '../../../components/crm-form';
import {activityFormData} from '../../../lib/activity-data';
import {crmContext} from '../../../lib/crm-context';
import {validId} from '../../../lib/crm-validation';
import {createActivity} from '../actions';

export default async function NewActivity({searchParams}:{searchParams:Promise<{organization?:string;contact?:string}>}) {
  const data = await activityFormData(), params = await searchParams;
  const {client} = await crmContext();
  let organization = typeof params.organization === 'string' && validId(params.organization) && data!.fields.find(f => f.name === 'organization_id')?.options?.some(o => o.id === params.organization) ? params.organization : '';
  let contact = '';
  if (typeof params.contact === 'string' && validId(params.contact)) {
    const {data:person,error} = await client.from('contacts').select('id,organization_id').eq('id',params.contact).maybeSingle();
    if (error) throw new Error('Unable to load the interaction context.');
    if (person) {contact = person.id;organization = person.organization_id || organization;}
  }
  const cancel = contact ? `/contacts?selected=${contact}` : organization ? `/organizations?selected=${organization}` : '/activities';
  return <Shell><h1 className="text-3xl font-bold">Add activity</h1><p>Log the interaction and participants, then add one or more follow-up actions on its detail page.</p><CrmForm action={createActivity} {...data!} values={{...data!.values,...(organization ? {organization_id:organization} : {}),...(contact ? {contact_ids:[contact]} : {})}} cancelHref={cancel}/></Shell>;
}
