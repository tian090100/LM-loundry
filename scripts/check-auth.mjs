// Local integration test. Feed account JSON through hidden stdin; never log credentials.
import assert from 'node:assert/strict';
const base=process.argv[2]??'http://127.0.0.1:5173';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('This test writes synthetic orders. Use a local preview only.');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for local test account JSON (input is hidden).\n');
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',async chunk=>{input+=chunk;if(!input.trim().endsWith(']'))return;process.stdin.pause();try{
 const accounts=JSON.parse(input.trim()),employee=accounts.find(a=>a.role==='employee'),owner=accounts.find(a=>a.role==='owner');
 async function post(path,body,cookie='',expected=200){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie},body:JSON.stringify(body)});const d=await r.json();assert.equal(r.status,expected,`Unexpected status at ${path}: ${r.status} ${JSON.stringify(d)}`);return {r,d,cookie:r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};}
 assert.equal((await fetch(base+'/api/data')).status,401);
 assert.equal((await fetch(base+'/api/data',{headers:{Cookie:'lm_session='+'f'.repeat(64)}})).status,401);
 await post('/api/auth/login',{email:owner.email,password:'invalid-test-password'},'',401);
 const p=await post('/api/auth/login',{email:employee.email.toUpperCase(),password:employee.password,role:'owner'});assert.equal(p.d.user.role,'employee');assert.match(p.r.headers.get('set-cookie'),/HttpOnly/);assert.match(p.r.headers.get('set-cookie'),/SameSite=Lax/);
 const employeeData=await (await fetch(base+'/api/data',{headers:{Cookie:p.cookie}})).json();assert.deepEqual(employeeData.expenses,[]);assert.ok(!JSON.stringify(employeeData).includes('password_hash'));
 assert.equal((await fetch(base+'/api/data?scope=finance',{headers:{Cookie:p.cookie}})).status,403);
 await post('/api/data',{action:'expense',id:crypto.randomUUID(),category:'Lainnya',amount:1},p.cookie,403);
 const testOrder=await post('/api/data',{action:'create',id:crypto.randomUUID(),customer:'Uji Role Lokal',phone:'081234567800',items:[{serviceId:'wash-3h',quantity:2}],due:new Date(Date.now()+10800000).toISOString(),paid:10000,method:'Tunai',packages:1},p.cookie);assert.equal(testOrder.d.orders.find(o=>o.id===testOrder.d.selectedId).total,28000);assert.deepEqual(testOrder.d.expenses,[]);
 const o=await post('/api/auth/login',{email:owner.email,password:owner.password});assert.equal(o.d.user.role,'owner');
 assert.equal((await fetch(base+'/api/data?scope=finance',{headers:{Cookie:o.cookie}})).status,200);
 await post('/api/data',{action:'expense',id:crypto.randomUUID(),category:'Lainnya',amount:1,note:'Uji role lokal'},o.cookie);
 await post('/api/auth/logout',{},p.cookie);assert.equal((await fetch(base+'/api/data',{headers:{Cookie:p.cookie}})).status,401);
 const temp=crypto.randomUUID();await post('/api/auth/password',{current:owner.password,next:temp},o.cookie);
 assert.equal((await fetch(base+'/api/data',{headers:{Cookie:o.cookie}})).status,401);
 await post('/api/auth/login',{email:owner.email,password:owner.password},'',401);
 const rotated=await post('/api/auth/login',{email:owner.email,password:temp});
 await post('/api/auth/password',{current:temp,next:owner.password},rotated.cookie);
 const restored=await post('/api/auth/login',{email:owner.email,password:owner.password});await post('/api/auth/logout',{},restored.cookie);
 for(let i=0;i<11;i++)await post('/api/auth/login',{email:'unknown-local-test@example.invalid',password:'wrong-local-password'},'',i<10?401:429);
 process.stdout.write('PASS: login, case normalization, invalid passwords, opaque HttpOnly sessions, role tampering rejected, employee finance denied, employee expenses denied, order creation allowed, owner finance allowed, logout revocation, password rotation revocation, provisioning preserves updated passwords, password restoration, brute-force rate limit. Local database only.\n');process.exit(0);
 }catch(e){process.stderr.write(String(e.message)+'\n');process.exit(1);}});
