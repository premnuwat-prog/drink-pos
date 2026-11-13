import {sendOrder} from './sync.js';
import {MENU,SWEETNESS,addItem,checkout} from './core.js';
const $=s=>document.querySelector(s), money=n=>'฿'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const KEY='cocoa-pos-v1',DRAFT='cocoa-pos-draft-v1';
let sales=[],cart=[],category='all',selected=null,sweetness=70,qty=1,method='cash';
let storageReady=true;
try{sales=JSON.parse(localStorage.getItem(KEY)||'[]');cart=JSON.parse(sessionStorage.getItem(DRAFT)||'[]');if(!Array.isArray(sales)||!Array.isArray(cart))throw Error();}catch{storageReady=false;$('#error').textContent='อ่านข้อมูลเดิมไม่ได้ กรุณาสำรองข้อมูลก่อนใช้งาน';}
const colors={cocoa:['#eee3d8','#593829','#b18665'],matcha:['#e5e9d9','#6e8147','#cfdbad'],tea:['#f3e3d1','#be7435','#f6d69d'],milk:['#f4e2e4','#dea1b0','#fff2e4'],lava:['#e8ddd5','#463026','#d4b89c']};
function art(m){let [bg,drink,milk]=colors[m.category];if(m.name==='Fresh Milk')drink='#f5e9d6';if(m.name==='Cocoa Mint')milk='#b1d3bd';return `<div class="art" style="--bg:${bg};--drink:${drink};--milk:${milk}" aria-hidden="true"><div class="cup"></div></div>`;}
let quickSweetness=70,detailMode=false;
const categoryLabels={cocoa:'โกโก้',matcha:'มัทฉะ',tea:'ชาไทย',milk:'นม',lava:'โกโก้ลาวา'};
function renderQuickSweetness(){ $('#quick-sweetness').innerHTML=SWEETNESS.map(s=>`<button type="button" data-quick-sweet="${s}" class="${s===quickSweetness?'active':''}" aria-pressed="${s===quickSweetness}">${s}%</button>`).join(''); }
$('#quick-sweetness').onclick=e=>{const b=e.target.closest('[data-quick-sweet]');if(b){quickSweetness=Number(b.dataset.quickSweet);renderQuickSweetness();}};
$('#detail-mode').onclick=()=>{detailMode=!detailMode;$('#detail-mode').classList.toggle('active',detailMode);$('#detail-mode').setAttribute('aria-pressed',String(detailMode));$('#add-feedback').textContent=detailMode?'โหมดรายละเอียด · เลือกจำนวนและความหวานก่อนเพิ่ม':'ขายด่วน · แตะเมนูเพื่อเพิ่ม 1 แก้ว';};
const categories=[['all','ทั้งหมด'],['cocoa','โกโก้'],['matcha','มัทฉะ'],['tea','ชา'],['milk','นม'],['lava','ลาวา']];
function renderMenu(){
 $('#categories').innerHTML=categories.map(([id,label])=>`<button data-category="${id}" class="${id===category?'active':''}" aria-pressed="${id===category}">${label}</button>`).join('');
 const found=MENU.filter(m=>(category==='all'||m.category===category)&&m.name.toLowerCase().includes($('#search').value.toLowerCase().trim()));
 $('#menu').innerHTML=found.map(m=>`<button class="menu-card" data-id="${m.id}" aria-label="${m.name} ${m.price} บาท"><span class="menu-type type-${m.category}">${categoryLabels[m.category]}</span><div class="menu-info"><span class="menu-name">${m.name}</span><div class="menu-bottom"><span class="price">฿${m.price}</span><span class="add-icon" aria-hidden="true">+</span></div></div></button>`).join('')||'<p class="muted">ไม่พบเครื่องดื่มที่ค้นหา</p>';
}
function total(){return cart.reduce((sum,m)=>sum+m.price*m.qty,0);}
function renderCart(){
 $('#cart').innerHTML=cart.length?cart.map(m=>`<div class="cart-line"><div><strong>${m.name}</strong><small>หวาน ${m.sweetness}% · ${money(m.price)} / แก้ว</small><div class="stepper"><button data-key="${m.key}" data-delta="-1" aria-label="ลด ${m.name} หวาน ${m.sweetness}%">−</button><strong>${m.qty}</strong><button data-key="${m.key}" data-delta="1" aria-label="เพิ่ม ${m.name} หวาน ${m.sweetness}%">+</button></div></div><strong class="line-price">${money(m.price*m.qty)}</strong></div>`).join(''):'<div class="empty"><div class="empty-icon">♧</div>ยังไม่มีเครื่องดื่มในออเดอร์<br><small>เลือกเมนูโปรดทางด้านซ้ายได้เลย</small></div>';
 $('#cup-count').textContent=cart.reduce((n,m)=>n+m.qty,0);$('#total').textContent=money(total());$('#pay').disabled=!cart.length||!storageReady;
 try{sessionStorage.setItem(DRAFT,JSON.stringify(cart));}catch{/* draft persistence is optional; sales writes are mandatory */}
 updateChange();
}
function updateChange(){$('#change').textContent=money(method==='cash'?Math.max(0,(Number($('#paid').value)||0)-total()):0);}
function localDay(date){return new Date(date).toLocaleDateString('en-CA');}
function stats(){const today=sales.filter(s=>localDay(s.date)===localDay(new Date()));$('#today-total').textContent=money(today.reduce((n,s)=>n+s.total,0));$('#today-count').textContent=`${today.length} ออเดอร์ · ${today.reduce((n,s)=>n+s.items.reduce((a,m)=>a+m.qty,0),0)} แก้ว`;}
function renderSweetness(){$('#sweetness').innerHTML=SWEETNESS.map(s=>`<button type="button" data-sweet="${s}" class="${s===sweetness?'active':''}" aria-pressed="${s===sweetness}">${s}%</button>`).join('');}
$('#menu').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;selected=MENU[Number(b.dataset.id)];if(!detailMode){cart=addItem(cart,selected.id,quickSweetness);$('#error').textContent='';$('#add-feedback').textContent=`เพิ่ม ${selected.name} · หวาน ${quickSweetness}% แล้ว`;renderCart();b.classList.remove('just-added');void b.offsetWidth;b.classList.add('just-added');return;}sweetness=quickSweetness;qty=1;$('#qty').textContent=qty;$('#custom-name').textContent=selected.name;$('#custom-art').innerHTML=art(selected);renderSweetness();$('#customize').showModal();};
$('#sweetness').onclick=e=>{const b=e.target.closest('[data-sweet]');if(b){sweetness=Number(b.dataset.sweet);renderSweetness();}};
$('#qty-minus').onclick=()=>{$('#qty').textContent=qty=Math.max(1,qty-1);};$('#qty-plus').onclick=()=>{$('#qty').textContent=qty=Math.min(99,qty+1);};
$('#custom-form').onsubmit=e=>{e.preventDefault();for(let i=0;i<qty;i++)cart=addItem(cart,selected.id,sweetness);$('#customize').close();$('#error').textContent='';renderCart();};
$('#categories').onclick=e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;renderMenu();}};
$('#search').oninput=renderMenu;
$('#cart').onclick=e=>{const b=e.target.closest('[data-key]');if(!b)return;cart=cart.map(m=>m.key===b.dataset.key?{...m,qty:m.qty+Number(b.dataset.delta)}:m).filter(m=>m.qty>0);renderCart();};
$('#clear').onclick=()=>{if(cart.length&&confirm('ล้างรายการในออเดอร์นี้?')){cart=[];renderCart();}};
$('#methods').onclick=e=>{const b=e.target.closest('[data-method]');if(!b)return;method=b.dataset.method;for(const el of $('#methods').children){el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));}$('#paid-label').hidden=method!=='cash';$('#quick-cash').hidden=method!=='cash';$('#transfer-note').hidden=method!=='transfer';updateChange();};
$('#paid').oninput=updateChange;
$('#quick-cash').onclick=e=>{const b=e.target.closest('[data-cash]');if(b){$('#paid').value=b.dataset.cash==='exact'?total():b.dataset.cash;updateChange();}};
function receiptRows(s){return s.items.map(m=>`<div class="receipt-line"><div>${m.name} × ${m.qty}<small>หวาน ${m.sweetness}%</small></div><strong>${money(m.price*m.qty)}</strong></div>`).join('')+`<div class="receipt-line"><strong>รวม</strong><strong>${money(s.total)}</strong></div><div class="receipt-line"><span>${s.method==='cash'?'เงินสด':'โอนเงิน'} · รับเงิน</span><span>${money(s.paid)}</span></div><div class="receipt-line"><strong>เงินทอน</strong><strong>${money(s.change)}</strong></div>`;}
$('#pay').onclick=()=>{try{
 if(!storageReady)throw Error('ระบบจัดเก็บข้อมูลไม่พร้อม');
 const sale=checkout(cart,method,Number($('#paid').value));
 if(deviceKey())sale.sheetStatus='pending';
 // Read immediately before writing so completed orders in another tab are retained.
 const existing=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(existing))throw Error('ข้อมูลประวัติไม่ถูกต้อง');
 const next=[sale,...existing];localStorage.setItem(KEY,JSON.stringify(next));sales=next;
 $('#receipt-body').innerHTML=`<p class="muted">#${sale.id.slice(0,8)} · ${new Date(sale.date).toLocaleString('th-TH')}</p>`+receiptRows(sale);
 cart=[];$('#paid').value='';$('#error').textContent='';renderCart();stats();$('#receipt').showModal();
 renderSync();void syncPending();
 }catch(e){$('#error').textContent=e.message.includes('เงิน')||e.message.includes('รายการ')?e.message:'บันทึกไม่สำเร็จ ห้ามรับเงินซ้ำ — ตรวจพื้นที่จัดเก็บ/ประวัติก่อนลองใหม่';}};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
