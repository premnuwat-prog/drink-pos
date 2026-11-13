import {chromium} from 'playwright';import assert from 'node:assert/strict';
const b=await chromium.launch({args:['--no-sandbox']});const p=await b.newPage();
try{
 await p.goto(process.env.POS_URL||'http://127.0.0.1:8765');
 const expected=[69,69,69,79,65,65,59,69,79,55,55,79,89,89,79];
 assert.deepEqual(await p.locator('.menu-card .price').allTextContents(),expected.map(n=>'฿'+n));
 await p.evaluate(async()=>{const {addItem}=await import('./core.js');const items=addItem([],0,70).map(m=>({...m,price:65}));localStorage.setItem('cocoa-pos-unpaid-v1',JSON.stringify([{id:crypto.randomUUID(),orderNumber:'0020',createdAt:new Date().toISOString(),items,total:65,customer:'Legacy price'}]));});
 await p.reload();await p.locator('#queue-btn').click();await p.locator('[data-pay-order]').click();
 assert.equal(await p.locator('#payment-total').innerText(),'฿65.00');
 await p.locator('[data-method="transfer"]').click();await p.locator('#pay').click();await p.waitForSelector('#receipt[open]');
 const sale=await p.evaluate(()=>JSON.parse(localStorage.getItem('cocoa-pos-v1'))[0]);
 assert.equal(sale.total,65);assert.equal(sale.items[0].price,65);
 console.log('PASS all 15 displayed menu prices match supplied list; legacy queued snapshot settles at original price; no Google writes');
}finally{await b.close();}
