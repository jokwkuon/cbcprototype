import {diagnostic} from '../../../../lib/diagnostics';
import {crmContext} from '../../../../lib/crm-context';
import {relationshipHistoryPage} from '../../../../lib/relationship-history';
import {historyCursor} from '../../../../lib/history-query';
import {validId} from '../../../../lib/crm-validation';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request) {
  const started=performance.now();
  const params=new URL(request.url).searchParams;
  const kind=params.get('kind'),id=params.get('id'),section=params.get('section');
  let cursor;
  try {
    if([...params.keys()].some(key=>params.getAll(key).length!==1)||!id||!validId(id)||(kind!=='organization'&&kind!=='contact')||(section!=='activities'&&section!=='open'&&section!=='completed'))throw new Error('Invalid request');
    cursor=historyCursor(params.get('cursor'));
  } catch {return Response.json({error:'Invalid history request.'},{status:400,headers});}
  try {
    const {client}=await crmContext();
    return Response.json(await relationshipHistoryPage(client,kind!,id!,section!,cursor),{headers});
  } catch {const correlationId=diagnostic('history_failed',started);return Response.json({error:'History unavailable. Try again.',correlationId},{status:503,headers});}
}
