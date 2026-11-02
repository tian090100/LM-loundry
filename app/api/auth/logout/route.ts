import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { authJSON,sameOrigin,sessionCookie,SESSION_COOKIE } from '@/lib/auth';
import { digest } from '@/lib/password';
export async function POST(request:Request){
 if(!sameOrigin(request))return authJSON({error:'Permintaan tidak diizinkan.'},403);
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(token)await env.DB!.prepare('DELETE FROM app_sessions WHERE token_hash=?').bind(await digest(token)).run();
 return authJSON({ok:true},200,{'Set-Cookie':sessionCookie('',request,0)});
}
