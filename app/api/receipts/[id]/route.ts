import {getSession,authJSON} from '@/lib/auth';
import {getReceiptOrder} from '@/lib/receipt-data';
import {basketLabelFilename,buildBasketLabelPdf,buildReceiptPdf,receiptFilename} from '@/lib/receipt-pdf';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await getSession())return authJSON({error:'Silakan masuk terlebih dahulu.'},401);
 const {id}=await params,order=await getReceiptOrder(id);if(!order)return authJSON({error:'Pesanan tidak ditemukan.'},404);
 const search=new URL(request.url).searchParams;
 const paper=search.get('paper')==='58'?58:80;
 const basket=search.get('format')==='keranjang';
 const bytes=basket?buildBasketLabelPdf(order):buildReceiptPdf(order,paper);
 const filename=basket?basketLabelFilename(order.number):receiptFilename(order.number,paper);
 return new Response(new Uint8Array(bytes).buffer,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
