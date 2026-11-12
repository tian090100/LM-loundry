'use client';

import {useEffect,useState,type RefObject} from 'react';
import {Printer} from 'lucide-react';

const printerWidth=384;

async function renderReceipt(paper:HTMLElement,filename:string){
 const {toBlob}=await import('html-to-image');
 const clone=paper.cloneNode(true) as HTMLElement;
 const holder=document.createElement('div');
 holder.setAttribute('aria-hidden','true');
 holder.style.cssText='position:fixed;left:-10000px;top:0;width:48mm;pointer-events:none';
 clone.classList.add('receipt-paper--thermal');
 holder.appendChild(clone);
 document.body.appendChild(holder);
 try{
  const {width,height}=clone.getBoundingClientRect();
  const blob=await toBlob(clone,{
   backgroundColor:'#fff',
   canvasWidth:printerWidth,
   canvasHeight:Math.ceil(height*printerWidth/width),
   pixelRatio:1,
   skipFonts:true,
  });
  if(!blob)throw new Error('Gambar nota belum tersedia');
  return new File([blob],filename,{type:'image/png'});
 }finally{
  holder.remove();
 }
}

export default function CompactPrint({paperRef,filename}:{paperRef:RefObject<HTMLElement|null>;filename:string}){
 const [file,setFile]=useState<File|null>(null);
 const [available,setAvailable]=useState(false);
 const [message,setMessage]=useState('');

 useEffect(()=>{
  const paper=paperRef.current;
  if(!paper||!/Android/i.test(navigator.userAgent)||typeof navigator.share!=='function'||typeof navigator.canShare!=='function')return;
  let cancelled=false;
  setAvailable(true);
  setFile(null);
  setMessage('');
  void renderReceipt(paper,filename).then(receipt=>{
   if(cancelled)return;
   if(navigator.canShare({files:[receipt]}))setFile(receipt);
   else setMessage('Gunakan tombol Cetak di browser ini.');
  }).catch(()=>{
   if(!cancelled)setMessage('Nota ringkas belum siap. Muat ulang halaman atau gunakan tombol Cetak.');
  });
  return ()=>{cancelled=true;};
 },[paperRef,filename]);

 async function share(){
  if(!file)return;
  setMessage('Pilih Raw Print di menu berbagi.');
  try{
   await navigator.share({files:[file]});
  }catch(error){
   setMessage(error instanceof DOMException&&error.name==='AbortError'
    ?''
    :'Menu berbagi gagal dibuka. Coba lagi atau gunakan tombol Cetak.');
  }
 }

 if(!available)return null;
 return <div className="receipt-compact-print">
  <button type="button" className="secondary" disabled={!file} onClick={share}><Printer size={17}/>Cetak hemat kertas</button>
  {message&&<p role="status">{message}</p>}
 </div>;
}
