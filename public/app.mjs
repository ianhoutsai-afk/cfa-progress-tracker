import {CloudStore} from './sync.mjs';
import {TOPICS,MODULES} from '../lib/catalog.mjs';
import {dayKey,validateState,backupState,stats} from '../lib/domain.mjs';
import {overview,modules,history,settings} from './views.mjs';
import {esc,hours} from './ui.mjs';

const view=document.querySelector('#view'),dialog=document.querySelector('#dialog');
const filters={topic:'all',status:'all',query:''};
let route='overview',lastState=null,lastRecoveries='',toastTimer;
const store=new CloudStore({onChange:refresh});
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},3500);}
function refresh(){
 const labels={loading:'正在連接…',saved:store.mode==='local-preview'?'本機預覽已保存':'已同步',pending:'等待同步…',saving:'正在保存…',offline:'同步失敗 · 備份已保留',conflict:'其他裝置已有更新'};
 document.querySelector('#sync-status').textContent=labels[store.status]||'尚未同步';
 document.querySelector('#sync-status').dataset.status=store.status;
 document.querySelector('#retry-sync').hidden=!['offline','pending'].includes(store.status);
 const notice=document.querySelector('#notice');
 const recoveryItems=store.listRecoveries(),recovered=recoveryItems.length,recoverySignature=recoveryItems.map(v=>v.key).join('|');
 notice.hidden=store.status!=='conflict'&&!store.backupFailed&&!recovered&&store.mode!=='local-preview';
 notice.innerHTML=store.status==='conflict'?'其他裝置已有更新。目前修改已保留；請先<button class="link-button" data-action="export">匯出備份</button>，再<button class="link-button" data-action="reload">載入雲端紀錄</button>。':store.backupFailed?'瀏覽器備份空間不足。請保持網路連線，確認顯示「已同步」，並匯出備份。':recovered?`另有 ${recovered} 份分頁待同步備份。<button class="link-button" data-action="settings">查看並還原備份</button>`:'本機測試空間 · 這裡的操作不會影響正式網站。';
 if(store.state&&(store.state!==lastState||(route==='settings'&&recoverySignature!==lastRecoveries))){lastState=store.state;lastRecoveries=recoverySignature;render();}
}
function render(){
 if(!store.state)return;
 const el=document.activeElement,searchFocus=el?.id==='module-search',caret=el?.selectionStart;
 view.innerHTML=route==='overview'?overview(store.state):route==='modules'?modules(store.state,filters):route==='history'?history(store.state):settings(store.state,store.listRecoveries());
 for(const a of document.querySelectorAll('[data-nav]')){if(a.dataset.nav===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
 if(searchFocus){const input=document.querySelector('#module-search');input?.focus();input?.setSelectionRange(caret,caret);}
 document.title=({overview:'學習總覽',modules:'學習模組',history:'學習紀錄',settings:'設定'}[route])+' · CFA Progress';
}
function navigate(){route=['overview','modules','history','settings'].includes(location.hash.slice(1))?location.hash.slice(1):'overview';render();}
function modal(content){document.querySelector('#dialog-body').innerHTML=content;dialog.showModal();}
const dialogHead=(title)=>`<div class="dialog-heading"><h2>${title}</h2><button class="icon-button" type="button" data-action="close-dialog" aria-label="關閉視窗">×</button></div>`;
function logDialog(){modal(`${dialogHead('記錄學習')}<p class="muted">記下今天投入的時間。</p><form id="log-form"><div class="form-grid"><label>學習日期<input name="date" type="date" required max="${dayKey()}" min="2000-01-01" value="${dayKey()}"></label><label>學習時間 <span class="muted">（分鐘）</span><input name="minutes" type="number" min="1" max="1440" step="1" required placeholder="例如 60" autofocus></label></div><label>科目<select name="topic">${TOPICS.map(t=>`<option value="${t.id}" ${filters.topic===t.id?'selected':''}>${t.name}</option>`).join('')}</select></label><label>學習內容 <span class="muted">（選填）</span><textarea name="note" rows="3" maxlength="1000" placeholder="例如：完成 LM1，複習報酬率計算"></textarea></label><p class="form-error" role="alert" id="form-error"></p><div class="dialog-actions"><button class="secondary" type="button" data-action="close-dialog">取消</button><button class="primary" type="submit">儲存紀錄</button></div></form>`);}
function confirmDialog(title,text,onConfirm,label='確認'){
 modal(`${dialogHead(title)}<p>${text}</p><div class="dialog-actions"><button class="secondary" data-action="close-dialog">取消</button><button class="primary" id="confirm-action">${label}</button></div>`);
 document.querySelector('#confirm-action').onclick=async()=>{dialog.close();try{await onConfirm();}catch(e){toast(e.message);}};
}
function exportBackup(state=store.state){const value={format:'cfa-progress-backup',exportedAt:new Date().toISOString(),state};const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`cfa-progress-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出目前紀錄');}
async function importBackup(){
 const picker=document.createElement('input');picker.type='file';picker.accept='.json,application/json';
 picker.onchange=async()=>{try{const file=picker.files?.[0];if(!file)return;if(file.size>5000000)throw Error('備份檔案過大');const s=backupState(JSON.parse(await file.text())),a=stats(s);confirmDialog('匯入備份',`這份備份包含 ${a.done} 個已完成模組、${s.logs.length} 筆學習紀錄（${hours(a.totalMinutes)} 小時）。確認後會取代目前紀錄；建議先匯出目前備份。`,()=>{store.update(next=>{for(const key of Object.keys(next))delete next[key];Object.assign(next,s);});toast('備份已匯入，正在同步');},'確認匯入');}catch(e){toast(e.message||'無法讀取備份');}};
 picker.click();
}
document.addEventListener('click',async e=>{
 const target=e.target.closest('button,[data-action]');if(!target)return;
 try{
  const action=target.dataset.action;
  if(action==='close-dialog'){dialog.close();return;}
  if(!store.state)return;
  if(action==='log')logDialog();
  if(action==='settings'){if(location.hash==='#settings')render();else location.hash='settings';}
  if(target.dataset.recoveryExport){const item=store.listRecoveries().find(v=>v.key===target.dataset.recoveryExport);if(!item)throw Error('備份已更新，請重新載入設定');exportBackup(item.state);}
  if(target.dataset.recoveryRestore)confirmDialog('還原分頁備份','這份備份會取代目前紀錄。建議先匯出目前紀錄，確認後再還原。',()=>{store.restoreRecovery(target.dataset.recoveryRestore);toast('備份已還原，正在同步');},'確認還原');
  if(action==='export')exportBackup();
  if(action==='import')await importBackup();
  if(action==='reload')confirmDialog('重新載入雲端',store.pending?'目前尚未同步的修改將被雲端紀錄取代。請先匯出備份，避免遺失。':'重新讀取雲端保存的最新紀錄。',async()=>{await store.load({discardPending:true});toast('已載入雲端紀錄');},'重新載入');
  if(target.dataset.topic){filters.topic=target.dataset.topic;filters.status='all';filters.query='';if(location.hash==='#modules')render();else location.hash='modules';window.scrollTo(0,0);}
  if(target.dataset.start){const m=MODULES.find(m=>m.id===target.dataset.start);if(!m)return;if(!store.state.modules[m.id]||store.state.modules[m.id]==='todo')store.update(s=>{s.modules[m.id]='learning';});filters.topic=m.topic;filters.status='all';filters.query='';location.hash='modules';}
  if(target.dataset.delete){const id=target.dataset.delete;confirmDialog('刪除學習紀錄','確認移除這筆學習時數？模組進度不會受影響。',()=>{store.update(s=>{s.logs=s.logs.filter(l=>l.id!==id);});toast('已刪除紀錄');},'刪除紀錄');}
 }catch(error){toast(error.message);}
});
document.addEventListener('change',e=>{try{if(e.target.dataset.module)store.update(s=>{s.modules[e.target.dataset.module]=e.target.value;});if(e.target.id==='topic-filter'){filters.topic=e.target.value;render();}if(e.target.id==='status-filter'){filters.status=e.target.value;render();}}catch(error){toast(error.message);render();}});
document.addEventListener('input',e=>{if(e.target.id==='module-search'){filters.query=e.target.value;render();}});
document.addEventListener('submit',e=>{
 if(!['log-form','settings-form'].includes(e.target.id))return;e.preventDefault();const values=Object.fromEntries(new FormData(e.target));
 try{
  if(e.target.id==='log-form'){store.update(s=>{s.logs.push({id:crypto.randomUUID(),date:values.date,minutes:Number(values.minutes),topic:values.topic,note:values.note.trim()});});dialog.close();toast('已記錄學習時間');}
  else {store.update(s=>{s.settings={examDate:values.examDate,weeklyHours:Number(values.weeklyHours)};});toast('設定已更新');}
 }catch(error){const field=document.querySelector('#form-error');if(field)field.textContent=error.message;else toast(error.message);}
});
document.querySelector('#retry-sync').onclick=()=>void store.save();
window.addEventListener('hashchange',navigate);
window.addEventListener('online',()=>void store.save());
window.addEventListener('beforeunload',e=>{if(store.pending){e.preventDefault();e.returnValue='';}});
document.querySelector('#today').textContent=new Intl.DateTimeFormat('zh-Hant',{timeZone:'Asia/Shanghai',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());
navigate();
async function boot(){try{await store.load();}catch(error){view.innerHTML=`<div class="empty"><h1>暫時無法載入</h1><p>${esc(error.message)}</p><button class="primary" id="reload-page">重試</button><p><a href="/signin-with-chatgpt?return_to=%2F" target="_top">登入帳戶</a></p></div>`;document.querySelector('#reload-page').onclick=boot;}}
void boot();
