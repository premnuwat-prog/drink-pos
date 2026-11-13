import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const key='cocoa-pos-v1';
try{
 await page.goto(process.env.POS_URL||'http://127.0.0.1:8765');
 await page.waitForSelector('.menu-card');
 const ids=await page.evaluate(async()=>{
  const {checkout,addItem}=await import('./core.js');
  const a=checkout(addItem([],0,70),'cash',100);
  const b=checkout(addItem([],1,30),'transfer',0);b.sheetStatus='synced';
  localStorage.setItem('cocoa-pos-v1',JSON.stringify([a,b]));return [a.id,b.id];
 });
 await page.reload();await page.locator('#history-btn').click();
 assert.equal(await page.locator('[data-delete-sale]').count(),2);
 await page.locator('.history-sale summary').first().click();
 page.once('dialog',async d=>{assert.match(d.message(),/ย้อนกลับไม่ได้/);await d.dismiss();});
 await page.locator('[data-delete-sale]').first().click();
 assert.equal(await page.locator('.history-sale').count(),2);
 // A failed storage write must not remove a receipt or change totals.
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='cocoa-pos-v1')throw Error('Quota');return window.originalSetItem.call(this,k,v);};});
 page.once('dialog',d=>d.accept());await page.locator('[data-delete-sale]').first().click();
 assert.match(await page.locator('#history-error').innerText(),/ลบไม่สำเร็จ/);
 assert.equal(await page.locator('.history-sale').count(),2);
 assert.equal(await page.locator('#today-total').innerText(),'฿138.00');
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem;});
 // Retain an order saved by another tab after the dialog opened.
 const extra=await page.evaluate(async()=>{
  const {checkout,addItem}=await import('./core.js');const sale=checkout(addItem([],6,0),'transfer',0);
  const rows=JSON.parse(localStorage.getItem('cocoa-pos-v1'));rows.push(sale);localStorage.setItem('cocoa-pos-v1',JSON.stringify(rows));return sale.id;
 });
 page.once('dialog',d=>d.accept());await page.locator('[data-delete-sale]').first().click();
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).map(s=>s.id),key),[ids[1],extra]);
 assert.equal(await page.locator('#today-total').innerText(),'฿128.00');
 assert.equal(await page.locator('#today-count').innerText(),'2 ออเดอร์ · 2 แก้ว');
 await page.reload();await page.locator('#history-btn').click();
 assert.equal(await page.locator('.history-sale').count(),2);
 await page.locator('.history-sale summary').first().click();
 page.once('dialog',async d=>{assert.match(d.message(),/Google Sheets/);assert.match(d.message(),/ไม่ได้ลบข้อมูลใน Google Sheets/);await d.accept();});
 await page.locator('[data-delete-sale]').first().click();
 await page.locator('.history-sale summary').first().click();
 page.once('dialog',d=>d.accept());await page.locator('[data-delete-sale]').click();
 assert.match(await page.locator('#history-list').innerText(),/ยังไม่มีประวัติขาย/);
 assert.equal(await page.locator('#today-total').innerText(),'฿0.00');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 // Reordering sales through a storage event must not change which visible bill is deleted.
 await page.evaluate(async()=>{
  const {checkout,addItem}=await import('./core.js');
  const rows=[checkout(addItem([],0,70),'transfer',0),checkout(addItem([],1,70),'transfer',0)];
  localStorage.setItem('cocoa-pos-v1',JSON.stringify(rows));
 });
 await page.getByRole('button',{name:'ปิดประวัติ',exact:true}).click();await page.locator('#history-btn').click();
 const visibleId=await page.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1'))[0].id);
 await page.locator('.history-sale summary').first().click();
 await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('cocoa-pos-v1')).reverse();const newValue=JSON.stringify(rows);localStorage.setItem('cocoa-pos-v1',newValue);window.dispatchEvent(new StorageEvent('storage',{key:'cocoa-pos-v1',newValue}));});
 page.once('dialog',d=>d.accept());await page.locator('[data-delete-sale]').first().click();
 assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('cocoa-pos-v1')).some(s=>s.id===id),visibleId),false);
 // A queued bill cannot be deleted while its request is in flight.
 let releaseRequest;
 const requestHeld=new Promise(resolve=>{releaseRequest=resolve;});
 await page.route('https://script.google.com/**',async route=>{await requestHeld;await route.abort('failed');});
 await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('cocoa-pos-v1'));rows[0].sheetStatus='pending';localStorage.setItem('cocoa-pos-v1',JSON.stringify(rows));localStorage.setItem('cocoa-pos-sheet-key-v1','test-only-not-real');});
 await page.reload();await page.locator('#history-btn').click();await page.locator('.history-sale summary').click();
 assert.equal(await page.locator('[data-delete-sale]').isDisabled(),true);
 releaseRequest();await page.waitForFunction(()=>!document.querySelector('[data-delete-sale]').disabled);
 page.once('dialog',d=>d.accept());await page.locator('[data-delete-sale]').click();
 assert.match(await page.locator('#cloud-status').innerText(),/รอส่ง 0/);
 await page.reload();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1'))),[]);
 assert.deepEqual(errors,[]);
 console.log('PASS: cancel/confirm deletion, failed write safety, concurrent orders retained, totals/counts, reload persistence, Sheets warning, empty history, mobile layout. Only isolated browser data used.');
}finally{await browser.close();}
