import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { interestFormData } from "../../../../lib/interest-data";
import { updateInterest } from "../../actions";
export default async function EditInterest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, data = await interestFormData(id);
  if (!data) notFound();
  return <Shell><h1 className="text-3xl font-bold">Edit interest</h1><p>Organization changes require clearing or replacing any contact/opportunity links that belong to the previous organization.</p><CrmForm action={updateInterest} {...data} cancelHref={`/interests/${id}`}/></Shell>;
}
