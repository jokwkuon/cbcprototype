import Link from "next/link";
import { Shell } from "../../../components/shell";
import { CrmForm } from "../../../components/crm-form";
import { givingFormData } from "../../../lib/giving-data";
import { createContribution } from "../actions";
export default async function NewGiving(){const data=await givingFormData();return <Shell><h1 className="text-3xl font-bold">Add contribution</h1><p>Record a commitment first; add actual cash receipts afterward.</p><Link href="/giving/initiatives/new">Add program/event reference</Link><CrmForm action={createContribution} {...data!} cancelHref="/giving"/></Shell>;}
