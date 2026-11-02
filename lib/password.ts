export const PASSWORD_ITERATIONS=100000;
const encoder=new TextEncoder();
export function randomHex(bytes=32){return toHex(crypto.getRandomValues(new Uint8Array(bytes)));}
export function toHex(bytes:Uint8Array){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function fromHex(hex:string){if(!/^(?:[0-9a-f]{2})+$/.test(hex))throw Error('Invalid salt');return Uint8Array.from(hex.match(/../g)!,b=>parseInt(b,16));}
export async function digest(value:string){return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));}
export async function hashPassword(password:string,salt:string,iterations=PASSWORD_ITERATIONS){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return toHex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromHex(salt),iterations,hash:'SHA-256'},key,256)));
}
export function constantTimeEqual(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
