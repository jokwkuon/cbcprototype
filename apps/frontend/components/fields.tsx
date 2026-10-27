import type { FieldDefinition } from "../lib/crm-fields";
export function FormField({ field, value, error }: { field: FieldDefinition; value?: string | number | null; error?: string }) {
  const id = `field-${field.name}`;
  const shared = { id, name: field.name, required: field.required, defaultValue: value ?? "", "aria-invalid": !!error, "aria-describedby": `${id}-hint ${id}-error` };
  return <div><label className="block text-sm font-semibold" htmlFor={id}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
    {field.type === "textarea" ? <textarea {...shared} rows={4}/> : field.type === "select" ? <select {...shared}>{field.options?.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select> : <input {...shared} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined}/>}
    <p id={`${id}-hint`} className="text-xs text-slate-500">{field.hint}</p><p id={`${id}-error`} className="text-sm text-red-700">{error}</p>
  </div>;
}
export function DetailFields({ fields }: { fields: [string, React.ReactNode][] }) {
  return <dl className="grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value ?? "Not specified"}</dd></div>)}</dl>;
}
export function PendingFields({ labels }: { labels: string[] }) {
  return <section className="card mt-5 p-6"><h2 className="mb-4 font-bold">Related information</h2><DetailFields fields={labels.map(label => [label, "Definition pending"])} /></section>;
}
