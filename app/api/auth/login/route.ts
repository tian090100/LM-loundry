import { env } from 'cloudflare:workers';
import { authJSON, sameOrigin, provisionUsers, consumeLoginAttempt, verifyAccount, createSession, sessionCookie } from '@/lib/auth';
export async function POST(request:Request){
 if(!sameOrigin(request))return authJSON({error:'Permintaan tidak diizinkan.'},403);
 try{
  const body:any=await request.json();const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
  const password=typeof body?.password==='string'?body.password:'';
  if(!email||email.length>254||!password||password.length>256)return authJSON({error:'Email atau password tidak sesuai.'},401);
  if(!await consumeLoginAttempt(email,request.headers.get('cf-connecting-ip')??'local'))return authJSON({error:'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'},429,{'Retry-After':'900'});
  await provisionUsers();
  const user=await verifyAccount(email,password);
  if(!user)return authJSON({error:'Email atau password tidak sesuai.'},401);
  const token=await createSession(user);
  return authJSON({user},200,{'Set-Cookie':sessionCookie(token,request)});
 }catch{return authJSON({error:'Login belum dapat diproses. Coba lagi sebentar.'},503);}
}
