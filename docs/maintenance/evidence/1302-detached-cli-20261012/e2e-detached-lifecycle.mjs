// Actual CLI lifecycle only: no SDK inference or credential acceptance claims.
// Usage: node e2e-detached-lifecycle.mjs <runtime> <absolute-cli-entry> <new-scratch-root>
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [runtime,entry,scratch]=process.argv.slice(2);
if(!runtime||!entry||!scratch||!['darwin','linux','win32'].includes(process.platform))throw new Error('Supply runtime, CLI entry and fresh scratch root on Darwin, an isolated Linux container, or a clean hosted Windows CI runner');
const cli=resolve(entry), root=resolve(scratch), run=promisify(execFile);
const linux=process.platform==='linux', windows=process.platform==='win32';
if(windows){
 assert.equal(process.env.GITHUB_ACTIONS,'true','Windows proof is restricted to clean hosted CI');
 assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted','Do not use an account-bearing self-hosted runner');
}
if(linux){
 const route=await readFile('/proc/net/route','utf8');
 assert.equal(route.trim().split('\n').length,1,'Linux proof requires a network-disabled container');
 assert.equal(process.env.MERIDIAN_DETACHED_ISOLATED_CONTAINER,'1','Run only in a fresh container without credential mounts');
}
const launch=()=>linux||windows?[runtime,[cli]]:['/usr/bin/sandbox-exec',['-f',join(root,'fence.sb'),runtime,cli]];
await mkdir(root,{mode:0o700});
await mkdir(join(root,'claude'),{mode:0o700});
const quote=value=>JSON.stringify(value);
const privatePaths=['.codex','.claude','.config','Library/Keychains'].map(path=>`(subpath ${quote(join(homedir(),path))})`).join(' ');
const policy=`(version 1)
(allow default)
(deny network*)
(deny file-read-data ${privatePaths})
(deny file-write* (subpath ${quote(homedir())}))
(allow network-inbound (local ip "localhost:*"))
(allow network-outbound (remote ip "localhost:*"))
(allow network-bind (local ip "localhost:*"))
(allow network* (local unix-socket) (remote unix-socket))
; macOS /bin/ps is setuid and otherwise fails at spawn. Only this read-only
; identity utility is exempt; CLI, server and SDK children retain the fence.
(allow process-exec (literal "/bin/ps") (with no-sandbox))
`;
await writeFile(join(root,'fence.sb'),policy);
const base=Object.fromEntries(['PATH','HOME','TMPDIR','USER','LOGNAME',...(windows?['SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','COMSPEC','PATHEXT']:[])].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(base,{MERIDIAN_CONFIG_DIR:join(root,'config'),CLAUDE_CONFIG_DIR:join(root,'claude'),MERIDIAN_CREDENTIALS_READONLY:'1',MERIDIAN_HOST:'127.0.0.1',MERIDIAN_PROFILES:JSON.stringify([{id:'offline-fixture',type:'api',apiKey:'offline-fixture-not-a-key',baseUrl:'http://127.0.0.1:1'}])});
async function reserve(){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));return{server,port:server.address().port};}
const reservations=await Promise.all([reserve(),reserve()]);
const ports=reservations.map(item=>item.port);
for(const {server} of reservations)await new Promise(r=>server.close(r));
const commands=[];let failure;let configurationDiagnostic;
async function command(port,args){
 try{const [executable,prefix]=launch();const result=await run(executable,[...prefix,...args],{env:{...base,MERIDIAN_PORT:String(port)},cwd:root,timeout:70000,maxBuffer:65536});const value=JSON.parse(result.stdout);commands.push({port,args,exit:0,value,stderr:result.stderr});return value;}
 catch(error){commands.push({port,args,exit:error.code,stdout:error.stdout,stderr:error.stderr});throw error;}
}
async function ready(port){const result=await fetch(`http://127.0.0.1:${port}/readyz`,{signal:AbortSignal.timeout(2000)});assert.equal(result.status,200);assert.equal(await result.text(),'ok\n');}
try{
 const attempts=await Promise.allSettled([command(ports[0],['start','--detach','--json']),command(ports[0],['start','--detach','--json'])]);
 for(const attempt of attempts)if(attempt.status==='rejected')throw attempt.reason;
 const starts=attempts.map(attempt=>attempt.value);
 assert.deepEqual(starts.map(value=>value.outcome).sort(),['ready-created','ready-existing']);
 const first=starts[0],next=starts[1];assert.equal(next.instanceId,first.instanceId);
 const second=await command(ports[1],['start','--detach','--json']);assert.equal(second.outcome,'ready-created');assert.notEqual(first.instanceId,second.instanceId);
 await ready(ports[0]);await ready(ports[1]);
 const stopped=await command(ports[0],['stop','--json']);assert.equal(stopped.outcome,'stopped');assert.equal(stopped.instanceId,first.instanceId);
 await ready(ports[1]);assert.equal((await command(ports[0],['stop','--json'])).outcome,'already-stopped');
 assert.equal((await command(ports[1],['stop','--json'])).outcome,'stopped');
 for(const instance of [first,second]){const log=await readFile(instance.logPath,'utf8');assert.ok(log.length>0);assert.match(log,/shutting down/i);}
}catch(error){failure=String(error);}
finally{
 // A source-only diagnostic reuses the failed command's isolated environment.
 // No repair or bypass: exercise the same directory/ACL operation and preserve
 // its bounded error chain. Both launch attempts have settled before cleanup.
 if(failure&&windows&&cli.endsWith('.ts')){
  const moduleUrl=pathToFileURL(resolve(dirname(cli),'../src/cli/detachedStore.ts')).href;
  const script=`import {detachedPaths} from ${JSON.stringify(moduleUrl)};
try { await detachedPaths(process.env.MERIDIAN_CONFIG_DIR,'127.0.0.1',${ports[0]},true); console.log(JSON.stringify({pass:true})); }
catch(error){ const causes=[]; for(let e=error;e&&causes.length<5;e=e.cause)causes.push({name:e.name,message:String(e.message).slice(0,1200),code:e.code,stderr:typeof e.stderr==='string'?e.stderr.slice(0,2500):undefined});console.log(JSON.stringify({pass:false,causes})); }`;
  try{const result=await run(runtime,['-e',script],{env:base,cwd:root,timeout:30000,maxBuffer:16384});configurationDiagnostic=JSON.parse(result.stdout);}
  catch(error){configurationDiagnostic={probeFailed:true,message:String(error).slice(0,1200)};}
 }
 for(const port of ports)await command(port,['stop','--json']).catch(error=>{failure??=String(error)});
 await writeFile(join(root,'receipt.json'),JSON.stringify({pass:!failure,failure,configurationDiagnostic,cli,runtime,entrySha256:createHash('sha256').update(await readFile(cli)).digest('hex'),platform:process.platform,arch:process.arch,ports,commands,scope:'Actual CLI startup/readiness/targeted graceful stop only. No SDK inference; dummy API profile. Darwin: Seatbelt loopback/Unix sockets with ps-only read-only identity exception. Linux: network-disabled isolated container, no credential mounts. Windows: clean GitHub-hosted CI, allowlisted environment, dummy loopback API profile; no OS network fence.'},null,2));
}
console.log(JSON.stringify({pass:!failure,failure,receipt:join(root,'receipt.json')}));if(failure)process.exitCode=1;
