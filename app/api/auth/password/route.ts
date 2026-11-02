import { env } from 'cloudflare:workers';
import { getSession, authJSON, sameOrigin, verifyAccount, sessionCookie, consumeLoginAttempt } from '@/lib/auth';
import { randomHex,hashPassword,PASSWORD_ITERATIONS } from '@/lib/password';
export async function POST(request:Request){
 if(!sameOrigin(request))return authJSON({error:'Permintaan tidak diizinkan.'},403);
 const user=await getSession();if(!user)return authJSON({error:'Silakan masuk terlebih dahulu.'},401);
 try{const b:any=await request.json();if(typeof b.current!=='string'||b.current.length>256||typeof b.next!=='string'||b.next.length<8||b.next.length>128)return authJSON({error:'Password baru minimal 8 dan maksimal 128 karakter.'},400);
  if(!await consumeLoginAttempt(user.email,request.headers.get('cf-connecting-ip')??'local'))return authJSON({error:'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'},429);
  if(!await verifyAccount(user.email,b.current))return authJSON({error:'Password saat ini tidak sesuai.'},400);
  const salt=randomHex(),hash=await hashPassword(b.next,salt);
  await env.DB!.batch([env.DB!.prepare('UPDATE app_users SET password_hash=?,salt=?,iterations=? WHERE id=?').bind(hash,salt,PASSWORD_ITERATIONS,user.id),env.DB!.prepare('DELETE FROM app_sessions WHERE user_id=?').bind(user.id)]);
  return authJSON({ok:true},200,{'Set-Cookie':sessionCookie('',request,0)});
 }catch{return authJSON({error:'Password belum berhasil diperbarui.'},500);}
}
