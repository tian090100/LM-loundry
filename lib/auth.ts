import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { digest, randomHex, hashPassword, constantTimeEqual, PASSWORD_ITERATIONS } from './password';
export type AppUser={id:string;name:string;email:string;role:'owner'|'employee'};
export const SESSION_COOKIE='lm_session';
export const SESSION_SECONDS=43200;
export async function getSession():Promise<AppUser|null>{
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token||!/^[0-9a-f]{64}$/.test(token))return null;
 const hash=await digest(token);
 const u=await env.DB!.prepare('SELECT u.id,u.name,u.email,u.role FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>? AND u.active=1').bind(hash,Date.now()).first<AppUser>();
 return u&&['owner','employee'].includes(u.role)?u:null;
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export function sessionCookie(token:string,request:Request,maxAge=SESSION_SECONDS){return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export const authJSON=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export async function provisionUsers(){
 if(!env.AUTH_BOOTSTRAP_USERS)return;
 const users=JSON.parse(env.AUTH_BOOTSTRAP_USERS) as {email:string;name:string;role:string;hash:string;salt:string;iterations:number}[];
 if(!Array.isArray(users)||users.length>20)throw Error('Invalid account configuration');
 const statements=users.map(u=>{
  if(!['owner','employee'].includes(u.role)||!u.email||!/^[a-f0-9]{64}$/.test(u.hash)||!/^[a-f0-9]{64}$/.test(u.salt)||u.iterations!==PASSWORD_ITERATIONS)throw Error('Invalid account configuration');
  return env.DB!.prepare('INSERT INTO app_users (id,email,name,role,password_hash,salt,iterations,active,created) VALUES (?,?,?,?,?,?,?,1,?) ON CONFLICT(email) DO NOTHING').bind(crypto.randomUUID(),u.email.trim().toLowerCase(),u.name,u.role,u.hash,u.salt,u.iterations,new Date().toISOString());
 });
 if(statements.length)await env.DB!.batch(statements);
}
export async function consumeLoginAttempt(email:string,ip:string){
 const now=Date.now(),reset=now+15*60000;
 const keys=await Promise.all(['email:'+email,'ip:'+ip].map(digest));
 const results=await env.DB!.batch(keys.map(key=>env.DB!.prepare('INSERT INTO auth_attempts (key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING attempts').bind(key,reset,now,now,reset)));
 return Number((results[0].results[0] as any)?.attempts)<=10&&Number((results[1].results[0] as any)?.attempts)<=40;
}
export async function verifyAccount(email:string,password:string){
 const row=await env.DB!.prepare('SELECT * FROM app_users WHERE email=? AND active=1').bind(email).first<any>();
 // The dummy hash keeps nonexistent accounts on the same expensive path.
 const actual=await hashPassword(password,row?.salt??'00'.repeat(32),row?.iterations??PASSWORD_ITERATIONS);
 if(!row||!constantTimeEqual(actual,row.password_hash))return null;
 return {id:row.id,name:row.name,email:row.email,role:row.role} as AppUser;
}
export async function createSession(user:AppUser){const token=randomHex();await env.DB!.prepare('INSERT INTO app_sessions (token_hash,user_id,expires,created) VALUES (?,?,?,?)').bind(await digest(token),user.id,Date.now()+SESSION_SECONDS*1000,Date.now()).run();return token;}
