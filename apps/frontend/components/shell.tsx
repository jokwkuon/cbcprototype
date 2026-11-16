import {crmContext} from '../lib/crm-context';
import {Workspace} from './workspace';
export async function Shell({children}:{children:React.ReactNode}){
 const {user,profile,canWrite}=await crmContext();
 const name=user?.user_metadata?.full_name||'CBC colleague';
 return <Workspace name={name} role={profile?.role||'Guest'} canWrite={canWrite}>{children}</Workspace>;
}
