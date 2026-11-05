import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {emptyState} from '../lib/domain.mjs';
import {handleApi} from '../worker/api.mjs';
function setup(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../drizzle/0000_progress.sql',import.meta.url),'utf8'));return {DB:{prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null};}};}}};}
const req=(method='GET',payload=null,user='owner')=>new Request('https://test.local/api/state',{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),origin:'https://test.local','content-type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{})});
test('anonymous cannot read or write',async()=>{assert.equal((await handleApi(req('GET',null,null),{})).status,401);assert.equal((await handleApi(req('PUT',{},null),{})).status,401);});
test('real database isolates owners and rejects stale writes',async()=>{const env=setup(),state=emptyState();state.modules['quant-1']='done';assert.equal((await handleApi(req('PUT',{owner:'owner',revision:0,state}),env)).status,200);assert.equal((await handleApi(req('PUT',{owner:'owner',revision:0,state}),env)).status,409);const a=await (await handleApi(req(),env)).json();assert.equal(a.state.modules['quant-1'],'done');const b=await (await handleApi(req('GET',null,'other'),env)).json();assert.deepEqual(b.state.modules,{});assert.equal((await handleApi(req('PUT',{owner:'owner',revision:1,state},'other'),env)).status,403);});
test('bad origin and malformed state never replace saved data',async()=>{const env=setup(),r=req('PUT',{owner:'owner',revision:0,state:emptyState()});r.headers.set('origin','https://evil.local');assert.equal((await handleApi(r,env)).status,403);assert.equal((await handleApi(req('PUT',{owner:'owner',revision:0,state:{}}),env)).status,400);assert.equal((await (await handleApi(req(),env)).json()).revision,0);});
