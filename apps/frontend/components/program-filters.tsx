"use client";
import { useState } from "react";
export function ProgramFilters({q, program, cohort, programs, cohorts}: {
  q: string; program: string; cohort: string;
  programs: {id:string; name:string}[];
  cohorts: {id:string; label:string; program_id:string}[];
}) {
  const [selectedProgram, setProgram] = useState(program);
  const [selectedCohort, setCohort] = useState(cohort);
  return <form className="mb-4 flex flex-wrap gap-3">
    <input name="q" defaultValue={q} aria-label="Search recipients" placeholder="Search recipients and outcomes…" className="max-w-xs"/>
    <select name="program" value={selectedProgram} aria-label="Program filter" className="max-w-xs" onChange={event => {
      const next = event.target.value;
      setProgram(next);
      if (!cohorts.some(c => c.id === selectedCohort && (!next || c.program_id === next))) setCohort("");
    }}><option value="">All programs</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <select name="cohort" value={selectedCohort} onChange={event => setCohort(event.target.value)} aria-label="Cohort filter" className="max-w-xs"><option value="">All cohorts</option>{cohorts.filter(c => !selectedProgram || c.program_id === selectedProgram).map(c => <option key={c.id} value={c.id}>{c.label} · {programs.find(p => p.id === c.program_id)?.name}</option>)}</select>
    <button>Search</button>
  </form>;
}
