// Restrict raw PostgREST filter syntax to literal text. Wildcards and punctuation
// become spaces so callers cannot inject filter clauses or accidental match-all patterns.
export function searchTerm(value: string) {
  return value.normalize('NFKC').replace(/[^\p{L}\p{N}@.'’\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
export function searchFilter(columns: string[], value: string) {
  const term = searchTerm(value);
  const clauses = term.split(' ').map(word => columns.map(column => `${column}.ilike.%${word}%`).join(','));
  return clauses.length === 1 ? clauses[0] : `and(${clauses.map(clause => `or(${clause})`).join(',')})`;
}
