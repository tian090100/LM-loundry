export const SERVICES = [
 {id:'wash',name:'Cuci Setrika',unit:'kg',price:7000,hours:72,icon:'shirt'},
 {id:'iron',name:'Setrika Saja',unit:'kg',price:5000,hours:48,icon:'wind'},
 {id:'express',name:'Cuci Express',unit:'kg',price:12000,hours:24,icon:'zap'},
 {id:'bed',name:'Bed Cover',unit:'pcs',price:25000,hours:72,icon:'bed'},
];
export const STATUSES = ['Diterima','Dicuci','Dikeringkan','Disetrika','Siap Diambil','Selesai'];
export const METHODS = ['Tunai','Transfer','QRIS'];
export type Item = {serviceId:string;name:string;unit:string;quantity:number;price:number;subtotal:number};
export type Payment = {id:string;orderId:string;amount:number;method:string;created:string;actor:string};
export type Order = {id:string;number:string;customer:string;phone:string;items:Item[];total:number;discount:number;extra:number;status:string;due:string;created:string;notes:string;packages:number;rack:string;history:{status:string;at:string;actor:string}[];payments:Payment[];paid:number};
export type Expense = {id:string;category:string;amount:number;note:string;created:string;actor:string};
export const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const day=(iso:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
export const dateTime=(iso:string)=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
export function validateOrder(input:any) {
 if(typeof input.customer!=='string'||!input.customer.trim()||input.customer.length>100) throw Error('Isi nama pelanggan (maksimal 100 karakter).');
 const phone=String(input.phone??'').replace(/[\s()+-]/g,'').replace(/^0/,'62');
 if(!/^62\d{8,13}$/.test(phone)) throw Error('Nomor WhatsApp Indonesia tidak valid.');
 if(!Array.isArray(input.items)||!input.items.length||input.items.length>20) throw Error('Tambahkan minimal satu layanan.');
 const items:Item[]=input.items.map((i:any)=>{
  const s=SERVICES.find(s=>s.id===i.serviceId), q=Number(i.quantity);
  if(!s||!Number.isFinite(q)||q<=0||q>1000||Math.abs(q*1000-Math.round(q*1000))>0.00001||(s.unit==='pcs'&&!Number.isInteger(q))) throw Error('Kuantitas layanan tidak valid.');
  return {serviceId:s.id,name:s.name,unit:s.unit,quantity:q,price:s.price,subtotal:Math.round(q*s.price)};
 });
 const extra=amount(input.extra??0),discount=amount(input.discount??0);
 const subtotal=items.reduce((a,i)=>a+i.subtotal,0),total=subtotal+extra-discount;
 if(total<=0||total>100000000) throw Error('Total tagihan harus lebih dari nol dan maksimal Rp100 juta.');
 const paid=amount(input.paid??0);
 if(paid>total) throw Error('Pembayaran melebihi total tagihan.');
 if(paid>0&&!METHODS.includes(input.method)) throw Error('Pilih metode pembayaran.');
 const due=new Date(input.due);
 if(!Number.isFinite(due.getTime())||due.getTime()<Date.now()-60000) throw Error('Estimasi selesai harus setelah waktu sekarang.');
 const packages=Number(input.packages??1);
 if(!Number.isInteger(packages)||packages<1||packages>100) throw Error('Jumlah paket harus 1–100.');
 return {customer:input.customer.trim(),phone,items,total,extra,discount,paid,method:input.method,due:due.toISOString(),packages,notes:String(input.notes??'').slice(0,500),rack:String(input.rack??'').slice(0,50)};
}
export function amount(value:unknown){const n=Number(value);if(!Number.isSafeInteger(n)||n<0||n>100000000)throw Error('Nominal harus bilangan rupiah utuh antara 0 dan Rp100 juta.');return n;}
export function nextStatus(o:Pick<Order,'items'|'status'>){const path=o.items.every(i=>i.serviceId==='iron')?['Diterima','Disetrika','Siap Diambil','Selesai']:STATUSES;return path[path.indexOf(o.status)+1];}
