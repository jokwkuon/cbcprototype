export function localDate(value:string|null|undefined,includeTime=false){
 if(!value)return 'Not recorded';const d=new Date(value.length===10?`${value}T12:00:00Z`:value);if(!Number.isFinite(d.getTime()))return value;
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Edmonton',month:'short',day:'numeric',year:'numeric',...(includeTime?{hour:'numeric',minute:'2-digit',timeZoneName:'short'}as const:{})}).format(d);
}
export function displayValue(value:string){if(/^\d{4}-\d{2}-\d{2}(T[\d:.+-]+Z?)?$/.test(value))return localDate(value,value.includes('T'));return value;}
export function recordReference(id:string){return `${id.slice(0,4)}·${id.slice(-4)}`;}
