"use client";
import { useActionState } from "react";
import Link from "next/link";
import { FormField } from "./fields";
import type { FieldDefinition } from "../lib/crm-fields";
import type { FormState } from "../lib/crm-validation";
export function CrmForm({ action, fields, values = {}, cancelHref, children }: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  fields: FieldDefinition[]; values?: Record<string, string | number | string[] | null>; cancelHref: string; children?: React.ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const displayed = { ...values, ...state.values };
  return <form action={submit} className="card mt-6 max-w-3xl space-y-5 p-6">
    {values.id && <input type="hidden" name="id" value={values.id}/>}
    {state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.message}</p>}
    <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2" key={JSON.stringify(state.values)}>
      {fields.map(field => <FormField key={field.name} field={field} value={displayed[field.name]} error={state.errors?.[field.name]}/>)}
    </fieldset>
    {children}<div className="flex gap-4 items-center"><button disabled={pending} className="rounded-lg bg-purple px-5 py-3 font-semibold text-white">{pending ? "Saving…" : "Save record"}</button><Link href={cancelHref}>Cancel</Link></div>
  </form>;
}
