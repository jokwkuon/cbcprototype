import { Shell } from "../../../components/shell";
import { CrmForm } from "../../../components/crm-form";
import { organizationFormData } from "../../../lib/crm-form-data";
import { createOrganization } from "../../actions";
export default async function New() {
  const data = await organizationFormData();
  return <Shell><h1 className="text-3xl font-bold">Add organization</h1><CrmForm action={createOrganization} {...data} cancelHref="/organizations"><p className="text-sm text-slate-500">Create the organization, add a linked contact, then select its Primary Contact from Edit.</p></CrmForm></Shell>;
}
