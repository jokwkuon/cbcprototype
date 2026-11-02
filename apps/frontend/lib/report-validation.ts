// REQ-013/004: period selection and exact reconciliation, not new KPI formulas.
export class ReportFilterError extends Error {}
export function reportYear(value: string | string[] | undefined, today: string) {
  if (value === undefined || value === "") return Number(today.slice(0, 4));
  if (typeof value !== "string" || !/^\d{4}$/.test(value) || Number(value) < 2 || Number(value) > Number(today.slice(0, 4))) {
    throw new ReportFilterError("Choose a four-digit calendar year from 0002 through the current Calgary year.");
  }
  return Number(value);
}
export function cents(value: string): bigint {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) throw new Error("Invalid exact money value.");
  const negative = value.startsWith("-"), [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  return (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) * (negative ? -1n : 1n);
}
export function sumMoney(values: string[]) { return values.reduce((total, value) => total + cents(value), 0n); }
