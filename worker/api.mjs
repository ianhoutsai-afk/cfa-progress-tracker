import {emptyState,validateState} from '../lib/domain.mjs';
export function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});}
export async function handleApi(request,env){
 const user=request.headers.get('oai-authenticated-user-id');
 if(!user)return json({error:'請先登入你的帳戶'},401);
 if(!env.DB)return json({error:'雲端資料庫尚未連接'},503);
 if(request.method==='GET'){
  const row=await env.DB.prepare('SELECT revision, state_json, updated_at FROM progress_state WHERE user_id = ?').bind(user).first();
  return json({owner:user,revision:row?.revision??0,state:row?JSON.parse(row.state_json):emptyState(),updatedAt:row?.updated_at??null,mode:env.STORAGE_MODE||'cloud'});
 }
 if(request.method!=='PUT')return json({error:'不支援的操作'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'請在網站內保存'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'需要 JSON 資料'},415);
 const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>750000)return json({error:'資料過大'},413);
 let payload;try{payload=JSON.parse(raw);}catch{return json({error:'資料格式不正確'},400);}
 if(payload?.owner!==user)return json({error:'登入帳戶已變更，請重新載入'},403);
 const error=validateState(payload?.state);
 if(error||!Number.isSafeInteger(payload?.revision)||payload.revision<0)return json({error:error||'資料版本不正確'},400);
 const now=new Date().toISOString(),value=JSON.stringify(payload.state);
 const row=payload.revision===0
  ?await env.DB.prepare('INSERT INTO progress_state (user_id, revision, state_json, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(user_id) DO NOTHING RETURNING revision').bind(user,value,now).first()
  :await env.DB.prepare('UPDATE progress_state SET state_json = ?, updated_at = ?, revision = revision + 1 WHERE user_id = ? AND revision = ? RETURNING revision').bind(value,now,user,payload.revision).first();
 if(!row)return json({error:'其他裝置已更新。請先匯出目前備份，再載入雲端紀錄。'},409);
 return json({revision:row.revision,updatedAt:now});
}
