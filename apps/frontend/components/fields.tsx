import { displayValue } from "../lib/presentation";
import type { FieldDefinition } from "../lib/crm-fields";
export function FormField({ field, value, error, onChange }: { field: FieldDefinition; value?: string | number | string[] | null; error?: string; onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> }) {
  const id = `field-${field.name}`;
  const shared = { "aria-label": field.label, onChange, id, name: field.name, required: field.required, defaultValue: value ?? "", "aria-invalid": !!error, "aria-describedby": `${id}-hint ${id}-error` };
  return <div><label className="block text-sm font-semibold" htmlFor={id}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
    {field.type === "textarea" ? <textarea {...shared} rows={4}/> : (field.type === "select" || field.type === "multiselect") ? <select {...shared} multiple={field.type === "multiselect"}>{field.options?.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select> : <input {...shared} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined}/>}
    <p id={`${id}-hint`} className="field-help">{field.hint}</p><p id={`${id}-error`} className="form-error">{error}</p>
  </div>;
}
export function DetailFields({ fields }: { fields: [string, React.ReactNode][] }) {
  return <dl className="grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{typeof value === "string" ? displayValue(value) : value ?? "Not specified"}</dd></div>)}</dl>;
}
export function PendingFields({ labels }: { labels: string[] }) {
  return <section className="card mt-5 p-6"><h2 className="mb-4 font-bold">Related information</h2><DetailFields fields={labels.map(label => [label, "Definition pending"])} /></section>;
}
