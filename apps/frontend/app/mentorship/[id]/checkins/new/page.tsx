import {Shell} from '../../../../../components/shell';
import {RecordForm} from '../../../../../components/record-form';
import {crmContext} from '../../../../../lib/crm-context';
import {mentorshipFields} from '../../../../../lib/mentorship-data';
import {saveMentorship} from '../../../actions';
export default async function NewCheckin({params}:{params:Promise<{id:string}>}){const {id}=await params,{canWrite}=await crmContext();return <Shell><h1>Record check-in</h1><p>Completed check-ins only. Satisfaction is raw manual feedback; no numeric scale or health score is inferred.</p>{canWrite?<RecordForm initial={{pair_id:id}} fields={await mentorshipFields('checkin',id)} action={saveMentorship.bind(null,'checkin',false)}/>:<p>Read-only access.</p>}</Shell>;}
