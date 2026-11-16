import { notFound } from "next/navigation";
import { Shell } from "../../../../../components/shell";
import { CrmForm } from "../../../../../components/crm-form";
import { programFormData } from "../../../../../lib/program-data";
import { saveProgramRecord } from "../../../../../app/programs/actions";
export default async function ProgramForm({ params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params; const data = await programFormData("cohort", id); if (!data) notFound();
  return <Shell><h1 className="text-3xl font-bold">Edit cohort</h1><p className="mt-3">Provisional MVP workflow pending CBC approval. Unknown values may stay blank.</p><CrmForm action={saveProgramRecord.bind(null, "cohort", true)} {...data} cancelHref={"/programs/cohorts"}/></Shell>;
}
