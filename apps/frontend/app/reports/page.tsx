import Link from "next/link";
import { Shell } from "../../components/shell";
import { PageHeader, Card, Pill } from "../../components/ui";
import { crmContext } from "../../lib/crm-context";
import { reportCategories } from "../../lib/report-data";
export default async function Reports() {
  await crmContext();
  return <Shell><PageHeader title="Reports" subtitle="Verified local summaries and clearly marked pending report definitions."/>
    <div className="grid gap-5 md:grid-cols-2">{reportCategories.map(report=><Card key={report.slug}>
      <h2 className="mb-2 text-xl font-bold"><Link href={`/reports/${report.slug}`}>{report.title}</Link></h2>
      <p className="mb-3">{report.topics}</p><Pill tone={report.slug==="financial"?"primary":"warning"}>{report.slug==="financial"?"Financial summaries available":"Definition pending"}</Pill>
    </Card>)}</div><p className="mt-5">Read-only reports use existing access rules. Export format and unsupported calculations remain pending CBC approval.</p>
  </Shell>;
}
