import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOrder, nextStatus, amount } from '../lib/domain.ts';
const input=()=>({customer:'Andi',phone:'0812 3456 7890',items:[{serviceId:'wash',quantity:4.5},{serviceId:'bed',quantity:1}],extra:3000,discount:1000,paid:10000,method:'Tunai',due:new Date(Date.now()+86400000).toISOString(),packages:2});
test('mixed services, fractional kg, discount, and deposit are calculated server-side',()=>{
 const o=validateOrder({...input(),total:1,items:[{serviceId:'wash',quantity:4.5,price:1},{serviceId:'bed',quantity:1,price:1}]});
 assert.equal(o.total,58500);assert.equal(o.paid,10000);assert.equal(o.phone,'6281234567890');assert.equal(o.items[0].price,7000);
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
