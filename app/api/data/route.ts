import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { validateOrder, amount, METHODS, nextStatus } from '@/lib/domain';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function snapshot(){
 const db=env.DB!;
 const [os,ps,es]=await db.batch([db.prepare('SELECT * FROM orders ORDER BY created DESC'),db.prepare('SELECT * FROM payments ORDER BY created'),db.prepare('SELECT * FROM expenses ORDER BY created DESC')]);
 return {orders:os.results.map((o:any)=>{const payments=ps.results.filter((p:any)=>p.order_id===o.id).map((p:any)=>({...p,orderId:p.order_id}));return {...o,items:JSON.parse(o.items),history:JSON.parse(o.history),payments,paid:payments.reduce((a:number,p:any)=>a+p.amount,0)};}),expenses:es.results};
}
export async function GET(){
 try{const u=await getChatGPTUser();if(!u)return json({error:'Silakan masuk terlebih dahulu.'},401);return json(await snapshot());}
 catch(e){console.error('Read failed',e);return json({error:'Data belum dapat dimuat. Coba lagi sebentar.'},500);}
}
export async function POST(request:Request){
 try{
 const u=await getChatGPTUser();if(!u)return json({error:'Silakan masuk terlebih dahulu.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Permintaan tidak diizinkan.'},403);
 const b:any=await request.json(); if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Permintaan tidak valid.'); const db=env.DB!,now=new Date().toISOString(),actor=u.displayName;
 if(typeof b.id!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(b.id))throw Error('Identitas transaksi tidak valid. Muat ulang halaman.');
 if(b.action==='create'){
  const existing=await db.prepare('SELECT id FROM orders WHERE id=?').bind(b.id).first();
  if(existing)return json({...(await snapshot()),selectedId:b.id});
  const o=validateOrder(b),number='LM-'+now.slice(0,10).replaceAll('-','')+'-'+b.id.replaceAll('-','').slice(0,8).toUpperCase();
  const statements=[db.prepare('INSERT INTO orders (id,number,customer,phone,items,total,discount,extra,status,due,created,notes,packages,rack,history) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(b.id,number,o.customer,o.phone,JSON.stringify(o.items),o.total,o.discount,o.extra,'Diterima',o.due,now,o.notes,o.packages,o.rack,JSON.stringify([{status:'Diterima',at:now,actor}]))];
  if(o.paid) statements.push(db.prepare('INSERT INTO payments (id,order_id,amount,method,created,actor) VALUES (?,?,?,?,?,?)').bind(b.id+'-initial',b.id,o.paid,o.method,now,actor));
  await db.batch(statements);
  return json({...(await snapshot()),selectedId:b.id});
 }
 if(b.action==='payment'){
  const n=amount(b.amount);if(!n||!METHODS.includes(b.method))throw Error('Isi nominal dan metode pembayaran yang valid.');
  const existing=await db.prepare('SELECT id FROM payments WHERE id=?').bind(b.id).first();
  if(!existing){
   const r=await db.prepare('INSERT INTO payments (id,order_id,amount,method,created,actor) SELECT ?,id,?,?,?,? FROM orders WHERE id=? AND status != ? AND total-(SELECT COALESCE(SUM(amount),0) FROM payments WHERE order_id=orders.id)>=?').bind(b.id,n,b.method,now,actor,b.orderId,'Dibatalkan',n).run();
   if(!r.meta.changes)throw Error('Pembayaran melebihi sisa tagihan atau pesanan tidak tersedia. Muat ulang data.');
  }
 }
 else if(b.action==='status'){
  const o:any=await db.prepare('SELECT * FROM orders WHERE id=?').bind(b.orderId).first();if(!o)throw Error('Pesanan tidak ditemukan.');
  o.items=JSON.parse(o.items);const next=nextStatus(o);if(!next||next!==b.status)throw Error('Tahapan pesanan sudah berubah. Muat ulang data.');
  const history=[...JSON.parse(o.history),{status:next,at:now,actor}];
  const r=await db.prepare('UPDATE orders SET status=?,history=? WHERE id=? AND status=? AND (? != ? OR total <= (SELECT COALESCE(SUM(amount),0) FROM payments WHERE order_id=orders.id))').bind(next,JSON.stringify(history),o.id,o.status,next,'Selesai').run();
  if(!r.meta.changes)throw Error('Lunasi pembayaran sebelum menyerahkan cucian, atau muat ulang jika status berubah.');
 }
 else if(b.action==='expense'){
  const n=amount(b.amount);if(!n||!['Deterjen','Pewangi','Air','Listrik','Gaji','Sewa','Kemasan','Perawatan','Lainnya'].includes(b.category))throw Error('Isi kategori dan nominal pengeluaran.');
  await db.prepare('INSERT INTO expenses (id,category,amount,note,created,actor) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(b.id,b.category,n,String(b.note??'').slice(0,300),now,actor).run();
 }
 else throw Error('Aksi tidak dikenali.');
 return json(await snapshot());
 }catch(e){const message=e instanceof Error?e.message:'';if(/D1_|SQLITE|constraint|database/i.test(message)){console.error('Write failed',e);return json({error:'Transaksi belum berhasil disimpan. Coba lagi; jangan tutup formulir.'},500);}return json({error:message||'Transaksi gagal. Silakan coba kembali.'},400);}
}

