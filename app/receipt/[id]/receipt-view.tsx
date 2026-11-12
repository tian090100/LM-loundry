'use client';
import {useRef,useState} from 'react';
import {Printer,Download,ArrowLeft,CheckCircle2} from 'lucide-react';
import {money,dateTime,type Order} from '@/lib/domain';
import {receiptFilename} from '@/lib/receipt-pdf';
import ShareReceipt from './share-receipt';
export default function ReceiptView({order:o,shareOpen}:{order:Order;shareOpen:boolean}){
 const [attempted,setAttempted]=useState(false),[error,setError]=useState('');
 const paperRef=useRef<HTMLElement>(null);
 const printStyleRef=useRef<HTMLStyleElement>(null);

 function print(){
  setAttempted(true);
  setError('');
  const paper=paperRef.current;
  const printStyle=printStyleRef.current;
  const thermal=/Android/i.test(navigator.userAgent)&&paper&&printStyle;

  const cleanup=()=>{
   paper?.classList.remove('receipt-paper--thermal');
   if(printStyle)printStyle.textContent='';
   window.removeEventListener('afterprint',cleanup);
  };

  try{
   if(thermal){
    paper.classList.add('receipt-paper--thermal');
    const heightMm=Math.ceil(paper.getBoundingClientRect().height*25.4/96)+2;
    printStyle.textContent=`@page { size: 58mm ${heightMm}mm; margin: 0; }`;
    window.addEventListener('afterprint',cleanup,{once:true});
   }
   window.print();
  }catch{
   cleanup();
   setError('Dialog cetak tidak bisa dibuka. Buka nota di Chrome lalu coba lagi.');
  }
 }
 const pdf='/api/receipts/'+encodeURIComponent(o.id);
 return <main className="receipt-screen"><style ref={printStyleRef} media="print"/><header className="receipt-toolbar"><a className="receipt-back" href="/"><ArrowLeft size={17}/>Kembali ke aplikasi</a><div className="receipt-buttons"><button className="primary" onClick={print}><Printer size={17}/>Cetak</button><a className="secondary" href={pdf} download><Download size={17}/>Unduh PDF</a><a className="secondary" href={pdf+'?paper=58'} download><Download size={17}/>PDF Thermal 58 mm</a></div></header><aside className="receipt-help" aria-live="polite"><strong>Siap dicetak atau disimpan</strong><p>{attempted?'Dialog cetak belum muncul? Unduh PDF, lalu buka dan cetak file tersebut di Chrome, Safari, atau aplikasi pembuka PDF.':'Tekan Cetak untuk memilih printer. Di Android, pilih RPP02N dan ukuran kertas 58 mm.'}</p>{error&&<p role="alert">{error}</p>}</aside><ShareReceipt pdf={pdf} filename={receiptFilename(o.number)} phone={o.phone} customer={o.customer} initialOpen={shareOpen}/><article ref={paperRef} className="receipt-paper" aria-label={'Nota '+o.number}><div className="receipt-brand"><h1>LM Laundry</h1><p>Bersih Setiap Hari</p></div><div className="receipt-rule"/><p className="receipt-meta"><strong>{o.number}</strong><br/>{o.customer}<br/>WA: +{o.phone}<br/>Masuk: {dateTime(o.created)} WIB<br/>Estimasi: {dateTime(o.due)} WIB<br/>{o.packages} paket</p><div className="receipt-rule"/>{o.items.map((item,i)=><section className="receipt-service" key={i}><strong>{item.name}</strong><div><span>{item.quantity} {item.unit} × {money(item.price)}</span><strong>{money(item.subtotal)}</strong></div></section>)}<div className="receipt-rule"/><dl className="receipt-totals"><div><dt>Biaya tambahan</dt><dd>{money(o.extra)}</dd></div><div><dt>Diskon</dt><dd>{money(o.discount)}</dd></div><div className="receipt-total"><dt>Total</dt><dd>{money(o.total)}</dd></div><div><dt>Dibayar</dt><dd>{money(o.paid)}</dd></div><div className="receipt-total"><dt>Sisa tagihan</dt><dd>{money(Math.max(0,o.total-o.paid))}</dd></div></dl><p className="receipt-notes">Catatan: {o.notes||'—'}</p><div className="receipt-rule"/><p className="receipt-thanks">Simpan nota untuk pengambilan cucian.<br/>Terima kasih sudah mempercayai kami.</p></article><footer className="receipt-screen-footer"><CheckCircle2 size={15}/>Nota dari pesanan yang tersimpan di LM Laundry</footer></main>
}
