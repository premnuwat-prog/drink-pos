/** Drink POS -> Google Sheets. Paste into a spreadsheet-bound Apps Script. */
const SPREADSHEET_ID = '1AJukYqPL_1EONELvqlnOjqIi6RdVoUfy5gznrZ2qpd4';
const PRICES = {
  "Dark Cocoa": 69,
  "Classic Cocoa": 69,
  "Cocoa Thai Tea": 69,
  "Matcha Dark Cocoa": 79,
  "Cocoa Mint": 65,
  "Cocoa Pink Milk": 65,
  "Thai Tea": 59,
  "Pure Matcha": 69,
  "Matcha Latte": 79,
  "Pink Milk": 55,
  "Fresh Milk": 55,
  "Milk Cocoa Lava": 79,
  "Thai Tea Cocoa Lava": 89,
  "Matcha Latte Cocoa Lava": 89,
  "Pink Venom Cocoa Lava": 79
};
// Accept exact legacy prices for already-queued or pending-upload snapshots.
const LEGACY_PRICES = {
  'Dark Cocoa':65, 'Classic Cocoa':60, 'Cocoa Thai Tea':65,
  'Matcha Dark Cocoa':80, 'Cocoa Mint':60, 'Cocoa Pink Milk':60,
  'Thai Tea':60, 'Pure Matcha':70, 'Matcha Latte':75,
  'Pink Milk':50, 'Fresh Milk':50, 'Milk Cocoa Lava':75,
  'Thai Tea Cocoa Lava':85, 'Matcha Latte Cocoa Lava':90,
  'Pink Venom Cocoa Lava':75
};
const HEADERS = {
  Orders:['Order ID','Sold at','Received at','Total THB','Payment','Paid THB','Change THB','Cups','Status','Payload SHA256'],
  OrderItems:['Order ID','Menu','Sweetness %','Quantity','Unit price THB','Line total THB']
};

// Run once before deploying. Keep the generated SHOP_KEY private.
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHOP_KEY')) {
    props.setProperty('SHOP_KEY', Utilities.getUuid() + Utilities.getUuid());
  }
  const book = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(HEADERS).forEach(name => ensureSheet_(book, name));
  console.log('Setup complete. Find SHOP_KEY in Project Settings > Script Properties.');
}

// Public health check only. Sales are never exposed by GET.
function doGet() {
  return json_({ok:true, service:'drink-pos', version:2, priceVersion:'menu-v2'});
}

// Expected POST JSON: {key:SHOP_KEY, order:{id,date,items,method,paid,total,change}}
// Send as text/plain, not application/json, to avoid a CORS preflight.
function doPost(e) {
  let lock;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > 50000) throw new Error('Invalid request size');
    const body = JSON.parse(raw);
    const key = PropertiesService.getScriptProperties().getProperty('SHOP_KEY');
    if (!key || body.key !== key) throw new Error('Unauthorized');
    const sale = validate_(body.order);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) throw new Error('Busy. Retry with the SAME order ID');
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);
    const orders = ensureSheet_(book, 'Orders');
    const items = ensureSheet_(book, 'OrderItems');
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify(sale));
    const hash = Utilities.base64Encode(digest);
    let row = findOrderRow_(orders, sale.id);
    if (row) {
      if (orders.getRange(row,10).getValue() !== hash) {
        throw new Error('Order ID already exists with different data');
      }
      if (orders.getRange(row,9).getValue() === 'COMPLETE') {
        return json_({ok:true, orderId:sale.id, duplicate:true, total:sale.total});
      }
    } else {
      row = orders.getLastRow()+1;
      orders.getRange(row,1,1,10).setValues([[
        sale.id, new Date(sale.date), new Date(), sale.total, sale.method,
        sale.paid, sale.change, sale.items.reduce((n,i)=>n+i.qty,0), 'PENDING', hash
      ]]);
      SpreadsheetApp.flush();
    }
    // Recovery after a partial write: replace this order's lines, then complete.
    // Always retry the SAME ID and identical payload, never generate a new ID.
    if (items.getLastRow()>1) {
      const ids = items.getRange(2,1,items.getLastRow()-1,1).getValues();
      for (let i=ids.length-1;i>=0;i--) {
        if (ids[i][0] === sale.id) items.deleteRow(i+2);
      }
    }
    const rows = sale.items.map(i=>[
      sale.id,i.name,i.sweetness,i.qty,i.price,i.qty*i.price
    ]);
    items.getRange(items.getLastRow()+1,1,rows.length,6).setValues(rows);
    SpreadsheetApp.flush();
    orders.getRange(row,9).setValue('COMPLETE');
    SpreadsheetApp.flush();
    return json_({ok:true, orderId:sale.id, total:sale.total});
  } catch(err) {
    return json_({ok:false, error:String(err.message || err)});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validate_(order) {
  if (!order || typeof order.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.id)) {
    throw new Error('Invalid order ID');
  }
  if (typeof order.date !== 'string' || !Number.isFinite(Date.parse(order.date))) {
    throw new Error('Invalid sale date');
  }
  if (!Array.isArray(order.items) || !order.items.length || order.items.length>100) {
    throw new Error('Invalid items');
  }
  const items = order.items.map(i=>{
    if (!i || !Object.prototype.hasOwnProperty.call(PRICES,i.name)) {
      throw new Error('Unknown menu');
    }
    if (![0,30,70,100].includes(i.sweetness)) throw new Error('Invalid sweetness');
    if (!Number.isInteger(i.qty) || i.qty<1 || i.qty>999) throw new Error('Invalid quantity');
    if (i.price !== PRICES[i.name] && i.price !== LEGACY_PRICES[i.name]) throw new Error('Price mismatch');
    return {name:i.name,sweetness:i.sweetness,qty:i.qty,price:i.price};
  });
  const total = items.reduce((n,i)=>n+i.price*i.qty,0);
  if (order.total !== total) throw new Error('Total mismatch');
  if (!['cash','transfer'].includes(order.method)) throw new Error('Invalid payment method');
  if (typeof order.paid !== 'number' || !Number.isFinite(order.paid) ||
      order.paid<total || order.paid>1000000 ||
      Math.abs(order.paid*100-Math.round(order.paid*100))>0.00001) {
    throw new Error('Invalid paid amount');
  }
  if (order.method === 'transfer' && order.paid !== total) throw new Error('Transfer mismatch');
  const change = Math.round((order.paid-total)*100)/100;
  if (order.change !== change) throw new Error('Change mismatch');
  return {id:order.id,date:new Date(order.date).toISOString(),items,
    total,method:order.method,paid:order.paid,change};
}

function ensureSheet_(book,name) {
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  const headers = HEADERS[name];
  if (!sheet.getLastRow()) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
  } else {
    const existing = sheet.getRange(1,1,1,headers.length).getValues()[0];
    if (existing.some((v,i)=>v !== headers[i])) {
      throw new Error('Header mismatch in '+name+'. Rename the existing tab first.');
    }
  }
  return sheet;
}
function findOrderRow_(sheet,id) {
  if (sheet.getLastRow()<2) return 0;
  const found = sheet.getRange(2,1,sheet.getLastRow()-1,1)
    .createTextFinder(id).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
