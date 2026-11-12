import type { Order } from './domain';

// Dependency-free roll-paper PDF. Standard Courier keeps widths deterministic.
const WIDTH=80*72/25.4, MARGIN=14, FONT=9, LEADING=13, COLS=36;
type Line={text:string;bold?:boolean;center?:boolean;size?:number};
function printable(value:unknown){return String(value).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\u00a0/g,' ').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u00d7/g,'x').replace(/\u2026/g,'...').replace(/\u2212/g,'-').replace(/[^\x20-\x7e\xa0-\xff]/gu,'?');}
function wrap(value:unknown,columns=COLS){const text=printable(value).trim();if(!text)return [''];const lines:string[]=[];let rest=text;while(rest.length>columns){let at=rest.lastIndexOf(' ',columns);if(at<columns/3)at=columns;lines.push(rest.slice(0,at));rest=rest.slice(at).trimStart();}lines.push(rest);return lines;}
const rp=(value:number)=>'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(value);
const when=(value:string)=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value))+' WIB';
function hex(value:string){return Array.from(value,c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');}
export function receiptFilename(number:string){return 'Nota-'+number.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100)+'.pdf';}
export function buildReceiptPdf(order:Order):Uint8Array{
 const lines:Line[]=[];
 const add=(value:unknown,bold=false)=>wrap(value).forEach(text=>lines.push({text,bold}));
 const divider=()=>add('-'.repeat(COLS));
 const pair=(label:string,value:string,bold=false)=>{const left=printable(label),right=printable(value);if(left.length+right.length+1<=COLS)add(left.padEnd(COLS-right.length,' ')+right,bold);else{add(left,bold);add(right.padStart(COLS,' '),bold);}};
 lines.push({text:'LM Laundry',bold:true,center:true,size:16},{text:'Bersih Setiap Hari',center:true},{text:''});divider();
 add(order.number,true);add(order.customer);add('WA: +'+order.phone);
 add('Masuk: '+when(order.created));add('Estimasi: '+when(order.due));
 add(order.packages+' paket');divider();
 for(const item of order.items){add(item.name,true);add(`${item.quantity} ${item.unit} x ${rp(item.price)}`);pair('Subtotal',rp(item.subtotal));lines.push({text:''});}
 divider();pair('Biaya tambahan',rp(order.extra));pair('Diskon',rp(order.discount));pair('TOTAL',rp(order.total),true);pair('Dibayar',rp(order.paid));pair('SISA TAGIHAN',rp(Math.max(0,order.total-order.paid)),true);divider();
 add('Catatan: '+(order.notes||'-'));lines.push({text:''});add('Simpan nota untuk pengambilan cucian.');add('Terima kasih sudah mempercayai kami.');
 const height=Math.max(300,MARGIN*2+lines.reduce((sum,line)=>sum+(line.size?line.size+5:LEADING),0));
 let y=height-MARGIN;
 const content=lines.map(line=>{const size=line.size??FONT;y-=line.size?size+5:LEADING;const x=line.center?(WIDTH-line.text.length*size*.6)/2:MARGIN;return `BT /${line.bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm <${hex(line.text)}> Tj ET`;}).join('\n')+'\n';
 const objects=[
 '<< /Type /Catalog /Pages 2 0 R >>',
 '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
 `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${WIDTH.toFixed(2)} ${height.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
 '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
 '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
 `<< /Length ${content.length} >>\nstream\n${content}endstream`,
 ];
 let pdf='%PDF-1.4\n';const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
 const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 return new TextEncoder().encode(pdf);
}
