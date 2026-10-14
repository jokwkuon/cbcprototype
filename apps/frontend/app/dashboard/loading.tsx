import { Shell } from "../../components/shell";
export default function Loading(){return <Shell><div className="animate-pulse space-y-5"><div className="h-9 w-72 rounded bg-slate-200"/><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4].map(x=><div key={x} className="card h-28 bg-slate-100"/> )}</div><div className="card h-72 bg-slate-100"/></div></Shell>}
