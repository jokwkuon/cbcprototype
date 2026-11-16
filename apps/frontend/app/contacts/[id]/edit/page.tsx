import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { contactFormData } from "../../../../lib/crm-form-data";
import { updateContact } from "../../../actions";
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await contactFormData(id);
  return <Shell><h1 className="text-3xl font-bold">Edit contact</h1><CrmForm action={updateContact} {...data} cancelHref="/contacts"/></Shell>;
}
