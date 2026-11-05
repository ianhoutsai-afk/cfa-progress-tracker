import {emptyState,validateState} from '../lib/domain.mjs';

// IndexedDB transactions serialize writes across tabs. No network or user identity.
export class LocalStore{
 constructor({onChange=()=>{},indexedDB=globalThis.indexedDB}={}){this.onChange=onChange;this.indexedDB=indexedDB;this.mode='browser-local';this.status='loading';this.state=null;this.revision=0;this.pending=0;this.saving=false;this.backupFailed=false;this.queue=Promise.resolve();this.generation=0;}
 notify(){this.onChange(this);}
 listRecoveries(){return [];}
 async database(){
  if(!this.openPromise)this.openPromise=new Promise((resolve,reject)=>{
   if(!this.indexedDB){reject(Error('瀏覽器不支援本機保存，請使用其他瀏覽器'));return;}
   const r=this.indexedDB.open('cfa-progress-browser-v1',1);
   r.onupgradeneeded=()=>r.result.createObjectStore('progress');
   r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};
   r.onerror=()=>reject(Error('無法開啟瀏覽器保存空間，請檢查瀏覽器的網站資料設定'));
   r.onblocked=()=>reject(Error('請關閉其他舊版網站分頁後重試'));
  });return this.openPromise;
 }
 async load(){
  const generation=this.generation;await this.queue;const db=await this.database();
  const value=await new Promise((resolve,reject)=>{const r=db.transaction('progress','readonly').objectStore('progress').get('main');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('無法讀取瀏覽器紀錄'));});
  if(this.generation!==generation)throw Error('載入期間已有新修改，已保留；請等保存完成後再試');
  if(value&&(!Number.isSafeInteger(value.revision)||value.revision<1||validateState(value.state)))throw Error('本機紀錄格式不正確；原始資料已保留，請勿清除瀏覽器網站資料');
  this.state=value?structuredClone(value.state):emptyState();this.revision=value?.revision??0;this.status='saved';this.notify();
 }
 update(mutator){
  this.generation++;this.pending++;const task=this.queue.then(()=>this.commit(mutator));this.queue=task.catch(()=>{});return task;
 }
 async commit(mutator){
  this.saving=true;
  try{
   if(!this.state)throw Error('尚未載入紀錄');
   if(this.status==='conflict')throw Error('另一分頁已更新，請先重新載入紀錄');
   const next=structuredClone(this.state);mutator(next);const error=validateState(next);if(error)throw Error(error);
   if(JSON.stringify(next)===JSON.stringify(this.state))return;
   this.status='saving';this.notify();const db=await this.database();let conflict=false;
   await new Promise((resolve,reject)=>{
    const tx=db.transaction('progress','readwrite'),table=tx.objectStore('progress'),read=table.get('main');
    read.onsuccess=()=>{if((read.result?.revision??0)!==this.revision){conflict=true;tx.abort();return;}table.put({revision:this.revision+1,state:next},'main');};
    tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(Error(conflict?'另一分頁已更新，請重新載入最新紀錄後再修改':'無法保存，原有紀錄未變更。請檢查瀏覽器保存空間。'));
   });
   this.state=next;this.revision++;this.status='saved';
  }catch(error){if(error.message.startsWith('另一分頁'))this.status='conflict';else if(this.status==='saving')this.status='error';throw error;}
  finally{this.pending--;this.saving=false;this.notify();}
 }
 async save(){await this.queue;}
}
