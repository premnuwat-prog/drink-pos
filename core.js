export function nextOrderNumber(last,active){
 const used=new Set(active);
 const start=typeof last==='string'&&/^\d{4}$/.test(last)?Number(last):-1;
 for(let offset=1;offset<=10000;offset++){
  const number=String((start+offset)%10000).padStart(4,'0');
  if(!used.has(number))return number;
 }
 throw Error('เลขคิวเต็ม กรุณารับเงินหรือยกเลิกออเดอร์ก่อน');
}
export function addItem(cart,id,sweetness){
 if(!SWEETNESS.includes(sweetness)) throw Error('ความหวานไม่ถูกต้อง');
 const menu=MENU.find(m=>m.id===id); if(!menu) throw Error('ไม่พบเมนู');
 const key=`${id}-${sweetness}`;
 return cart.some(m=>m.key===key)?cart.map(m=>m.key===key?{...m,qty:m.qty+1}:m):[...cart,{...menu,key,sweetness,qty:1}];
}
export function checkout(cart,method,paid){
 if(!cart.length) throw Error('ไม่มีรายการ');
 if(!['cash','transfer'].includes(method)) throw Error('วิธีชำระไม่ถูกต้อง');
 if(cart.some(m=>!Number.isInteger(m.qty)||m.qty<1)) throw Error('จำนวนไม่ถูกต้อง');
 const total=cart.reduce((sum,m)=>sum+m.price*m.qty,0);
 if(method==='transfer') paid=total;
 if(!Number.isFinite(paid)||paid<total) throw Error('เงินไม่พอ กรุณาตรวจสอบยอดรับเงิน');
 return {id:globalThis.crypto.randomUUID(),date:new Date().toISOString(),items:cart.map(m=>({...m})),total,method,paid,change:Math.round((paid-total)*100)/100};
}
export const SWEETNESS=[0,30,70,100];
export const MENU=[
 ['Dark Cocoa',69,'cocoa'],['Classic Cocoa',69,'cocoa'],['Cocoa Thai Tea',69,'cocoa'],['Matcha Dark Cocoa',79,'matcha'],['Cocoa Mint',65,'cocoa'],['Cocoa Pink Milk',65,'cocoa'],['Thai Tea',59,'tea'],['Pure Matcha',69,'matcha'],['Matcha Latte',79,'matcha'],['Pink Milk',55,'milk'],['Fresh Milk',55,'milk'],['Milk Cocoa Lava',79,'lava'],['Thai Tea Cocoa Lava',89,'lava'],['Matcha Latte Cocoa Lava',89,'lava'],['Pink Venom Cocoa Lava',79,'lava']
].map(([name,price,category],id)=>({id,name,price,category}));
