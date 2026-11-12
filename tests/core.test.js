import test from 'node:test';
import assert from 'node:assert/strict';
test('cart merges identical sweetness, separates variants and calculates payments',async()=>{
 const {addItem,checkout}=await import('../core.js');
 let cart=addItem([],0,30); cart=addItem(cart,0,30); cart=addItem(cart,0,0);
 assert.equal(cart.length,2); assert.equal(cart[0].qty,2);
 assert.throws(()=>checkout(cart,'cash',100),/เงินไม่พอ/);
 assert.throws(()=>checkout([],'cash',100),/ไม่มีรายการ/);
 assert.throws(()=>addItem(cart,0,50),/ความหวาน/);
 const sale=checkout(cart,'cash',200);
 assert.equal(sale.total,195); assert.equal(sale.change,5); assert.equal(sale.items.length,2);
 assert.equal(checkout(cart,'transfer',0).paid,195);
 assert.throws(()=>checkout(cart,'cash',NaN));
});
test('menu matches all supplied names and prices', async()=>{
 const {MENU,SWEETNESS}=await import('../core.js');
 assert.deepEqual(MENU.map(m=>[m.name,m.price]),[['Dark Cocoa',65],['Classic Cocoa',60],['Cocoa Thai Tea',65],['Matcha Dark Cocoa',80],['Cocoa Mint',60],['Cocoa Pink Milk',60],['Thai Tea',60],['Pure Matcha',70],['Matcha Latte',75],['Pink Milk',50],['Fresh Milk',50],['Milk Cocoa Lava',75],['Thai Tea Cocoa Lava',85],['Matcha Latte Cocoa Lava',90],['Pink Venom Cocoa Lava',75]]);
 assert.deepEqual(SWEETNESS,[0,30,70,100]);
});
