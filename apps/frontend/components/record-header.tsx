import type {StatusDomain} from '../lib/status-tone';
import Link from 'next/link';
import {StatusBadge} from './data-table';
import {Icon} from './icons';
export function RecordHeader({name,subtitle,status,statusDomain='general',back,backLabel,editHref,editLabel,actions}:{name:string;subtitle?:string;status?:string;statusDomain?:StatusDomain;back:string;backLabel:string;editHref?:string;editLabel?:string;actions?:React.ReactNode}){return <><Link className="text-xs text-slate-500" href={back}>← {backLabel}</Link><div className="detail-hero"><span className="record-mark">{name.split(' ').slice(0,2).map(w=>w[0]).join('')}</span><div><h1>{name}</h1><div className="hero-meta">{status&&<StatusBadge domain={statusDomain} value={status}/ >}{subtitle&&<span>{subtitle}</span>}</div></div><div className="hero-actions">{actions}{editHref&&<Link className="button button-primary" href={editHref}><Icon name="documents" size={13}/>{editLabel||'Edit record'}</Link>}</div></div></>;}
