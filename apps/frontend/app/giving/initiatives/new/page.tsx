import { Shell } from "../../../../components/shell";
import { CrmForm } from "../../../../components/crm-form";
import { financeContext,initiativeFields } from "../../../../lib/giving-data";
import { createInitiative } from "../../actions";
export default async function NewInitiative(){const {financialWriter}=await financeContext();if(!financialWriter) throw new Error("Admin or Finance access required.");return <Shell><h1 className="text-3xl font-bold">Add program/event reference</h1><p>Funding lookup only. Full program/event operations remain pending.</p><CrmForm action={createInitiative} fields={initiativeFields} cancelHref="/giving/new"/></Shell>;}
