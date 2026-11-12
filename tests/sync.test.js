import test from 'node:test';
import assert from 'node:assert/strict';
test('only a readable matching server acknowledgement counts as synced',async()=>{
 const {sendOrder}=await import('../sync.js');
 const sale={id:'test-order',total:65};
 let request;
 const transport=async(url,options)=>{request=options;return {ok:true,json:async()=>({ok:true,orderId:sale.id,total:65})};};
 await sendOrder(sale,'private-device-key',transport);
 assert.equal(request.mode,'cors');assert.equal(request.credentials,'omit');
 assert.equal(request.headers['Content-Type'],'text/plain;charset=utf-8');
 assert.equal(JSON.parse(request.body).key,'private-device-key');
 for(const response of [{ok:false,error:'Unauthorized'},{ok:true,orderId:'wrong',total:65},{ok:true,orderId:sale.id,total:1}]){
  await assert.rejects(()=>sendOrder(sale,'key',async()=>({ok:true,json:async()=>response})));
 }
 await assert.rejects(()=>sendOrder(sale,'key',async()=>{throw Error('offline');}));
 await assert.rejects(()=>sendOrder(sale,'key',async()=>({ok:true,json:async()=>{throw Error('HTML');}})));
 await assert.rejects(()=>sendOrder(sale,''));
});
