import type {ReactNode} from 'react';
import {Icon} from './icons';
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={`card p-5 ${className}`}>{children}</section>;}
export function Pill({children,tone='neutral'}:{children:ReactNode;tone?:'success'|'warning'|'danger'|'primary'|'neutral'}){return <span className={`pill pill-${tone}`}>{children}</span>;}
export function PageHeader({title,subtitle,action}:{title:string;subtitle?:string;action?:ReactNode}){return <div className="page-header"><div><div className="eyebrow">Relationship &amp; impact</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action&&<div className="page-actions">{action}</div>}</div>;}
export function Button({children,variant='primary',...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'}){return <button {...props} className={`button button-${variant} ${props.className||''}`}>{children}</button>;}
export function EmptyState({title,description}:{title:string;description:string}){return <div className="empty-state"><span className="empty-icon"><Icon name="documents"/></span><h3>{title}</h3><p>{description}</p></div>;}
