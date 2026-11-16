// Compare previously captured catalogs; no network or mutation capability.
import {readFileSync} from 'node:fs';
function stable(value){
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
 return value;
}
export function compareCatalogs(expected, actual) {
  return [...new Set([...Object.keys(expected),...Object.keys(actual)])].sort().flatMap(key =>
    JSON.stringify(stable(expected[key]))===JSON.stringify(stable(actual[key])) ? [] : [{key,kind:!(key in expected)?'unexpected':!(key in actual)?'missing':'changed'}]);
}
if(process.argv[1]?.endsWith('/compare.mjs')) {
 const [expected,actual]=process.argv.slice(2);
 if(!expected||!actual)throw new Error('Usage: node scripts/schema/compare.mjs expected.json actual.json');
 const differences=compareCatalogs(JSON.parse(readFileSync(expected)),JSON.parse(readFileSync(actual)));
 console.log(JSON.stringify({matches:!differences.length,differences},null,2));
 if(differences.length)process.exitCode=1;
}
