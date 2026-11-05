'use client';
import Link from 'next/link';
import {useState} from 'react';
import type {Activity,FollowUp} from '../lib/activity-data';
import {localDate} from '../lib/presentation';
function displayTime(value:string|null){return value?localDate(value,true):'No past activity';}
import type {HistoryPage} from '../lib/relationship-history';
import type {HistorySection} from '../lib/history-query';
import type {RelationshipKind} from '../lib/relationship-directory';
import {FollowUpList} from './follow-up-list';
import {Icon} from './icons';
export function HistorySectionFeed({kind,id,section,initial,canWrite=false}:{kind:RelationshipKind;id:string;section:HistorySection;initial:HistoryPage<Activity|FollowUp>;canWrite?:boolean}) {
  const [page,setPage]=useState(initial),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const activity=section==='activities';
  async function more() {
    if(!page.next||loading)return;
    setLoading(true);setError('');
    try {
      const params=new URLSearchParams({kind,id,section,cursor:JSON.stringify(page.next)});
      const response=await fetch(`/api/relationships/history?${params}`,{cache:'no-store'});
      if(!response.ok)throw new Error();
      const next=await response.json() as HistoryPage<Activity|FollowUp>;
      setPage(current=>({...current,rows:[...current.rows,...next.rows.filter(row=>!current.rows.some(old=>old.id===row.id))],next:next.next}));
    } catch {setError('More history could not be loaded. Try again.');} finally {setLoading(false);}
  }
  return <section><div className="record-feed-heading"><h3>{activity?'Activity timeline':section==='open'?'Next steps':'Completed follow-ups'}</h3><span>{initial.total} {activity?'recorded':section==='open'?'open':'completed'}</span></div>
    {activity ? <><ol className="relationship-timeline">{(page.rows as Activity[]).map(a=><li key={a.id}><span className="timeline-event-icon"><Icon name="activities" size={15}/></span><div><div className="timeline-event-meta"><span>{a.activity_type}</span><time dateTime={a.occurred_at}>{displayTime(a.occurred_at)}</time></div><Link href={`/activities/${a.id}`}>{a.purpose||a.activity_type}</Link>{a.outcome&&<p>{a.outcome}</p>}{a.key_discussion&&<details><summary>Discussion notes</summary><p>{a.key_discussion}</p></details>}</div></li>)}</ol>{!page.rows.length&&<div className="record-no-activity"><h3>No interactions recorded</h3><p>Log a conversation to keep its context and follow-ups together.</p></div>}</> : <FollowUpList tasks={page.rows as FollowUp[]} canWrite={canWrite}/>}
    {error&&<p role="alert">{error}</p>}{page.next&&<button type="button" disabled={loading} onClick={more}>{loading?'Loading…':activity?'Load more interactions':section==='open'?'Load more open follow-ups':'Load more completed follow-ups'}</button>}
    <p className="text-sm">Showing {page.rows.length} of {initial.total}. History can change while you browse; reload for current counts.</p>
  </section>;
}
