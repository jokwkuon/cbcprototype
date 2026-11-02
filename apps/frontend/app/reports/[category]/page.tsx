import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Shell } from "../../../components/shell";
import { PageHeader } from "../../../components/ui";
import { OperationalReport } from "../../../components/operational-report";
import type { ReportFilters } from "../../../lib/operational-report";
import { SponsorReport } from "../../../components/sponsor-report";
import { FinancialReport, ReportLoading } from "../../../components/financial-report";
import { crmContext } from "../../../lib/crm-context";
import { reportCategories } from "../../../lib/report-data";
export default async function Report({params,searchParams}:{params:Promise<{category:string}>;searchParams:Promise<ReportFilters & {year?:string|string[]}>}) {
  const {category}=await params, filters=await searchParams;
  const report=reportCategories.find(report=>report.slug===category);if(!report)notFound();
  const {client}=await crmContext();
  return <Shell><Link href="/reports">← All reports</Link><PageHeader title={report.title} subtitle="Read-only board-demo report. Existing role restrictions and provisional business definitions apply."/>
    {category==="financial"?<Suspense key={JSON.stringify(filters)} fallback={<ReportLoading/>}><FinancialReport client={client} filters={filters}/></Suspense>:category==="sponsor"?<Suspense key={JSON.stringify(filters)} fallback={<ReportLoading/>}><SponsorReport client={client} organization={filters.organization}/></Suspense>:<Suspense key={JSON.stringify(filters)} fallback={<ReportLoading/>}><OperationalReport client={client} category={category} filters={filters}/></Suspense>}
  </Shell>;
}
