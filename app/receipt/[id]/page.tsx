import { redirect,notFound } from 'next/navigation';
import {getSession} from '@/lib/auth';
import {getReceiptOrder} from '@/lib/receipt-data';
import ReceiptView from './receipt-view';
export const dynamic='force-dynamic';
export const metadata={title:'Nota pesanan — LM Laundry',robots:{index:false,follow:false}};
export default async function ReceiptPage({params}:{params:Promise<{id:string}>}){
 if(!await getSession())redirect('/');
 const {id}=await params,order=await getReceiptOrder(id);if(!order)notFound();
 return <ReceiptView order={order}/>;
}
