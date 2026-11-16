import { Shell } from "../../../components/shell";
import { CrmForm } from "../../../components/crm-form";
import { interestFormData } from "../../../lib/interest-data";
import { createInterest } from "../actions";
export default async function NewInterest({ searchParams }: { searchParams: Promise<{ organization?: string }> }) {
  const { organization } = await searchParams, data = await interestFormData(undefined, organization);
  return <Shell><h1 className="text-3xl font-bold">Add interest</h1><p className="mt-3">Ownership is inherited from the organization. Contact and opportunity links are optional and must belong to it. Strength is manual.</p><CrmForm action={createInterest} {...data!} cancelHref="/interests"/></Shell>;
}
