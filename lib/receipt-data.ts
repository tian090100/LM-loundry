import { env } from 'cloudflare:workers';
import type {Order,Payment} from './domain';
export async function getReceiptOrder(id:string):Promise<Order|null>{
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(id))return null;
 const [os,ps]=await env.DB!.batch([env.DB!.prepare('SELECT * FROM orders WHERE id=?').bind(id),env.DB!.prepare('SELECT * FROM payments WHERE order_id=? ORDER BY created').bind(id)]);
 const row:any=os.results[0];if(!row)return null;
 const payments=ps.results.map((p:any)=>({...p,orderId:p.order_id})) as Payment[];
 return {...row,items:JSON.parse(row.items),history:JSON.parse(row.history),payments,paid:payments.reduce((sum,p)=>sum+p.amount,0)};
}
