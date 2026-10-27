import { Shell } from "../../../components/shell";
import { CrmForm } from "../../../components/crm-form";
import { contactFormData } from "../../../lib/crm-form-data";
import { createContact } from "../../actions";
export default async function New() {
  const data = await contactFormData();
  return <Shell><h1 className="text-3xl font-bold">Add contact</h1><CrmForm action={createContact} {...data} cancelHref="/contacts"/></Shell>;
}
