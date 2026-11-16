import Link from 'next/link';
import {Shell} from '../../components/shell';
import {PageHeader} from '../../components/ui';
import {Icon} from '../../components/icons';
import {crmContext} from '../../lib/crm-context';
import {reportCategories} from '../../lib/report-data';
export default async function Reports(){await crmContext();return <Shell><PageHeader title="Reports" subtitle="Understand the relationships behind your impact. Explore verified records, follow the evidence and share an export."/><div className="report-grid">{reportCategories.map((r,i)=><Link key={r.slug} href={`/reports/${r.slug}`} aria-label={r.title} className="card report-tile"><span className="report-icon"><Icon name={['dashboard','organizations','programs','mentorship','membership','giving'][i]} size={21}/></span><h2>{r.title}</h2><p>{r.topics}.</p><footer><span>Live records · Filters · CSV</span><Icon name="arrow" size={15}/></footer></Link>)}</div><div className="callout"><Icon name="reports" size={16}/><span>Reports respect your access permissions. Unsupported formulas are explicitly pending; unknown values are never replaced with estimates.</span></div></Shell>;}
