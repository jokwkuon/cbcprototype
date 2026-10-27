import { notFound } from "next/navigation";
import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { givingFormData } from "../../../../lib/giving-data";
import { updateContribution } from "../../actions";
export default async function EditGiving({params}:{params:Promise<{id:string}>}){const {id}=await params;const data=await givingFormData(id);if(!data) notFound();return <Shell><h1 className="text-3xl font-bold">Edit contribution</h1><CrmForm action={updateContribution} {...data} cancelHref={`/giving/${id}`}/></Shell>;}
