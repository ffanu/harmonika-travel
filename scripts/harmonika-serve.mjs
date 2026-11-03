import net from 'node:net';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export function checkPort(value) {
 if (!/^[0-9]+$/.test(String(value))) throw Error('invalid_port');
 const p=Number(value); if (!Number.isInteger(p)||p<1024||p>65535||p===3000) throw Error('invalid_or_forbidden_port');return p;
}
export async function freePort(value) {
 const port=value===undefined?0:checkPort(value);
 return await new Promise((resolve,reject)=>{
  const server=net.createServer();server.once('error',reject);
  server.listen(port,'127.0.0.1',()=>{const selected=server.address().port;server.close(()=>selected===3000?freePort().then(resolve,reject):resolve(selected));});
 });
}
export async function run(mode) {
 if (!['dev','start'].includes(mode)) throw Error('invalid_mode');
 const fixed=process.env.PORT;
 for(let attempt=0;attempt<8;attempt++) {
  const port=await freePort(fixed);let collision=false;
  const args=mode==='dev'?['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)]:['.next/standalone/server.js'];
  const child=spawn(process.execPath,args,{stdio:['inherit','inherit','pipe'],env:{...process.env,PORT:String(port),HOSTNAME:'127.0.0.1'}});
  const forward=signal=>child.kill(signal);
  const term=()=>forward('SIGTERM'),int=()=>forward('SIGINT');
  process.once('SIGTERM',term);process.once('SIGINT',int);
  child.stderr.on('data',chunk=>{if(chunk.toString().includes('EADDRINUSE'))collision=true;process.stderr.write(chunk);});
  console.log(`Harmonika allocated http://127.0.0.1:${port}; wait for application readiness.`);
  let code;
  try {code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(c,s)=>resolve(s?1:(c??1)));});}
  finally {process.removeListener('SIGTERM',term);process.removeListener('SIGINT',int);}
  if(collision&&fixed===undefined)continue;
  return code;
 }
 throw Error('port_allocation_retries_exhausted');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 run(process.argv[2]||'dev').then(code=>{process.exitCode=code;}).catch(()=>{console.error('harmonika_start_failed');process.exitCode=1;});
}
