import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..'),assets={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
async function collect(dir,prefix=''){for(const f of await readdir(dir,{withFileTypes:true})){const full=resolve(dir,f.name),path=prefix+'/'+f.name;if(f.isDirectory())await collect(full,path);else assets[path]={type:types[extname(full)]||'application/octet-stream',body:await readFile(full,'utf8')};}}
await collect(resolve(root,'public'));await collect(resolve(root,'lib'),'/lib');
let source='// Dependency-free Sites Worker; ASSETS embedded at build time.\n';
for(const file of ['lib/catalog.mjs','lib/domain.mjs','worker/api.mjs'])source+=(await readFile(resolve(root,file),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'')+'\n';
source+='const ASSETS = '+JSON.stringify(assets)+';\n';source+=(await readFile(resolve(root,'worker/index.mjs'),'utf8')).replace(/^import .*;\s*$/gm,'');
await mkdir(resolve(root,'dist/server'),{recursive:true});await mkdir(resolve(root,'dist/.openai'),{recursive:true});
await writeFile(resolve(root,'dist/server/index.js'),source);await copyFile(resolve(root,'.openai/hosting.json'),resolve(root,'dist/.openai/hosting.json'));
console.log(`Built ${Object.keys(assets).length} assets (${Math.round(source.length/1024)} KB).`);
