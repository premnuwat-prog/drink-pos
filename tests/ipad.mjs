import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const type=process.env.WEBKIT?webkit:chromium;
const b=await type.launch({args:process.env.WEBKIT?[]:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1194,height:834},hasTouch:true});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto(process.env.POS_URL||'http://127.0.0.1:8765');
 assert.match(await p.title(),/เกิดอยากจะโก้/);
 await p.locator('#quick-sweetness').getByRole('button',{name:'30%',exact:true}).click();
 await p.locator('.menu-card[data-id="0"]').tap();
 assert.equal(await p.locator('#customize').evaluate(e=>e.open),false);
 assert.match(await p.locator('#cart').innerText(),/หวาน 30%/);
 await p.locator('.menu-card[data-id="0"]').tap();
 assert.equal(await p.locator('#cup-count').innerText(),'2');
 await p.locator('#quick-sweetness').getByRole('button',{name:'0%',exact:true}).click();
 await p.locator('.menu-card[data-id="0"]').tap();
 assert.equal(await p.locator('.cart-line').count(),2);
 await p.locator('#detail-mode').click();
 await p.locator('.menu-card[data-id="7"]').tap();
 await p.waitForSelector('#customize[open]');
 await p.getByRole('button',{name:'เพิ่มลงออเดอร์',exact:true}).click();
 for(const [width,height] of [[1194,834],[1024,768],[820,1180],[768,1024],[390,844],[320,844]]){
  await p.setViewportSize({width,height});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: no overflow`);
  const bounds=await p.locator('.menu-card').first().boundingBox();
  assert.ok(bounds.height>=80&&bounds.width>=120,`${width}: menu touch size`);
  if(width>=768){
   const pay=await p.locator('#pay').boundingBox();assert.ok(pay.y>=0&&pay.y+pay.height<=height,`${width}: checkout always visible`);
  }
  if(width===1194){const last=await p.locator('.menu-card').last().boundingBox();assert.ok(last.y+last.height<=height,'landscape: all 15 menus visible without scrolling');}
  if(width===1194||width===820)await p.screenshot({path:`/root/drink-pos-ipad-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS iPad quick-add, sweetness variants, detailed mode, 6 viewports and visible checkout; engine='+type.name());
}finally{await b.close();}
