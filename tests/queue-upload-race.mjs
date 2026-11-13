import {chromium} from 'playwright';import assert from 'node:assert/strict';
const b=await chromium.launch({args:['--no-sandbox']});const p=await b.newPage();
let release;const held=new Promise(r=>release=r);const requests=[];
try{
 await p.route('https://script.google.com/**',async route=>{
  const body=route.request().postDataJSON();requests.push(body.order.id);
  if(requests.length===1)await held;
  // Test-only acknowledgement, NOT a real Google write.
  await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ok:true,orderId:body.order.id,total:body.order.total})});
 });
 await p.goto(process.env.POS_URL||'http://127.0.0.1:8765');
 await p.evaluate(()=>localStorage.setItem('cocoa-pos-sheet-key-v1','fixture-not-real'));
 for(const id of [0,1]){await p.locator(`.menu-card[data-id="${id}"]`).click();await p.locator('#queue-submit').click();await p.getByRole('button',{name:'ยืนยันเข้าคิวรอจ่าย',exact:true}).click();}
 for(let i=0;i<2;i++){await p.locator('#queue-btn').click();await p.locator('[data-pay-order]').first().click();await p.locator('[data-method="transfer"]').click();await p.locator('#pay').click();await p.waitForSelector('#receipt[open]');await p.getByRole('button',{name:'ออเดอร์ถัดไป',exact:true}).click();}
 release();
 await p.waitForFunction(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1')).every(s=>s.sheetStatus==='synced'),{},{timeout:5000});
 assert.equal(requests.length,2);assert.equal(new Set(requests).size,2);
 console.log('PASS transport-fixture test: second payment made during first upload is automatically drained; not a real Sheets write');
}finally{release();await b.close();}
