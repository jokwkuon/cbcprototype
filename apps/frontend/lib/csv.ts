// Quote all cells and neutralize spreadsheet formulas, including leading whitespace.
export function csvCell(value:unknown){let s=value===null||value===undefined?'':String(value);if(/^[\s]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function csv(headers:string[],rows:unknown[][]){return [headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';}
