export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hours=n=>new Intl.NumberFormat('zh-Hant',{maximumFractionDigits:1}).format(n/60);
export function heading(title,sub,action=true){return `<header class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div>${action?'<button class="primary" data-action="log">＋ 記錄學習</button>':''}</header>`;}
export function empty(title,text){return `<div class="empty"><span class="empty-symbol" aria-hidden="true">↗</span><h3>${title}</h3><p>${text}</p></div>`;}
export function progress(done,total){return `<div class="progress" role="progressbar" aria-label="完成進度" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width:${total?done/total*100:0}%"></span></div>`;}
