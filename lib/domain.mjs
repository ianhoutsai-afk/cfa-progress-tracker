import {MODULES,TOPICS} from './catalog.mjs';
export const STATUSES={todo:'未開始',learning:'學習中',done:'已完成'};
export function dayKey(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function addDays(date,n){return new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function monday(date){return addDays(date,-((new Date(date+'T00:00:00Z').getUTCDay()+6)%7));}
export function validDate(v){return typeof v==='string'&&/^20\d\d-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
export function emptyState(){return {version:1,settings:{examDate:'',weeklyHours:10},modules:{},logs:[]};}
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function validateState(s){
 if(!record(s)||s.version!==1||!record(s.settings)||!record(s.modules)||!Array.isArray(s.logs))return '備份格式不正確';
 if(Object.keys(s).some(k=>!['version','settings','modules','logs'].includes(k)))return '備份包含不支援的欄位';
 const {examDate,weeklyHours}=s.settings;
 if(examDate!==''&&!validDate(examDate))return '考試日期不正確';
 if(typeof weeklyHours!=='number'||!Number.isFinite(weeklyHours)||weeklyHours<0||weeklyHours>168)return '每週目標請填 0–168 小時';
 if(Object.keys(s.modules).length>MODULES.length)return '模組數目不正確';
 for(const [id,status] of Object.entries(s.modules))if(!MODULES.some(m=>m.id===id)||typeof status!=='string'||!Object.hasOwn(STATUSES,status))return '模組或進度狀態不正確';
 if(s.logs.length>10000)return '學習紀錄過多，請先匯出備份';
 const ids=new Set(),daily={};
 for(const l of s.logs){
  if(!record(l)||typeof l.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(l.id)||ids.has(l.id)||!validDate(l.date)||!TOPICS.some(t=>t.id===l.topic)||!Number.isInteger(l.minutes)||l.minutes<1||l.minutes>1440||typeof l.note!=='string'||l.note.length>1000)return '學習紀錄格式不正確';
  ids.add(l.id);daily[l.date]=(daily[l.date]||0)+l.minutes;if(daily[l.date]>1440)return '同一天的學習時數不能超過 24 小時';
 }
 if(new TextEncoder().encode(JSON.stringify(s)).byteLength>700000)return '紀錄已達保存容量，請先匯出備份並整理較早的紀錄';
 return null;
}
export function stats(s,today=dayKey()){
 const values=Object.values(s.modules),start=monday(today),end=addDays(start,7);
 return {done:values.filter(v=>v==='done').length,learning:values.filter(v=>v==='learning').length,total:MODULES.length,totalMinutes:s.logs.reduce((a,l)=>a+l.minutes,0),weekMinutes:s.logs.filter(l=>l.date>=start&&l.date<end).reduce((a,l)=>a+l.minutes,0)};
}
export function backupState(value){const s=value?.format==='cfa-progress-backup'?value.state:value;const error=validateState(s);if(error)throw Error(error);return structuredClone(s);}
