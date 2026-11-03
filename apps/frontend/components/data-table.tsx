import {ClientDataTable,type TableRow,type TableColumn} from './data-table-client';
import {displayValue} from '../lib/presentation';
export {StatusBadge} from './data-table-client';
export type {Cell,TableRow,TableColumn} from './data-table-client';
// Format once on the server: browser and Node Intl/ICU versions can differ.
// Keep original values separately for stable numeric/date sorting and time metadata.
export function DataTable(props:{columns:TableColumn[];rows:TableRow[];emptyMessage?:string;label?:string;searchable?:boolean;groupable?:boolean;filterable?:boolean;pageSize?:number;totals?:{label:string;value:string}}){
 const rows=props.rows.map(row=>({...row,cells:Object.fromEntries(Object.entries(row.cells).map(([key,cell])=>[key,{...cell,sortValue:cell.sortValue??cell.text??undefined,text:typeof cell.text==='string'?displayValue(cell.text):cell.text}]))}));
 return <ClientDataTable {...props} rows={rows}/>;
}
