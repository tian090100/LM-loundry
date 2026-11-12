'use client';

import {useEffect,useState} from 'react';
import {MessageCircle,Share2} from 'lucide-react';

export default function ShareReceipt({pdf,filename,phone,customer,initialOpen}:{pdf:string;filename:string;phone:string;customer:string;initialOpen:boolean}){
 const [open,setOpen]=useState(initialOpen),[file,setFile]=useState<File|null>(null);
 const [status,setStatus]=useState<'idle'|'loading'|'ready'|'unsupported'|'error'>('idle');
 const [sharing,setSharing]=useState(false),[shareError,setShareError]=useState(false);
 useEffect(()=>{
  if(!open)return;
  setFile(null);setShareError(false);
  if(typeof navigator.share!=='function'||typeof navigator.canShare!=='function'){setStatus('unsupported');return;}
  const controller=new AbortController();
  setStatus('loading');
  void (async()=>{
   try{
    const response=await fetch(pdf,{cache:'no-store',signal:controller.signal});
    if(!response.ok||!response.headers.get('content-type')?.startsWith('application/pdf'))throw new Error('PDF unavailable');
    const receipt=new File([await response.blob()],filename,{type:'application/pdf'});
    if(controller.signal.aborted)return;
    if(!navigator.canShare({files:[receipt]})){setStatus('unsupported');return;}
    setFile(receipt);setStatus('ready');
   }catch{if(!controller.signal.aborted)setStatus('error');}
  })();
  return ()=>controller.abort();
 },[open,pdf,filename]);

 async function share(){
  if(!file||sharing)return;
  setSharing(true);setShareError(false);
  try{await navigator.share({files:[file]});}
  catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setShareError(true);}
  finally{setSharing(false);}
 }

 return <section className="receipt-help receipt-share" aria-label="Bagikan struk WhatsApp">
  <button type="button" className="secondary" aria-expanded={open} aria-controls="receipt-share-actions" onClick={()=>setOpen(!open)}><MessageCircle size={17}/>Bagikan ke WhatsApp</button>
  {open&&<div id="receipt-share-actions" className="receipt-share-actions">
   <div aria-live="polite">
    {status==='loading'&&<p>Menyiapkan struk PDF…</p>}
    {status==='ready'&&<p>Pilih WhatsApp, lalu pilih chat {customer}.</p>}
    {status==='error'&&<p role="alert">PDF belum bisa disiapkan untuk dibagikan. Coba unduh PDF Thermal atau masuk ulang jika sesi sudah berakhir.</p>}
    {shareError&&<p role="alert">Berbagi file tidak berhasil. Unduh PDF Thermal, lalu lampirkan di chat pelanggan.</p>}
   </div>
   {status==='ready'&&<button type="button" className="primary" onClick={share} disabled={sharing}><Share2 size={17}/>{sharing?'Membuka menu berbagi…':'Bagikan PDF'}</button>}
   <p>Untuk melampirkan manual, Unduh PDF Thermal, buka chat {customer}, lalu pilih <strong>Dokumen</strong> di WhatsApp.</p>
   <div className="receipt-share-links">
    <a className="secondary" href={'https://wa.me/'+encodeURIComponent(phone)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>Buka chat pelanggan</a>
   </div>
  </div>}
 </section>;
}
