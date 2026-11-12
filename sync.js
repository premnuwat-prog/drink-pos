export const ENDPOINT='https://script.google.com/macros/s/AKfycbymn2K-fUT3ccQuWfLO54QfIOB6CECLKEk5S8eymLeWBq2s1sUGCCEBmossJRHlgBHe/exec';
export async function sendOrder(order,key,transport=globalThis.fetch){
 if(!key)throw Error('กรอก SHOP_KEY ก่อน');
 const response=await transport(ENDPOINT,{
  method:'POST',mode:'cors',credentials:'omit',redirect:'follow',
  headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({key,order}),signal:AbortSignal.timeout(45000)
 });
 if(!response.ok)throw Error('ส่งไม่สำเร็จ กรุณาลองซิงก์อีกครั้ง');
 let data;try{data=await response.json();}catch{throw Error('อ่านคำยืนยันไม่ได้ ตรวจสิทธิ์ Web app / CORS');}
 if(!data.ok)throw Error(data.error==='Unauthorized'?'SHOP_KEY ไม่ถูกต้อง': 'Sheets ปฏิเสธข้อมูล กรุณาตรวจ Apps Script');
 if(data.orderId!==order.id||data.total!==order.total)throw Error('คำยืนยันไม่ตรงกับบิล');
 return data;
}
