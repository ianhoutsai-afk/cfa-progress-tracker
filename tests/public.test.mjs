import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {CloudStore} from '../public/sync.mjs';
execFileSync(process.execPath,['scripts/build.mjs'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
const worker=(await import('../dist/server/index.js')).default;
test('anonymous visitors can open the app and module assets without sign-in',async()=>{
 for(const path of ['/','/app.mjs','/lib/catalog.mjs']){const r=await worker.fetch(new Request('https://test.local'+path),{});assert.equal(r.status,200);assert.equal(r.headers.get('location'),null);}
});
test('public interface does not expose anonymous access to cloud records',async()=>{
 for(const method of ['GET','PUT'])assert.equal((await worker.fetch(new Request('https://test.local/api/state',{method}),{})).status,401);
});
test('only explicit missing identity allows browser-local fallback',async()=>{
 const store=new CloudStore({storage:{},fetcher:async()=>new Response('{}',{status:401})});await assert.rejects(store.load(),e=>e.status===401);
 const broken=new CloudStore({storage:{},fetcher:async()=>new Response('{}',{status:503})});await assert.rejects(broken.load(),e=>e.status===503);
});
