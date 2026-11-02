import { Shell } from '../../../components/shell';
import { MembershipForm } from '../../../components/membership-form';
import { crmContext } from '../../../lib/crm-context';
import { membershipOptions } from '../../../lib/membership-data';
export default async function NewMembership(){const {client,canWrite}=await crmContext();return <Shell><h1>Create membership</h1>{canWrite?<MembershipForm {...await membershipOptions(client)}/>:<p>Read-only access.</p>}</Shell>;}
