import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { crmContext } from "../../../../lib/crm-context";
import { createOpportunity } from "../../actions";
export default async function NewOpportunity() {
  const { client, canWrite } = await crmContext(); if (!canWrite) throw new Error("Your role has read-only access.");
  const { data, error } = await client.from("organizations").select("id,name").order("name"); if (error) throw new Error("Unable to load organizations.");
  return <Shell><h1 className="text-3xl font-bold">Add opportunity reference</h1><p>A named pipeline reference with an optional manual estimate. Currency definition pending; this estimate is excluded from financial summaries.</p><CrmForm action={createOpportunity} fields={[{ name: "organization_id", label: "Organization", type: "select", required: true, options: [{ id: "", name: "Select organization" }, ...(data ?? [])] }, { name: "name", label: "Opportunity name", required: true }, { name: "estimated_amount", label: "Manual estimate", hint: "Optional; currency definition pending." }]} cancelHref="/interests"/></Shell>;
}
