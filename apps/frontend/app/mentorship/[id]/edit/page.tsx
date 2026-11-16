import {notFound} from 'next/navigation';
import {Shell} from '../../../../components/shell';
import {RecordForm} from '../../../../components/record-form';
import {crmContext} from '../../../../lib/crm-context';
import {mentorshipFields} from '../../../../lib/mentorship-data';
import {saveMentorship} from '../../actions';
export default async function EditPair({params}:{params:Promise<{id:string}>}){const {id}=await params,{client,canWrite}=await crmContext();if(!canWrite)return <Shell>Read-only access.</Shell>;const {data,error}=await client.from('mentorship_pairs').select('*').eq('id',id).maybeSingle();if(error)throw new Error('Pairing unavailable.');if(!data)notFound();return <Shell><h1>Edit pairing</h1><RecordForm initial={data} fields={await mentorshipFields('pair')} action={saveMentorship.bind(null,'pair',true)}/></Shell>;}
