import {Shell} from '../../../components/shell';
import {CrmForm} from '../../../components/crm-form';
import {contactFormData} from '../../../lib/crm-form-data';
import {validId} from '../../../lib/crm-validation';
import {createContact} from '../../actions';

export default async function New({searchParams}:{searchParams:Promise<{organization?:string}>}) {
  const data = await contactFormData(), params = await searchParams;
  const organization = typeof params.organization === 'string' && validId(params.organization) && data.fields.find(f => f.name === 'organization_id')?.options?.some(o => o.id === params.organization) ? params.organization : '';
  return <Shell><h1 className="text-3xl font-bold">Add contact</h1><CrmForm action={createContact} {...data} values={{...data.values,...(organization ? {organization_id:organization} : {})}} cancelHref={organization ? `/organizations?selected=${organization}` : '/contacts'}/></Shell>;
}
