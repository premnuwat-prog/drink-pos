import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.POS_URL||'http://127.0.0.1:8765');
 await page.waitForSelector('.menu-card',{timeout:5000});
 assert.equal(await page.locator('.menu-card').count(),15);
 await page.locator('#detail-mode').click();
 await page.locator('.menu-card').filter({hasText:'Dark Cocoa'}).first().click();
 await page.locator('#sweetness').getByRole('button',{name:'30%',exact:true}).click();
 await page.getByRole('button',{name:'เพิ่มลงออเดอร์',exact:true}).click();
 await page.getByLabel('รับเงิน (บาท)').fill('100');
 await page.getByRole('button',{name:'ยืนยันรับเงิน',exact:true}).click();
 await page.waitForSelector('#receipt[open]');
 assert.match(await page.locator('#receipt').innerText(),/35\.00/);
 await page.getByRole('button',{name:'ออเดอร์ถัดไป',exact:true}).click();
 await page.reload();
 await page.getByRole('button',{name:'ประวัติขาย',exact:true}).click();
 await page.locator('.history-sale summary').first().click();
 assert.match(await page.locator('#history').innerText(),/Dark Cocoa/);
 await page.getByRole('button',{name:'ปิดประวัติ',exact:true}).click();
 await page.screenshot({path:'/root/drink-pos-desktop.png',fullPage:true});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 await page.screenshot({path:'/root/drink-pos-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: 15 menus, sweetness, cash checkout/change, persisted history, desktop + 390/320px mobile, no JS errors');
}finally{await browser.close();}
