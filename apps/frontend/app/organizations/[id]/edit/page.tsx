import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { organizationFormData } from "../../../../lib/crm-form-data";
import { updateOrganization } from "../../../actions";
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await organizationFormData(id);
  return <Shell><h1 className="text-3xl font-bold">Edit organization</h1><CrmForm action={updateOrganization} {...data} cancelHref="/organizations"><p className="text-sm text-slate-500">Staff ownership is preserved on edit. Only Admin may change it.</p></CrmForm></Shell>;
}
