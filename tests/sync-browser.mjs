import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({args:['--no-sandbox']});const p=await b.newPage();
try{
 await p.goto(process.env.POS_URL||'http://127.0.0.1:8765');
 await p.getByRole('button',{name:'ตั้งค่า Sheets',exact:true}).click({timeout:5000});
 await p.getByLabel('SHOP_KEY').fill('test-fixture-key-not-a-real-secret');
 await p.getByRole('button',{name:'บันทึกคีย์ในเครื่อง',exact:true}).click();
 await p.getByRole('button',{name:'ปิดตั้งค่า',exact:true}).click();
 // Failure is injected in browser transport, not represented as a real Google write.
 await p.route('https://script.google.com/**',route=>route.abort('failed'));
 await p.locator('.menu-card').first().click();await p.getByRole('button',{name:'เพิ่มลงออเดอร์',exact:true}).click();
 await p.getByLabel('รับเงิน (บาท)').fill('100');await p.locator('#pay').click();
 await p.waitForSelector('#receipt[open]');
 await p.waitForFunction(()=>document.querySelector('#cloud-status').textContent.includes('รอส่ง 1'));
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1')).length),1);
 const id=await p.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1'))[0].id);
 await p.getByRole('button',{name:'ออเดอร์ถัดไป',exact:true}).click();
 await p.reload();
 assert.match(await p.locator('#cloud-status').innerText(),/รอส่ง 1/);
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1'))[0].id),id);
 await p.getByRole('button',{name:'ตั้งค่า Sheets',exact:true}).click();
 assert.match(await p.locator('#sync-message').innerText(),/รอส่ง 1/);
 console.log('PASS browser regression: device key settings, failed network keeps completed sale + same ID, pending queue persists after reload. No real Sheets writes tested.');
}finally{await b.close();}
