// Read credentials through stdin; emit only salted password hashes.
// Do not commit the input or output. Production configuration belongs in secret env vars.
import {hashPassword,randomHex,PASSWORD_ITERATIONS} from '../lib/password.ts';
let input='';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for account JSON on stdin (input is hidden).\n');
process.stdin.setEncoding('utf8');
process.stdin.on('data',async chunk=>{
 input+=chunk;if(!input.trim().endsWith(']'))return;
 process.stdin.pause();
 try{const users=JSON.parse(input.trim());const result=[];
 for(const u of users){const salt=randomHex();result.push({email:u.email,name:u.name,role:u.role,salt,iterations:PASSWORD_ITERATIONS,hash:await hashPassword(u.password,salt)});}
 process.stdout.write(JSON.stringify(result)+'\n');process.exit(0);
 }catch{process.stderr.write('Unable to prepare accounts.\n');process.exit(1);}
});
