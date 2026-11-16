import {crmContext} from '../../../lib/crm-context';
export async function GET(){
 const headers={'Cache-Control':'private, no-store'};
 try {
  const {client}=await crmContext();
  const {error}=await client.from('organizations').select('id',{head:true}).limit(1).abortSignal(AbortSignal.timeout(5000));
  if(error)throw new Error('Unavailable');
  return Response.json({status:'ok'},{headers});
 } catch {return Response.json({status:'unavailable'},{status:503,headers});}
}
