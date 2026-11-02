import {Shell} from '../../../components/shell';
import {RecordForm} from '../../../components/record-form';
import {crmContext} from '../../../lib/crm-context';
import {mentorshipFields} from '../../../lib/mentorship-data';
import {saveMentorship} from '../actions';
export default async function NewPair(){const {canWrite}=await crmContext();return <Shell><h1>Create pairing</h1><p>Provisional demo: both contacts must share the selected organization; cohort must belong to the program. Status and frequency are manual.</p>{canWrite?<RecordForm fields={await mentorshipFields('pair')} action={saveMentorship.bind(null,'pair',false)}/>:<p>Read-only access.</p>}</Shell>;}
