import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOrder, nextStatus, amount } from '../lib/domain.ts';
const input=()=>({customer:'Andi',phone:'0812 3456 7890',items:[{serviceId:'wash',quantity:4.5},{serviceId:'bed',quantity:1}],extra:3000,discount:1000,paid:10000,method:'Tunai',due:new Date(Date.now()+86400000).toISOString(),packages:2});
test('mixed services, fractional kg, discount, and deposit are calculated server-side',()=>{
 const o=validateOrder({...input(),total:1,items:[{serviceId:'wash',quantity:4.5,price:1},{serviceId:'bed',quantity:1,price:1}]});
 assert.equal(o.total,43250);assert.equal(o.paid,10000);assert.equal(o.phone,'6281234567890');assert.equal(o.items[0].price,6500);
});
test('rejects overpayment, fractional pieces, negative values, NaN, and invalid dates',()=>{
 assert.throws(()=>validateOrder({...input(),paid:999999}));
 assert.throws(()=>validateOrder({...input(),items:[{serviceId:'bed',quantity:1.5}]}));
 assert.throws(()=>validateOrder({...input(),items:[{serviceId:'wash',quantity:-1}]}));
 assert.throws(()=>validateOrder({...input(),discount:100000}));
 assert.throws(()=>validateOrder({...input(),due:'not a date'}));
 assert.throws(()=>amount(NaN));assert.throws(()=>amount(0.5));
});
test('ironing only skips washing and drying, while mixed orders follow full production',()=>{
 assert.equal(nextStatus({items:[{serviceId:'iron'}],status:'Diterima'}),'Disetrika');
 assert.equal(nextStatus({items:[{serviceId:'wash'},{serviceId:'iron'}],status:'Diterima'}),'Dicuci');
 assert.equal(nextStatus({items:[{serviceId:'wash'}],status:'Siap Diambil'}),'Selesai');
 assert.equal(nextStatus({items:[{serviceId:'wash'}],status:'Selesai'}),undefined);
});

test('photo menu has 7 categories and 24 variants with exact express prices', async()=>{
 const {SERVICES,SERVICE_GROUPS,estimatedHours}=await import('../lib/domain.ts');
 assert.equal(SERVICE_GROUPS.length,7);assert.equal(SERVICES.length,24);
 assert.equal(SERVICES.find(s=>s.id==='wash-3h').price,14000);
 assert.equal(SERVICES.find(s=>s.id==='wash-3h').hours,3);
 assert.equal(SERVICES.find(s=>s.id==='iron-4h').price,7000);
 assert.equal(SERVICES.find(s=>s.id==='fold-4h').hours,4);
 assert.equal(SERVICES.find(s=>s.id==='formal-suit').unit,'set');
 assert.equal(estimatedHours([{serviceId:'wash-3h'},{serviceId:'iron-4h'}]),4);
 assert.equal(estimatedHours([{serviceId:'wash-3h'},{serviceId:'bed'}]),null);
 assert.equal(nextStatus({items:[{serviceId:'iron-4h'}],status:'Diterima'}),'Disetrika');
 assert.equal(nextStatus({items:[{serviceId:'fold-4h'}],status:'Dikeringkan'}),'Siap Diambil');
 assert.throws(()=>validateOrder({...input(),items:[{serviceId:'formal-suit',quantity:1.5}]}));
 const o=validateOrder({...input(),items:[{serviceId:'wash-3h',quantity:2},{serviceId:'formal-suit',quantity:1}],discount:0,extra:0});
 assert.equal(o.total,68000);
});
