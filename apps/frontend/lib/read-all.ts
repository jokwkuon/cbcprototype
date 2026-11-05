export const MAX_REPORT_ROWS = 10_000;

// Read complete ordered datasets rather than silently accepting the API row cap.
export async function readAll<T extends {id: string | number}>(page: (from: number, to: number) => PromiseLike<{data: T[] | null; error: unknown; count: number | null}>) {
  const rows: T[] = [];
  let expected: number | null = null;
  do {
    const result = await page(rows.length, rows.length + 499);
    if (result.error || !result.data || result.count === null || (expected !== null && expected !== result.count)) throw new Error("Complete report records unavailable. Reload to retry.");
    if (result.count > MAX_REPORT_ROWS) throw new Error(`This report exceeds the ${MAX_REPORT_ROWS.toLocaleString("en-CA")} record limit. Narrow the filters and try again.`);
    expected = result.count;
    if (!result.data.length && rows.length < expected) throw new Error("Report records are incomplete.");
    rows.push(...result.data);
  } while (rows.length < expected);
  if (new Set(rows.map(row=>row.id)).size !== rows.length) throw new Error("Report records changed while paging.");
  if (rows.length !== expected) throw new Error("Report records changed while loading.");
  return rows;
}
