import {notFound} from 'next/navigation';
import {Shell} from '../../../../../../components/shell';
import {RecordForm} from '../../../../../../components/record-form';
import {crmContext} from '../../../../../../lib/crm-context';
import {mentorshipFields} from '../../../../../../lib/mentorship-data';
import {saveMentorship} from '../../../../actions';
export default async function EditCheckin({params}:{params:Promise<{id:string;checkinId:string}>}){const {id,checkinId}=await params,{client,canWrite}=await crmContext();if(!canWrite)return <Shell>Read-only access.</Shell>;const {data,error}=await client.from('mentorship_checkins').select('*').eq('id',checkinId).eq('pair_id',id).maybeSingle();if(error)throw new Error('Check-in unavailable.');if(!data)notFound();return <Shell><h1>Edit check-in</h1><RecordForm initial={data} fields={await mentorshipFields('checkin',id)} action={saveMentorship.bind(null,'checkin',true)}/></Shell>;}
