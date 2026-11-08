import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReceiptPdf,receiptFilename} from '../lib/receipt-pdf.ts';
export const order={id:'11111111-1111-4111-8111-111111111111',number:'LM-TEST-NOTA',customer:'Pelanggan Uji',phone:'6281234567890',items:[{serviceId:'wash-2d',name:'Cuci + Setrika Wangi — 2 hari',unit:'kg',quantity:10,price:7500,subtotal:75000}],total:75000,paid:25000,extra:0,discount:0,status:'Diterima',created:'2026-11-08T10:00:00Z',due:'2026-11-10T10:00:00Z',packages:1,rack:'B2',notes:'Pisahkan pakaian putih.',payments:[],history:[]};
const readable=pdf=>Array.from(pdf.matchAll(/<([a-f0-9]*)> Tj/g),m=>Buffer.from(m[1],'hex').toString('latin1')).join('\n');
test('receipt PDF includes stored amounts and correct outstanding balance',()=>{
 const pdf=new TextDecoder().decode(buildReceiptPdf(order)),text=readable(pdf);
 assert.ok(pdf.startsWith('%PDF-1.4'));assert.ok(pdf.endsWith('%%EOF\n'));
 for(const part of ['LM-TEST-NOTA','Pelanggan Uji','Cuci + Setrika Wangi - 2 hari','Rp 75.000','Rp 25.000','Rp 50.000','B2'])assert.ok(text.replace(/\s+/g,' ').includes(part),part);
 const xref=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(xref,xref+4),'xref');
 const offsets=Array.from(pdf.matchAll(/(\d{10}) 00000 n/g),m=>Number(m[1]));offsets.forEach((n,i)=>assert.ok(pdf.slice(n).startsWith(`${i+1} 0 obj`)));
 const stream=pdf.match(/\/Length (\d+) >>\nstream\n([\s\S]*?)endstream/);assert.equal(Number(stream[1]),stream[2].length);
});
test('long notes and service names fit roll paper, and content cannot inject PDF operators',()=>{
 const pdf=new TextDecoder().decode(buildReceiptPdf({...order,customer:'René (test) \\ <script>',notes:'a'.repeat(500)+' ) Tj ET /JavaScript',items:Array.from({length:20},()=>({...order.items[0],name:'NamaLayananPanjangTanpaSpasi'.repeat(5)}))}));
 const decoded=Array.from(pdf.matchAll(/<([a-f0-9]*)> Tj/g),m=>Buffer.from(m[1],'hex').toString('latin1'));
 assert.ok(decoded.includes('René (test) \\ <script>'));
 assert.ok(decoded.every(line=>line.length<=28));
 assert.ok(!pdf.includes('/JavaScript'));
 const box=pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);assert.equal(Number(box[1]),164.41);assert.ok(Number(box[2])>1000&&Number(box[2])<14400);
 // Every glyph remains inside a centered 48 mm printable area, including headings.
 for(const line of pdf.matchAll(/BT \/F[12] ([\d.]+) Tf 1 0 0 1 ([\d.]+) [\d.]+ Tm <([a-f0-9]*)> Tj ET/g)){
  const size=Number(line[1]),x=Number(line[2]),width=line[3].length/2*size*.6;
  assert.ok(x>=14.16&&x+width<=150.25,`Text outside printable area: ${x} + ${width}`);
 }
 assert.equal(receiptFilename('../bad\r\nname'),'Nota----bad--name.pdf');
});
