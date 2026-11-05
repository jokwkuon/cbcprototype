'use client';

import Link from 'next/link';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {useEffect, useRef, useState, useTransition} from 'react';
import {type DirectoryParams,type DirectoryRecord,type RelationshipKind} from '../lib/relationship-directory';
import {recordReference} from '../lib/presentation';
import {StatusBadge} from './data-table-client';
import {Icon} from './icons';

export function RelationshipDirectory({kind, rows, total, page, options, params, initialSelected, children}: {
  kind: RelationshipKind; rows: DirectoryRecord[]; total:number; page:number; options:[string,string][]; params: DirectoryParams; initialSelected?:string; children: React.ReactNode;
}) {
  const router = useRouter(), path = usePathname(), queryParams = useSearchParams();
  const [query, setQuery] = useState(params.q || '');
  const [previousQuery,setPreviousQuery] = useState(params.q);
  if (previousQuery !== params.q) {setPreviousQuery(params.q);setQuery(params.q || '');}
  const [pending, startTransition] = useTransition();
  const search = useRef<HTMLInputElement>(null);
  const title = kind === 'organization' ? 'Organizations' : 'Contacts';
  const selected = params.selected || initialSelected || '';
  const status = params.status || '', group = params.group === 'category' ? 'category' : params.group === 'status' ? 'status' : '';
  const sort = params.sort === 'desc' ? 'desc' : 'asc';
  const pages = Math.max(1, Math.ceil(total / 10));
  const visible = rows;
  function href(changes: Record<string,string>) {
    const next = new URLSearchParams(queryParams.toString());
    for (const [key,value] of Object.entries(changes)) { if (value) next.set(key,value); else next.delete(key); }
    return `${path}${next.size ? `?${next}` : ''}`;
  }
  function navigate(changes: Record<string,string>) { startTransition(() => router.replace(href(changes), {scroll:false})); }
  // Keep typed text responsive; the URL is the durable view state.
  useEffect(() => {
    if (query === (params.q || '')) return;
    const timer = setTimeout(() => navigate({q:query, page:'1'}), 250);
    return () => clearTimeout(timer);
    // navigate closes over the latest URL, including record selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, params.q, queryParams]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target as Element).closest('input,textarea,select,[contenteditable]')) {
        event.preventDefault(); search.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  return <div className={`relationship-directory ${params.selected ? 'has-selection' : ''}`}>
    <div className="relationship-toolbar">
      <label className="directory-search"><Icon name="search" size={17}/><span className="sr-only">Search {title.toLowerCase()}</span><input ref={search} aria-label={`Search ${title.toLowerCase()}`} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`}/><kbd>/</kbd></label>
      <label><span className="sr-only">{kind === 'organization' ? 'Relationship status' : 'Filter by organization'}</span><select value={status} onChange={e => navigate({status:e.target.value,page:'1'})}>
        <option value="">{kind === 'organization' ? 'All relationship stages' : 'All organizations'}</option>
        {options.map(([value,label]) => <option key={value} value={value || 'unlinked'}>{label}</option>)}
      </select></label>
      <details className="directory-view"><summary><Icon name="sort" size={15}/> View</summary><div>
        <label>Sort by name<select aria-label="Sort by name" value={sort} onChange={e => navigate({sort:e.target.value,page:'1'})}><option value="asc">A → Z</option><option value="desc">Z → A</option></select></label>
        <label>Group records<select aria-label={`Group ${title.toLowerCase()}`} value={group} onChange={e => navigate({group:e.target.value,page:'1'})}><option value="">No grouping</option><option value="category">{kind === 'organization' ? 'Organization type' : 'Organization'}</option><option value="status">{kind === 'organization' ? 'Relationship stage' : 'Contact type'}</option></select></label>
      </div></details>
      {(query || status) && <button className="directory-clear" onClick={() => {setQuery('');navigate({q:'',status:'',page:'1'});}}>Clear filters</button>}
      <span className="directory-count" role="status">{pending ? 'Updating…' : `${total} ${total === 1 ? 'record' : 'records'}`}</span>
    </div>
    <div className="relationship-split" aria-busy={pending}>
      <section className="relationship-list" aria-label={`${title} results`}>
        <div className="directory-list-heading"><span>{title}</span><span>{kind === 'organization' ? 'Stage' : 'Affiliation'}</span></div>
        <ul className="directory-records" aria-label={title} onKeyDown={event => {
          if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
          const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[data-record]'));
          const index = links.indexOf(document.activeElement as HTMLAnchorElement);
          if (index < 0) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length-1 : Math.max(0,Math.min(links.length-1,index+(event.key === 'ArrowDown' ? 1 : -1)));
          links[next]?.focus();
        }}>
          {visible.map((r,index) => <li key={r.id}>
            {group && (index === 0 || r[group] !== visible[index-1][group]) && <h3 className="directory-group">{r[group]}</h3>}
            <Link data-record href={href({selected:r.id})} scroll={false} aria-current={selected === r.id ? 'true' : undefined} className="directory-record">
              <span className="directory-avatar">{r.name.split(' ').slice(0,2).map(w => w[0]).join('')}</span>
              <span className="directory-identity"><strong>{r.name}</strong><span>{r.context}</span><small>{kind === 'organization' ? r.location || r.category : r.category} · Ref {recordReference(r.id)}</small></span>
              <span className="directory-stage">{kind === 'organization' ? <StatusBadge value={r.status}/> : <Icon name="chevron" size={15}/>}</span>
            </Link>
          </li>)}
        </ul>
        {!total && <div className="directory-empty"><Icon name="search" size={24}/><h2>{(query || status) ? 'No matching records' : `No ${title.toLowerCase()} yet`}</h2><p>{(query || status) ? 'Try a different name, affiliation or reference.' : 'Add a record to start a relationship workspace.'}</p>{(query || status) && <button onClick={() => {setQuery('');navigate({q:'',status:'',page:'1'});}}>Clear filters</button>}</div>}
        {total > 0 && <div className="directory-pagination"><span>{(page-1)*10+1}–{Math.min(page*10,total)} of {total}</span><button aria-label="Previous page" disabled={page === 1} onClick={() => navigate({page:String(page-1)})}>←</button><span>{page} / {pages}</span><button aria-label="Next page" disabled={page === pages} onClick={() => navigate({page:String(page+1)})}>→</button></div>}
      </section>
      <section className="relationship-selection" aria-label="Selected record">
        {selected ? <><Link className="return-results" href={href({selected:''})} scroll={false}><Icon name="chevron" size={13}/> Back to results</Link>{!rows.some(r => r.id === selected) ? <p className="selection-notice">This record is outside the current filters. Your results remain on the left; this record may be on another page.</p> : null}{children}</> : <div className="directory-welcome"><span><Icon name={title.toLowerCase()} size={30}/></span><h2>Keep the relationship in view</h2><p>Select a record to see its activity, people and next steps. Your place in the list stays here.</p><small>Use ↑ ↓ to move through records, then Enter to open.</small></div>}
      </section>
    </div>
  </div>;
}
