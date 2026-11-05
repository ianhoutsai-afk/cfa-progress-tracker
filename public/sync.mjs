import {validateState} from '../lib/domain.mjs';
export class CloudStore{
 constructor({fetcher=(...args)=>fetch(...args),storage=globalThis.localStorage,onChange=()=>{},clientId}={}){
  this.fetcher=fetcher;this.storage=storage;this.onChange=onChange;this.status='loading';this.state=null;this.owner=null;this.revision=0;this.pending=0;this.saving=false;this.backupFailed=false;this.generation=0;this.adopted=new Map();
  // Distinct journals even for duplicated tabs. Session pointer recovers reloads.
  this.clientId=clientId||globalThis.crypto.randomUUID();
  if(!clientId)try{this.previousClientId=globalThis.sessionStorage?.getItem('cfa-progress-tab');globalThis.sessionStorage?.setItem('cfa-progress-tab',this.clientId);}catch{}
 }
 notify(){this.onChange(this);}
 entry(raw){try{const c=JSON.parse(raw);return c?.owner===this.owner&&c.pending&&!validateState(c.state)&&Number.isSafeInteger(c.revision)&&c.revision>=0?c:null;}catch{return null;}}
 clearAdopted(){for(const [key,raw]of this.adopted)if(this.storage.getItem(key)===raw)this.storage.removeItem(key);this.adopted.clear();}
 cache(){try{
  const raw=JSON.stringify({owner:this.owner,revision:this.revision,state:this.state,pending:this.pending>0,updatedAt:Date.now()});
  if(this.pending)this.storage.setItem(this.pendingKey,raw);
  else{this.storage.setItem(this.key,raw);this.storage.removeItem(this.pendingKey);this.clearAdopted();}
  this.backupFailed=false;
 }catch{this.backupFailed=true;}}
 listRecoveries(){const items=[];if(!this.key)return items;try{for(let i=0;i<this.storage.length;i++){const key=this.storage.key(i);if(!key?.startsWith(this.key+':pending:')||key===this.pendingKey||this.adopted.has(key))continue;const raw=this.storage.getItem(key),c=this.entry(raw);if(c)items.push({key,raw,...c});}}catch{}return items.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));}
 restoreRecovery(key){const item=this.listRecoveries().find(v=>v.key===key);if(!item)throw Error('這份備份已更新，請重新載入設定頁面');this.update(s=>{for(const k of Object.keys(s))delete s[k];Object.assign(s,structuredClone(item.state));});this.adopted.set(key,item.raw);if(!this.pending){this.clearAdopted();this.notify();}}
 async load({discardPending=false}={}){
  if(this.saving)throw Error('正在保存，請稍候');clearTimeout(this.timer);const generation=this.generation;
  const r=await this.fetcher('/api/state');if(!r.ok)throw Error(r.status===401?'請先登入再重新載入':'無法載入雲端，請檢查網路後重試');
  const data=await r.json();if(validateState(data.state)||typeof data.owner!=='string'||!data.owner||!Number.isSafeInteger(data.revision)||data.revision<0)throw Error('雲端回應格式不正確');
  if(this.generation!==generation)throw Error('載入期間已有新修改，已保留；請等保存完成後再試');
  this.owner=data.owner;this.key='cfa-progress-v1:'+this.owner;this.pendingKey=this.key+':pending:'+this.clientId;this.mode=data.mode||'cloud';let cached=null;
  try{for(const key of [this.pendingKey,this.previousClientId?this.key+':pending:'+this.previousClientId:null,this.key].filter(Boolean)){const raw=this.storage.getItem(key),entry=this.entry(raw);if(entry){cached=entry;if(key!==this.pendingKey)this.adopted.set(key,raw);break;}}}catch{}
  const pending=!discardPending&&cached;
  this.state=structuredClone(pending?cached.state:data.state);this.revision=pending?cached.revision:data.revision;this.pending=pending?1:0;
  this.status=pending?(cached.revision===data.revision?'pending':'conflict'):'saved';this.cache();this.notify();
  if(this.status==='pending')this.timer=setTimeout(()=>void this.save(),400);
 }
 update(mutator){if(!this.state)throw Error('尚未載入紀錄');const next=structuredClone(this.state);mutator(next);const error=validateState(next);if(error)throw Error(error);if(JSON.stringify(next)===JSON.stringify(this.state))return;this.generation++;this.state=next;this.pending++;this.status=this.status==='conflict'?'conflict':'pending';this.cache();this.notify();clearTimeout(this.timer);this.timer=setTimeout(()=>void this.save(),500);}
 async save(){
  if(this.saving||!this.pending||this.status==='conflict'||!this.state)return;
  this.saving=true;this.status='saving';this.notify();
  try{while(this.pending){
   const count=this.pending,revision=this.revision;
   const r=await this.fetcher('/api/state',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({owner:this.owner,revision,state:this.state})});
   if(r.status===409){this.status='conflict';return;}
   if(!r.ok)throw Error('HTTP '+r.status);
   const result=await r.json();if(result.revision!==revision+1)throw Error('保存版本不正確');
   this.revision=result.revision;this.pending-=count;this.cache();
  }this.status='saved';}catch{this.status='offline';this.cache();}
  finally{this.saving=false;this.notify();}
 }
}
