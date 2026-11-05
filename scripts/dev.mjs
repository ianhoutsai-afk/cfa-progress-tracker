import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');execFileSync(process.execPath,[resolve(root,'scripts/build.mjs')],{stdio:'inherit'});mkdirSync(resolve(root,'outputs'),{recursive:true});
const file=resolve(root,'outputs/preview.sqlite'),fresh=!existsSync(file),sqlite=new DatabaseSync(file);if(fresh)sqlite.exec(readFileSync(resolve(root,'drizzle/0000_progress.sql'),'utf8'));
const DB={prepare(query){let args=[];return {bind(...values){args=values;return this;},async first(){return sqlite.prepare(query).get(...args)||null;}};}};
const worker=(await import(pathToFileURL(resolve(root,'dist/server/index.js')))).default;
const port=Number(process.env.PORT||4178),host='127.0.0.1';
createServer(async(req,res)=>{try{
 const origin=`http://${host}:${port}`,headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
 // Local loopback only; production never fabricates an authenticated identity.
 headers.set('oai-authenticated-user-id','local-preview-owner');
 const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>800000){res.writeHead(413);res.end('Too large');return;}chunks.push(c);}
 const request=new Request(origin+(req.url||'/'),{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
 const response=await worker.fetch(request,{DB,STORAGE_MODE:'local-preview'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}catch(error){res.writeHead(500);res.end('Preview error: '+error.message);}}).listen(port,host,()=>console.log(`Local: http://${host}:${port}`));
