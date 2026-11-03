import {createClient} from '../lib/supabase/server';
import {Workspace} from './workspace';
export async function Shell({children}:{children:React.ReactNode}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 const {data:profile}=user?await client.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle():{data:null};
 const name=user?.user_metadata?.full_name||'CBC colleague';
 return <Workspace name={name} role={profile?.role||'Guest'} canWrite={Boolean(profile?.is_active&&['admin','staff'].includes(profile.role))}>{children}</Workspace>;
}
