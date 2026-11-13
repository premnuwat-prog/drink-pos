import test from 'node:test';
import assert from 'node:assert/strict';
test('cart merges identical sweetness, separates variants and calculates payments',async()=>{
 const {addItem,checkout}=await import('../core.js');
 let cart=addItem([],0,30); cart=addItem(cart,0,30); cart=addItem(cart,0,0);
 assert.equal(cart.length,2); assert.equal(cart[0].qty,2);
 assert.throws(()=>checkout(cart,'cash',100),/เงินไม่พอ/);
 assert.throws(()=>checkout([],'cash',100),/ไม่มีรายการ/);
 assert.throws(()=>addItem(cart,0,50),/ความหวาน/);
 const sale=checkout(cart,'cash',300);
 assert.equal(sale.total,207); assert.equal(sale.change,93); assert.equal(sale.items.length,2);
 assert.equal(checkout(cart,'transfer',0).paid,207);
 assert.throws(()=>checkout(cart,'cash',NaN));
});
test('menu matches all supplied names and prices', async()=>{
 const {MENU,SWEETNESS}=await import('../core.js');
 assert.deepEqual(MENU.map(m=>[m.name,m.price]),[["Dark Cocoa", 69], ["Classic Cocoa", 69], ["Cocoa Thai Tea", 69], ["Matcha Dark Cocoa", 79], ["Cocoa Mint", 65], ["Cocoa Pink Milk", 65], ["Thai Tea", 59], ["Pure Matcha", 69], ["Matcha Latte", 79], ["Pink Milk", 55], ["Fresh Milk", 55], ["Milk Cocoa Lava", 79], ["Thai Tea Cocoa Lava", 89], ["Matcha Latte Cocoa Lava", 89], ["Pink Venom Cocoa Lava", 79]]);
 assert.deepEqual(SWEETNESS,[0,30,70,100]);
});
