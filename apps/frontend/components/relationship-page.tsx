import {Suspense} from 'react';
import Link from 'next/link';
import {Shell} from './shell';
import {crmContext} from '../lib/crm-context';
import {relationshipDirectory,type RelationshipKind,type DirectoryParams} from '../lib/relationship-directory';
import {RelationshipDirectory} from './relationship-directory';
import {RelationshipRecord,RecordLoading} from './relationship-record';
import {Icon} from './icons';

export async function RelationshipPage({kind,params}:{kind:RelationshipKind;params:DirectoryParams}) {
  const {client,canWrite} = await crmContext();
  const title = kind === 'organization' ? 'Organizations' : 'Contacts';
  // Ignore array-valued/ambiguous query parameters at the server boundary.
  const view = Object.fromEntries(Object.entries(params).filter(([,value]) => typeof value === 'string')) as DirectoryParams;
  const {rows,total,page,options} = await relationshipDirectory(client,kind,view);
  const selected = view.selected || rows[0]?.id;
  return <Shell><div className="relationship-surface"><header className="relationship-page-heading"><div><div className="relationship-eyebrow">Relationships</div><h1>{title}</h1><p>{kind === 'organization' ? 'Work with the organizations behind your partnerships.' : 'People, conversations and the relationships that connect them.'}</p></div>{canWrite && <Link className="button button-primary" href={`/${title.toLowerCase()}/new`}><Icon name="plus" size={15}/>Add {kind}</Link>}</header>
    <RelationshipDirectory kind={kind} rows={rows} total={total} page={page} options={options} params={view} initialSelected={selected}>{selected && <Suspense key={selected} fallback={<RecordLoading/>}><RelationshipRecord kind={kind} id={selected}/></Suspense>}</RelationshipDirectory>
  </div></Shell>;
}