$('#print').onclick=()=>window.print();
function renderHistory(){
 $('#history-list').innerHTML=sales.length?sales.map(s=>`<details class="history-sale"><summary><strong>${money(s.total)}</strong> · ${new Date(s.date).toLocaleString('th-TH')}<br>#${s.id.slice(0,8)} · ${s.method==='cash'?'เงินสด':'โอนเงิน'}</summary><div class="items">${receiptRows(s)}</div><button type="button" class="delete-sale" data-delete-sale="${encodeURIComponent(s.id)}" ${syncBusy?'disabled':''}>ลบบิลนี้จากเครื่อง</button></details>`).join(''):'<p class="muted">ยังไม่มีประวัติขาย</p>';
}
$('#history-btn').onclick=()=>{try{sales=readSales();$('#history-error').textContent='';}catch{$('#history-error').textContent='อ่านประวัติไม่ได้ กรุณาสำรองข้อมูลก่อน';}renderHistory();$('#history').showModal();};
$('#history-list').onclick=e=>{
 const b=e.target.closest('[data-delete-sale]');if(!b||syncBusy)return;
 const sale=sales.find(s=>s.id===decodeURIComponent(b.dataset.deleteSale));if(!sale)return;
 const warning='ลบเฉพาะประวัติในเครื่องนี้ ไม่ได้ลบข้อมูลใน Google Sheets หากส่งไปแล้ว บิลที่ยังรอส่งจะไม่ถูกส่งอีก';
 if(!confirm(`ลบบิล #${sale.id.slice(0,8)} ยอด ${money(sale.total)}?\n${warning}\nยอดสรุปในเครื่องจะลดลง ย้อนกลับไม่ได้ แนะนำส่งออก CSV ก่อนลบ`))return;
 try{
  const next=readSales().filter(s=>s.id!==sale.id);
  localStorage.setItem(KEY,JSON.stringify(next));sales=next;
  $('#history-error').textContent='';renderHistory();stats();renderSync();
 }catch{$('#history-error').textContent='ลบไม่สำเร็จ ประวัติยังไม่ถูกลบ กรุณาตรวจพื้นที่จัดเก็บ';}
};
$('#export').onclick=()=>{const rows=[['Order ID','Date','Menu','Sweetness %','Quantity','Unit price THB','Line total THB','Order total THB','Payment','Paid THB','Change THB'],...sales.flatMap(s=>s.items.map(m=>[s.id,s.date,m.name,m.sweetness,m.qty,m.price,m.price*m.qty,s.total,s.method,s.paid,s.change]))];const csv='\uFEFF'+rows.map(row=>row.map(c=>'"'+String(c).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`cocoa-sales-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('storage',e=>{if(e.key===KEY){try{sales=JSON.parse(e.newValue||'[]');stats();}catch{}}});
const DEVICE_KEY='cocoa-pos-sheet-key-v1';
let syncBusy=false,syncError='';
function deviceKey(){try{return localStorage.getItem(DEVICE_KEY)||'';}catch{return '';}}
function readSales(){const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(data))throw Error('อ่านประวัติไม่ได้');return data;}
function renderSync(){
 const pending=sales.filter(s=>s.sheetStatus==='pending').length;
 const synced=sales.filter(s=>s.sheetStatus==='synced').length;
 const text=deviceKey()?`${syncBusy?'กำลังส่ง · ':''}Sheets ยืนยันแล้ว ${synced} · รอส่ง ${pending} บิล`:`เก็บในเครื่อง · ยังไม่ตั้งค่า Sheets${pending?' · รอส่ง '+pending+' บิล':''}`;
 $('#cloud-status').textContent=text;
 $('#sync-message').textContent=text+(syncError?' — '+syncError:'');
 $('#sync-now').disabled=syncBusy||!deviceKey()||!pending;
 $('#upload-old').disabled=syncBusy||!deviceKey();
 for(const b of document.querySelectorAll('[data-delete-sale]'))b.disabled=syncBusy;
}
async function syncPending(){
 if(syncBusy||!deviceKey())return;
 syncBusy=true;syncError='';
 try{
  sales=readSales();renderSync();
  const queued=sales.filter(s=>s.sheetStatus==='pending');
  for(const sale of queued){
   await sendOrder(sale,deviceKey());
   // Preserve sales completed while the network request was in flight.
   const current=readSales();const row=current.find(s=>s.id===sale.id);
   if(!row)throw Error('ไม่พบประวัติในเครื่องหลังส่ง กรุณาตรวจชีต');
   row.sheetStatus='synced';row.sheetSyncedAt=new Date().toISOString();
   localStorage.setItem(KEY,JSON.stringify(current));sales=current;renderSync();
  }
 }catch(e){syncError=e instanceof TypeError?'เครือข่าย / CORS ไม่สำเร็จ บิลยังรอส่ง กรุณาลองอีกครั้ง':e.message;}
 finally{syncBusy=false;renderSync();}
}
$('#settings-btn').onclick=()=>{$('#shop-key').value='';renderSync();$('#settings').showModal();};
$('#settings-form').onsubmit=e=>{e.preventDefault();try{
 const key=$('#shop-key').value.trim();if(!key)throw Error('กรอก SHOP_KEY ก่อน');
 localStorage.setItem(DEVICE_KEY,key);$('#shop-key').value='';syncError='บันทึกคีย์แล้ว ยังไม่ยืนยันสิทธิ์จนกว่าจะส่งบิลสำเร็จ';renderSync();
 }catch{$('#sync-message').textContent='บันทึกคีย์ไม่ได้ ตรวจพื้นที่จัดเก็บ';}};
$('#sync-now').onclick=()=>{void syncPending();};
$('#upload-old').onclick=()=>{try{
 const current=readSales();const old=current.filter(s=>!s.sheetStatus);
 if(!old.length){syncError='ไม่มีประวัติเดิมที่ยังไม่เคยส่ง';renderSync();return;}
 if(!confirm(`ส่งประวัติเดิม ${old.length} บิลเข้า Sheets? รวมบิลทดสอบถ้ามี กรุณาตรวจประวัติก่อน`))return;
 old.forEach(s=>{s.sheetStatus='pending';});localStorage.setItem(KEY,JSON.stringify(current));sales=current;void syncPending();
 }catch{$('#sync-message').textContent='เตรียมบิลไม่สำเร็จ กรุณาสำรองข้อมูล';}};
window.addEventListener('online',()=>{void syncPending();});
renderQuickSweetness();renderMenu();renderCart();stats();renderSync();void syncPending();
