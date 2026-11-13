import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),context);
const names=['Dark Cocoa','Classic Cocoa','Cocoa Thai Tea','Matcha Dark Cocoa','Cocoa Mint','Cocoa Pink Milk','Thai Tea','Pure Matcha','Matcha Latte','Pink Milk','Fresh Milk','Milk Cocoa Lava','Thai Tea Cocoa Lava','Matcha Latte Cocoa Lava','Pink Venom Cocoa Lava'];
const current=[69,69,69,79,65,65,59,69,79,55,55,79,89,89,79],legacy=[65,60,65,80,60,60,60,70,75,50,50,75,85,90,75];
function order(name,price){return {id:'12345678-1234-1234-1234-123456789abc',date:'2026-11-13T00:00:00Z',items:[{name,price,qty:1,sweetness:70}],total:price,method:'transfer',paid:price,change:0};}
test('Apps Script accepts all current prices plus legacy pending snapshots without rewriting amounts',()=>{
 names.forEach((name,i)=>{for(const price of [current[i],legacy[i]])assert.equal(context.validate_(order(name,price)).items[0].price,price);});
 assert.throws(()=>context.validate_(order('Dark Cocoa',1)),/Price mismatch/);
});
