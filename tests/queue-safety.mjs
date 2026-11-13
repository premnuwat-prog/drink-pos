import {chromium} from 'playwright';import assert from 'node:assert/strict';
const b=await chromium.launch({args:['--no-sandbox']});const p=await b.newPage();
const url=process.env.POS_URL||'http://127.0.0.1:8765';
const Q='cocoa-pos-unpaid-v1',S='cocoa-pos-v1';
try{
 await p.goto(url);await p.locator('.menu-card').first().click();await p.locator('#queue-submit').click();
 await p.getByRole('button',{name:'กลับไปแก้ออเดอร์',exact:true}).click();assert.equal(await p.locator('#cup-count').innerText(),'1');
 await p.locator('#queue-submit').click();
 await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='cocoa-pos-unpaid-v1')throw new DOMException('full','QuotaExceededError');return window.originalSet.call(this,k,v);};});
 await p.getByRole('button',{name:'ยืนยันเข้าคิวรอจ่าย',exact:true}).click();
 assert.match(await p.locator('#summary-error').innerText(),/ไม่สำเร็จ/);assert.equal(await p.locator('#cup-count').innerText(),'1');
 await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);
 await p.getByRole('button',{name:'ยืนยันเข้าคิวรอจ่าย',exact:true}).click();
 await p.locator('#queue-btn').click();
 p.once('dialog',d=>d.dismiss());await p.getByRole('button',{name:'ยกเลิกออเดอร์',exact:true}).click();assert.equal(await p.locator('.queue-order').count(),1);
 await p.locator('[data-pay-order]').click();await p.getByLabel('รับเงิน (บาท)').fill('100');
 await p.evaluate(()=>{Storage.prototype.setItem=function(k,v){if(k==='cocoa-pos-v1')throw Error('disk full');return window.originalSet.call(this,k,v);};});
 await p.locator('#pay').click();assert.match(await p.locator('#payment-error').innerText(),/ไม่สำเร็จ/);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-unpaid-v1')).length),1);
 await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);
 // New unrelated sale is committed after payment dialog opens: retain it.
 await p.evaluate(()=>{const s={id:'other-stable-id',date:new Date().toISOString(),items:[],total:10,method:'cash',paid:10,change:0};localStorage.setItem('cocoa-pos-v1',JSON.stringify([s]));});
 await p.locator('#pay').click();await p.waitForSelector('#receipt[open]');
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1')).length),2);
 await p.getByRole('button',{name:'ออเดอร์ถัดไป',exact:true}).click();
 // Stale queue recovery: persisted sale ID must not become payable again.
 await p.evaluate(()=>{const sale=JSON.parse(localStorage.getItem('cocoa-pos-v1'))[0];localStorage.setItem('cocoa-pos-unpaid-v1',JSON.stringify([{...sale,createdAt:sale.date}]));});
 await p.reload();await p.locator('#queue-btn').click();assert.equal(await p.locator('.queue-order').count(),0);
 await p.getByRole('button',{name:'ปิดคิว',exact:true}).click();await p.locator('#history-btn').click();
 await p.locator('.history-sale summary').first().click();p.once('dialog',d=>d.accept());await p.locator('[data-delete-sale]').first().click();
 await p.getByRole('button',{name:'ปิดประวัติ',exact:true}).click();await p.locator('#queue-btn').click();
 assert.equal(await p.locator('.queue-order').count(),0,'deleting paid history must never resurrect a stale unpaid row');
 console.log('PASS queue safety: summary/cancel dismissal, queue + payment storage failures, exact-ID commit preserves unrelated sale, stale paid queue suppressed');
}finally{await b.close();}
