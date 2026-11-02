import { notFound } from 'next/navigation';
import { Shell } from '../../../../components/shell';
import { MembershipForm } from '../../../../components/membership-form';
import { crmContext } from '../../../../lib/crm-context';
import { membershipOptions } from '../../../../lib/membership-data';
export default async function EditMembership({params}:{params:Promise<{id:string}>}){const {id}=await params,{client,canWrite}=await crmContext();if(!canWrite)return <Shell><p>Read-only access.</p></Shell>;const {data,error}=await client.from('membership_details').select('*').eq('id',id).maybeSingle();if(error)throw new Error('Membership unavailable.');if(!data)notFound();return <Shell><h1>Edit membership</h1><MembershipForm record={data} {...await membershipOptions(client)}/></Shell>;}
