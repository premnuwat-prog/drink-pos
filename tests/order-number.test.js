import test from 'node:test';import assert from 'node:assert/strict';
test('four digit ticket numbers increment, wrap and skip active tickets',async()=>{
 const {nextOrderNumber}=await import('../core.js');
 assert.equal(nextOrderNumber(null,[]),'0000');
 assert.equal(nextOrderNumber('0000',[]),'0001');
 assert.equal(nextOrderNumber('9998',[]),'9999');
 assert.equal(nextOrderNumber('9999',[]),'0000');
 assert.equal(nextOrderNumber('9999',['0000','0001']),'0002');
 assert.throws(()=>nextOrderNumber('0000',Array.from({length:10000},(_,i)=>String(i).padStart(4,'0'))),/เต็ม/);
});
