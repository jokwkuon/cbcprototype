import { validId } from './crm-validation.ts';
export type HistorySection = 'activities' | 'open' | 'completed';
export const HISTORY_PAGE_SIZE = 25;
export type HistoryCursor = { value: string | null; id: string };
export function historyCursor(raw?: string | null): HistoryCursor | null {
  if (!raw) return null;
  let cursor: HistoryCursor;
  try { cursor = JSON.parse(raw); } catch { throw new Error('Invalid history cursor.'); }
  if (!cursor || !validId(cursor.id) || (cursor.value !== null &&
    (typeof cursor.value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))?$/.test(cursor.value) || !Number.isFinite(Date.parse(cursor.value))))) throw new Error('Invalid history cursor.');
  return cursor;
}
export function historyAfter(section: HistorySection, cursor: HistoryCursor) {
  const {value,id} = cursor;
  if (section === 'activities') {
    if (!value || !value.includes('T')) throw new Error('Invalid timeline cursor.');
    return `occurred_at.lt.${value},and(occurred_at.eq.${value},id.gt.${id})`;
  }
  if (value === null) return `and(due_date.is.null,id.gt.${id})`;
  if (value.includes('T')) throw new Error('Invalid task cursor.');
  return `due_date.gt.${value},and(due_date.eq.${value},id.gt.${id}),due_date.is.null`;
}
