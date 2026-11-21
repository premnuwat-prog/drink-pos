import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await (process.env.WEBKIT?webkit:chromium).launch({args:process.env.WEBKIT?[]:['--no-sandbox']});
const page=await browser.newPage({timezoneId:'America/Los_Angeles',viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.clock.install({time:new Date('2026-11-16T18:00:00Z')});
 await page.goto(process.env.POS_URL||'http://127.0.0.1:8765');await page.waitForSelector('.menu-card');
 await page.evaluate(async()=>{
  const {checkout,addItem}=await import('./core.js');
  const fixtures=[['old','2026-11-16T16:59:59Z','cash',1],['cash','2026-11-16T17:00:00Z','cash',1],['transfer','2026-11-17T01:00:00Z','transfer',2]];
  const rows=fixtures.map(([id,date,method,qty])=>{let cart=[];for(let n=0;n<qty;n++)cart=addItem(cart,0,70);return {...checkout(cart,method,500),id,date};});
  localStorage.setItem('cocoa-pos-v1',JSON.stringify(rows));
 });
 await page.reload();await page.locator('#history-btn').click();
 assert.equal(await page.locator('#history-date').inputValue(),'2026-11-17');
 assert.equal(await page.locator('.history-sale').count(),2);
 assert.match(await page.locator('#history-summary').innerText(),/207\.00/);
 assert.match(await page.locator('#history-summary').innerText(),/2 ออเดอร์ · 3 แก้ว/);
 assert.match(await page.locator('#history-summary').innerText(),/เงินสด ฿69\.00/);
 assert.match(await page.locator('#history-summary').innerText(),/โอน ฿138\.00/);
 assert.equal(await page.locator('#today-total').innerText(),'฿207.00');
 const before=await page.evaluate(()=>localStorage.getItem('cocoa-pos-v1'));
 await page.locator('#history-date').fill('2026-11-16');await page.locator('#history-date').dispatchEvent('change');
 assert.equal(await page.locator('.history-sale').count(),1);
 assert.match(await page.locator('#history-summary').innerText(),/69\.00/);
 assert.equal(await page.locator('#today-total').innerText(),'฿207.00');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-day').click();const dl=await downloadPromise;
 assert.equal(dl.suggestedFilename(),'cocoa-sales-2026-11-16.csv');
 const csv=await fs.readFile(await dl.path(),'utf8');assert.match(csv,/"old"/);assert.doesNotMatch(csv,/"transfer"/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('cocoa-pos-v1')),before);
 await page.locator('.history-sale summary').click();page.once('dialog',d=>d.accept());await page.locator('[data-delete-sale]').click();
 assert.equal(await page.locator('.history-sale').count(),0);assert.match(await page.locator('#history-summary').innerText(),/0 ออเดอร์ · 0 แก้ว/);
 assert.equal(await page.locator('#today-total').innerText(),'฿207.00');
 for(const width of [320,390,820,1194]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.locator('#history').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 }
 await page.locator('#history-date').fill('2026-11-15');await page.locator('#history-date').dispatchEvent('change');
 assert.match(await page.locator('#history-summary').innerText(),/0 ออเดอร์ · 0 แก้ว/);
 await page.locator('#history-today').click();assert.equal(await page.locator('.history-sale').count(),2);
 await page.clock.setSystemTime(new Date('2026-11-17T17:00:01Z'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 assert.equal(await page.locator('#today-total').innerText(),'฿0.00');
 assert.equal(await page.locator('#history-date').inputValue(),'2026-11-18');
 assert.equal(await page.locator('.history-sale').count(),0);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1')).length),2);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('PASS daily sales: Bangkok midnight across device timezone, date filter, totals/cash/transfer/counts, scoped CSV, safe past deletion, next-day rollover, mobile.');
}finally{await browser.close();}
