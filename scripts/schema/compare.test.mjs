import {test} from 'node:test';import assert from 'node:assert/strict';import {compareCatalogs} from './compare.mjs';
test('REQ-008 schema normalization ignores JSON key order, preserves structural differences',()=>{
 assert.deepEqual(compareCatalogs({a:{rls:true,acl:['authenticated=r']}},{a:{acl:['authenticated=r'],rls:true}}),[]);
 assert.deepEqual(compareCatalogs({a:{rls:true}},{a:{rls:false},b:{}}),[{key:'a',kind:'changed'},{key:'b',kind:'unexpected'}]);
 assert.deepEqual(compareCatalogs({policy:'required'},{}),[{key:'policy',kind:'missing'}]);
});
