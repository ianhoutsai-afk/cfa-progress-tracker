import {handleApi,json} from './api.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);
 try{
  if(url.pathname==='/api/state')return await handleApi(request,env);
  if(url.pathname.startsWith('/api/'))return json({error:'找不到此頁面'},404);
  if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2F',302);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const asset=ASSETS[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{'content-type':asset.type,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com; form-action 'self'"}});
 }catch{return json({error:'服務暫時無法使用，請稍後重試'},503);}
}};
