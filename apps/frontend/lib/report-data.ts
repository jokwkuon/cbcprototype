import type { crmContext } from "./crm-context";
import { businessToday, type Activity } from "./activity-data";
import { contributions, givingSummary, type Receipt } from "./giving-data";
import { readAll } from "./read-all";
import { cents, sumMoney, reportYear, ReportFilterError } from "./report-validation";
export const reportCategories = [
  {slug:"executive", title:"Executive Performance", topics:"Funding, sponsorship, membership and program KPIs"},
  {slug:"sponsor", title:"Sponsor Relationship", topics:"Pipeline, renewals, interactions and opportunities"},
  {slug:"scholarship", title:"Scholarship Impact", topics:"Awards, graduation, employment and alumni engagement"},
  {slug:"mentorship", title:"Mentorship", topics:"Pairings, check-ins, satisfaction and at-risk relationships"},
  {slug:"membership", title:"Membership", topics:"Growth, retention, engagement and renewal risk"},
  {slug:"financial", title:"Financial Performance", topics:"Received cash, commitments, giving history and pending event ROI"},
];
type Client = Awaited<ReturnType<typeof crmContext>>["client"];
export async function financialReport(client: Client, filters: {year?:string|string[]; organization?:string|string[]}) {
  const today = await businessToday(client), year = reportYear(filters.year, today);
  const {organizations,organization}=await reportScope(client,filters.organization);
  const scope = organization ? {organization} : undefined;
  const [summary, records, receipts] = await Promise.all([
    givingSummary(client, year, scope), contributions(client, scope, true),
    readAll<Receipt>((from,to)=>client.from("giving_receipts").select("*",{count:"exact"}).order("id").range(from,to)),
  ]);
  const byId = new Map(records.map(c=>[c.id,c]));
  const eligible = receipts.filter(r=>byId.has(r.contribution_id) && !r.is_void && r.received_on<=summary.as_of);
  const start = `${String(year).padStart(4,"0")}-01-01`;
  const periodReceipts = eligible.filter(r=>r.received_on>=start && r.received_on<=summary.period_end);
  const priorStart = `${String(year-1).padStart(4,"0")}-01-01`;
  const prior = eligible.filter(r=>r.received_on>=priorStart && r.received_on<=summary.prior_period_end);
  const matches = (amount:string, values:string[])=>cents(amount)===sumMoney(values);
  if (summary.year !== year || summary.as_of !== today ||
      !matches(summary.annual_cash,periodReceipts.map(r=>r.amount)) || !matches(summary.prior_cash,prior.map(r=>r.amount)) ||
      !matches(summary.lifetime_cash,eligible.map(r=>r.amount)) || !matches(summary.pledged,records.map(c=>c.pledged)) ||
      !matches(summary.outstanding,records.map(c=>c.outstanding)) ||
      !matches(summary.in_kind_declared,records.filter(c=>c.contribution_type==="In-Kind"&&c.funding_status!=="Cancelled").map(c=>c.amount))) {
    throw new Error("Financial summary and underlying records do not reconcile. Reload to retry.");
  }
  // Verify each contribution's balance against receipts too, including overpayment/cancellation.
  for (const c of records) if (!matches(c.cash_received,eligible.filter(r=>r.contribution_id===c.id).map(r=>r.amount))) throw new Error("Contribution receipts changed while loading.");
  return {summary,records,periodReceipts,byId,organizations,organization,year};
}

export async function reportScope(client:Client,rawOrganization?:string|string[]) {
  const organizations = await readAll<{id:string;name:string}>((from,to) => client.from("organizations").select("id,name",{count:"exact"}).order("id").range(from,to));
  const organization = rawOrganization ?? "";
  if (typeof organization !== "string" || (organization && !organizations.some(o=>o.id===organization))) throw new ReportFilterError("Choose an available organization, or All organizations.");
  return {organizations,organization};
}
export async function sponsorReport(client:Client,rawOrganization?:string|string[]) {
  const scope=await reportScope(client,rawOrganization);
  if(!scope.organization)return {...scope,records:[],activities:[],opportunities:[]};
  const [records,activities,opportunities]=await Promise.all([
    contributions(client,{organization:scope.organization},true),
    readAll<Activity>((from,to)=>client.from("activities").select("*",{count:"exact"}).eq("organization_id",scope.organization).order("occurred_at",{ascending:false}).order("id").range(from,to)),
    readAll<{id:string;name:string}>((from,to)=>client.from("opportunities").select("id,name",{count:"exact"}).eq("organization_id",scope.organization).order("id").range(from,to)),
  ]);
  return {...scope,records,activities,opportunities};
}
