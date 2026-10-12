// Native Node / Linux x64 / actual OpenCode V2. Offline mode fences SDK inference.
import assert from 'node:assert/strict'
import cp from 'node:child_process'
import {createRequire,registerHooks,syncBuiltinESMExports} from 'node:module'
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,realpathSync,statSync} from 'node:fs'
import {join,resolve,dirname} from 'node:path'
import {pathToFileURL} from 'node:url'
import {randomUUID,randomBytes,createHash} from 'node:crypto'
import {once} from 'node:events'
import {createServer} from 'node:net'
import {resolveOpenCodeScrub,configureOpenCodeScrub,verifyOpenCodeScrub} from './lib-opencode-scrub-preflight.mjs'
import {sonnetContextFixture} from './e2e-sonnet-context-fixture.mjs'
const [mode,repoArg,clientArg,nativeArg,scrubArg,output]=process.argv.slice(2)
assert(['offline','baseline','candidate'].includes(mode));assert(output)
assert.equal(process.platform,'linux');assert.equal(process.arch,'x64');assert(!process.versions.bun)
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex')
const repo=realpathSync(repoArg),client=realpathSync(clientArg),native=realpathSync(nativeArg)
const scrub=resolveOpenCodeScrub(scrubArg,'0.2.3'),require=createRequire(join(repo,'package.json'))
const sdkPath=require.resolve('@anthropic-ai/claude-agent-sdk')
assert.equal(JSON.parse(readFileSync(join(dirname(sdkPath),'package.json'),'utf8')).version,'0.2.141')
const identity={harness:hash(new URL(import.meta.url)),server:hash(join(repo,'dist/server.js')),client:hash(client),native:hash(native),scrub:scrub.sha256,sdk:'0.2.141',sdkEntry:hash(sdkPath),fixture:hash(new URL('./e2e-sonnet-context-fixture.mjs',import.meta.url)),preflight:hash(new URL('./lib-opencode-scrub-preflight.mjs',import.meta.url))}
let profiles=[{id:'offline-fixture',type:'oauth-token',oauthToken:'invalid-offline-fixture'}]
if(mode!=='offline'){
 assert.equal(process.env.E2E_ALLOW_LIVE_MODEL,'1','Live inference requires explicit harness authorization')
 const qualification=JSON.parse(readFileSync(process.env.E2E_QUALIFICATION_FILE,'utf8'))
 assert.equal(qualification.result,'OFFLINE_PASS');assert.deepEqual(qualification.identity,identity);assert(qualification.joined)
 const grant=process.env.E2E_LIVE_PROFILE_FILE;assert.equal(statSync(grant).mode&0o077,0)
 profiles=JSON.parse(readFileSync(grant,'utf8'));assert.equal(profiles.length,1)
 assert.equal(profiles[0].type,'oauth-token');assert(typeof profiles[0].oauthToken==='string'&&profiles[0].oauthToken.length>20)
 assert(Object.keys(profiles[0]).every(k=>['id','type','oauthToken'].includes(k)),'Grant must contain only access-token profile fields')
}
const root=realpathSync(mkdtempSync('/tmp/sonnet-qualified-'))
for(const d of ['project','client','home','proxy','sessions','config','data','cache','state'])mkdirSync(join(root,d))
const project=join(root,'project'),config=join(root,'client'),model='claude-sonnet-5-5',fixture=sonnetContextFixture()
const scrubConfig=configureOpenCodeScrub(root,scrub)
for(const key of Object.keys(process.env))if(/^(MERIDIAN_|CLAUDE_|CLAUDE_PROXY_|ANTHROPIC_|OPENAI_|OPENCODE_)/.test(key))delete process.env[key]
Object.assign(process.env,{HOME:join(root,'home'),PWD:project,INIT_CWD:project,MERIDIAN_CONFIG_DIR:join(root,'proxy'),MERIDIAN_SESSION_DIR:join(root,'sessions'),MERIDIAN_WORKDIR:project,MERIDIAN_PASSTHROUGH:'1',MERIDIAN_CREDENTIALS_READONLY:'1',MERIDIAN_NO_UPDATE_CHECK:'1',MERIDIAN_TELEMETRY_PERSIST:'0',MERIDIAN_CLAUDE_PATH:native,MERIDIAN_OPENCODE_ATTESTATION_KEY:randomBytes(32).toString('base64url'),DISABLE_AUTOUPDATER:'1'})
const sdkConfig=join(root,'proxy','profiles',profiles[0].id);mkdirSync(sdkConfig,{recursive:true,mode:0o700});process.env.CLAUDE_CONFIG_DIR=sdkConfig
process.chdir(project)
const actors=[],report={result:'INCOMPLETE',mode,identity,platform:process.platform,arch:process.arch,node:process.version,queries:[],wire:[],actors:[],actualEntries:0,joined:false}
const diagnostics=[]
const diagnosticTags=value=>{let text;try{text=typeof value==='string'?value:JSON.stringify(value)}catch{text='unserializable'}return ['session_turn_conflict','invalid_request_error','authentication_error','rate_limit_error','billing_error','context_overflow','Prompt exceeds','not_found','replay','refused','modified-history','lineage','abort','SDK_ADMISSION_LIMIT'].filter(x=>text?.includes(x))}
const checkpoint=phase=>writeFileSync(output+'.progress.json',JSON.stringify({phase,actualEntries:report.actualEntries,queries:report.queries.length,wire:report.wire.length})+'\n',{mode:0o600})
const saved={...Object.fromEntries(['log','warn','error','debug'].map(k=>[k,console[k]]))}
for(const key of Object.keys(saved))console[key]=(...args)=>{const phrases=[...new Set(args.flatMap(diagnosticTags))];if(phrases.length)diagnostics.push({level:key,phrases})}
for(const name of ['spawn','execFile']){const original=cp[name];cp[name]=function(...args){const child=Reflect.apply(original,this,args);const fact={pid:child.pid??null,close:false,stdoutClose:!child.stdout,stderrClose:!child.stderr};const closed=new Promise(resolve=>child.once('close',(code,signal)=>{Object.assign(fact,{close:true,code,signal});resolve()}));child.stdout?.once('close',()=>fact.stdoutClose=true);child.stderr?.once('close',()=>fact.stderrClose=true);actors.push({child,fact,closed});return child}}
syncBuiltinESMExports()
let proxy,server,serverClosed=false,failure,qualified=false,firstSession,initialHistory
const delay=ms=>new Promise(r=>setTimeout(r,ms))
async function bounded(promise,ms,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms)})])}finally{clearTimeout(timer)}}
async function command(exe,args,env,cwd=project){const child=cp.spawn(exe,args,{cwd,env,stdio:['ignore','pipe','pipe']});let stdout='',stderrBytes=0;child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderrBytes+=x.length);const actor=actors.find(x=>x.child===child);try{await bounded(actor.closed,30000,'Command deadline');assert.equal(actor.fact.code,0,`Command exit failure (${stderrBytes} stderr bytes)`);return stdout.trim()}catch(error){child.kill('SIGTERM');await bounded(actor.closed,5000,'Command cleanup close');throw error}}
const clientEnv={PATH:process.env.PATH,HOME:process.env.HOME,PWD:project,INIT_CWD:project,OPENCODE_CONFIG_DIR:config,OPENCODE_DISABLE_AUTOUPDATE:'1',OPENCODE_SERVER_PASSWORD:'owned-fixture',MERIDIAN_CONFIG_DIR:process.env.MERIDIAN_CONFIG_DIR,MERIDIAN_OPENCODE_ATTESTATION_KEY:process.env.MERIDIAN_OPENCODE_ATTESTATION_KEY}
for(const kind of ['CONFIG','DATA','CACHE','STATE'])clientEnv[`XDG_${kind}_HOME`]=join(root,kind.toLowerCase())
const shim=join(root,'sdk-observer.mjs'),shimUrl=pathToFileURL(shim).href
writeFileSync(shim,`export * from ${JSON.stringify(pathToFileURL(sdkPath).href)}; import {query as originalQuery} from ${JSON.stringify(pathToFileURL(sdkPath).href)}; export function query(input){return globalThis.__qualifiedSonnetQuery(input,originalQuery)};`)
registerHooks({resolve(specifier,context,next){if(specifier==='@anthropic-ai/claude-agent-sdk'&&context.parentURL!==shimUrl)return {url:shimUrl,shortCircuit:true};return next(specifier,context)}})
globalThis.__qualifiedSonnetQuery=(input,actual)=>{
 assert(qualified,'Both plugins must be qualified before SDK admission')
 const prompt=typeof input.prompt==='string'?input.prompt:''
 const row={resumed:typeof input.options.resume==='string',sdkModel:input.options.model,pin:input.options.env?.ANTHROPIC_DEFAULT_SONNET_MODEL,nativeMatched:input.options.pathToClaudeCodeExecutable===native,configMatched:input.options.env?.CLAUDE_CONFIG_DIR===sdkConfig,grantMatched:mode==='offline'||input.options.env?.CLAUDE_CODE_OAUTH_TOKEN===profiles[0].oauthToken,characters:prompt.length,historyMessagesRetained:fixture.messages.filter(x=>prompt.includes(x.content)).length,ancientRetained:prompt.includes(fixture.ancient),omitted:prompt.includes('were omitted from this replay'),models:[],inputTokens:0,toolUseBlocks:0,completed:false}
 report.queries.push(row)
 if(mode==='offline'){row.fenced=true;throw new Error('Claude Code does not support this model: OFFLINE QUALIFICATION ONLY — synthetic SDK fence; no inference attempted')}
 assert(report.actualEntries<(mode==='baseline'?1:3),'SDK_ADMISSION_LIMIT: bounded gate refused extra SDK entry')
 assert(row.nativeMatched&&row.configMatched&&row.grantMatched&&row.pin===model,'SDK identity mismatch')
 report.actualEntries++;checkpoint('sdk-entry')
 const query=actual(input)
 return new Proxy(query,{get(target,key){if(key===Symbol.asyncIterator)return async function*(){for await(const event of query){if(event.session_id){firstSession??=event.session_id;row.sameNativeSession=event.session_id===firstSession}if(event.type==='assistant'){if(event.message?.model&&!row.models.includes(event.message.model))row.models.push(event.message.model);const u=event.message?.usage;if(u)row.inputTokens=Math.max(row.inputTokens,(u.input_tokens??0)+(u.cache_read_input_tokens??0)+(u.cache_creation_input_tokens??0));row.toolUseBlocks+=(event.message?.content??[]).filter(x=>x.type==='tool_use').length;if(event.error)row.assistantError=true}if(event.type==='result'){row.resultSubtype=event.subtype;row.resultIsError=event.is_error===true}yield event}row.completed=true};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value}})
}
try{
 report.client=await command(client,['--version'],clientEnv);assert.equal(report.client,'opencode v2.0.16')
 report.native=await command(native,['--version'],{PATH:process.env.PATH,HOME:process.env.HOME,DISABLE_AUTOUPDATER:'1'});assert.equal(report.native,'2.1.296 (Claude Code)')
 const {startProxyServer}=await import(pathToFileURL(join(repo,'dist/server.js')).href)
 proxy=await startProxyServer({port:0,host:'127.0.0.1',silent:true,profiles,defaultProfile:profiles[0].id,...scrubConfig})
 if(!proxy.server.listening)await once(proxy.server,'listening')
 const upstream=`http://127.0.0.1:${proxy.server.address().port}`
 report.scrubLoaded=verifyOpenCodeScrub(await(await fetch(upstream+'/plugins/list')).json(),scrub)
 proxy.server.prependListener('request',(request,response)=>{
  if(new URL(request.url,'http://localhost').pathname!=='/v1/messages')return
  const row={attested:!!request.headers['x-meridian-opencode-turn'],agent:request.headers['x-opencode-agent-name'],session:request.headers['x-opencode-session'],events:[],responseClose:false};report.wire.push(row)
  const emit=request.emit;let body='';request.emit=function(event,...args){if(event==='data')body+=args[0];if(event==='end'){const parsed=JSON.parse(body);row.model=parsed.model;row.bodySha256=createHash('sha256').update(body).digest('hex');row.characters=body.length;row.messageCount=parsed.messages?.length;row.ancientRetained=JSON.stringify(parsed.messages).includes(fixture.ancient);assert.equal(parsed.model,model,'Wrong client model');assert(row.session&&row.agent==='build','Wrong client routing');assert(row.attested||report.wire.slice(0,-1).some(x=>x.session===row.session&&x.attested),'Missing installed client attestation')}return emit.call(this,event,...args)}
  const write=response.write,end=response.end;let buffer=''
  const observe=chunk=>{if(chunk==null)return;buffer+=Buffer.from(chunk).toString();let at;while((at=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,at);buffer=buffer.slice(at+2);for(const line of frame.split('\n'))if(line.startsWith('data: ')){try{const event=JSON.parse(line.slice(6));row.events.push({type:event.type,stopReason:event.delta?.stop_reason,errorType:event.error?.type,errorTags:diagnosticTags(event.error)})}catch{row.invalidFrame=true}}}}
  response.write=function(chunk,...args){observe(chunk);return write.call(this,chunk,...args)};response.end=function(chunk,...args){if(typeof chunk!=='function')observe(chunk);return end.call(this,chunk,...args)}
  response.once('close',()=>Object.assign(row,{responseClose:true,errorTags:diagnosticTags(buffer),status:response.statusCode,finished:response.writableFinished,jsonErrorType:(()=>{try{return JSON.parse(buffer).error?.type}catch{return undefined}})()}))
 })
 const catalog=await(await fetch(upstream+'/v1/models')).json();report.proxyWindow=catalog.data.find(x=>x.id===model)?.context_window
 writeFileSync(join(config,'opencode.json'),JSON.stringify({model:`anthropic/${model}`,providers:{anthropic:{settings:{apiKey:'owned-loopback',baseURL:upstream+'/v1'}}},share:'disabled',compaction:{auto:false}}))
 await command(process.execPath,[join(repo,'dist/cli.js'),'setup','--v2','--opencode-bin',client],clientEnv)
 const configured=JSON.parse(readFileSync(join(config,'opencode.json'),'utf8'))
 assert.deepEqual(configured.plugins.map(p=>realpathSync(p)),[realpathSync(join(repo,'dist/meridian-v2'))]);report.clientPluginConfigured=true
 const reservation=createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r))
 server=cp.spawn(client,['serve','--hostname','127.0.0.1','--port',String(port)],{cwd:project,env:clientEnv,stdio:['ignore','pipe','pipe']});server.stdout.on('data',()=>{});server.stderr.on('data',()=>{});server.once('close',()=>{serverClosed=true})
 const base=`http://127.0.0.1:${port}`,headers={authorization:`Basic ${Buffer.from('opencode:owned-fixture').toString('base64')}`,'content-type':'application/json'}
 async function api(path,body,ms=180000){const response=await fetch(base+path,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)}),signal:AbortSignal.timeout(ms)});assert(response.ok,`Client API ${path.split('?')[0]} returned ${response.status}`);return response.status===204?undefined:response.json()}
 const deadline=Date.now()+30000
 while(Date.now()<deadline){try{const list=await api('/api/model',undefined,1000);report.clientWindow=list.data.find(x=>x.providerID==='anthropic'&&x.modelID===model)?.limit.context;if(report.clientWindow===report.proxyWindow)break}catch{assert(!serverClosed,'Client exited during startup')}await delay(100)}
 assert.equal(report.clientWindow,report.proxyWindow,'Actual client did not adopt proxy catalog')
 const created=await api('/api/session',{location:{directory:project},title:'Native Sonnet context proof',agent:'build',model:{providerID:'anthropic',id:model}})
 const info={...created.data,id:`ses_${randomUUID().replaceAll('-','')}`};let time=Date.now()
 const messages=fixture.messages.map(m=>m.role==='user'?{id:`msg_${randomUUID().replaceAll('-','')}`,type:'user',time:{created:time++},text:m.content}:{id:`msg_${randomUUID().replaceAll('-','')}`,type:'assistant',time:{created:time++,completed:time++},agent:'build',model:info.model,content:[{type:'text',text:m.content}],finish:'stop'})
 messages.push({id:`msg_${randomUUID().replaceAll('-','')}`,type:'idle',time:{created:time++},outcome:'succeeded'})
 await api('/api/experimental/session/import',{info,messages});const imported=JSON.stringify(await api(`/api/session/${info.id}/message?order=asc&limit=100`));assert(imported.includes(fixture.ancient)&&imported.length>900000,'Supported client import lost history');report.importedMessages=messages.length
 qualified=true;checkpoint('plugins-qualified')
 const sdk=await import(pathToFileURL(sdkPath).href)
 async function supportedHistory(){
  assert(firstSession,'Native session identity missing')
  const rows=await sdk.getSessionMessages(firstSession,{dir:project})
  const text=JSON.stringify(rows),models=[...new Set(rows.filter(x=>x.type==='assistant').map(x=>x.message?.model).filter(Boolean))]
  const witness={rows:rows.length,ancientRetained:text.includes(fixture.ancient),historyMessagesRetained:fixture.messages.filter(x=>text.includes(JSON.stringify(x.content).slice(1,-1))).length,models,sha256:createHash('sha256').update(text).digest('hex')}
  report.supportedHistory??=[];report.supportedHistory.push(witness)
  assert(models.length&&models.every(x=>x===model),'Supported SDK history served-model mismatch')
  return rows
 }
 async function prompt(text){await api(`/api/session/${info.id}/prompt`,{text});await api(`/api/experimental/session/${info.id}/wait`,{});return api(`/api/session/${info.id}/message?order=desc&limit=8`)}
 checkpoint('first-prompt');const answer=await prompt(fixture.prompt);checkpoint('first-client-terminal')
 report.clientResults=answer.data.filter(x=>x.type==='assistant'&&x.agent==='build').map(x=>({finish:x.finish,error:!!x.error,model:x.model?.id}))
 report.scrubInvoked=verifyOpenCodeScrub(await(await fetch(upstream+'/plugins/list')).json(),scrub,true)
 assert(report.wire[0]?.attested&&report.wire[0]?.ancientRetained,'Missing actual client plugin/history route')
 if(mode==='offline'){assert.equal(report.actualEntries,0);assert.equal(report.queries.length,1);assert(report.queries[0].fenced&&report.queries[0].configMatched);const q=report.queries[0];if(report.proxyWindow===1000000){assert.equal(q.historyMessagesRetained,fixture.messages.length);assert(q.ancientRetained&&!q.omitted)}else{assert.equal(report.proxyWindow,200000);assert(q.historyMessagesRetained<fixture.messages.length&&!q.ancientRetained&&q.omitted)}report.result='OFFLINE_PASS'}
 else{
  initialHistory=await supportedHistory();const fresh=report.queries[0];assert(fresh.completed&&!fresh.resultIsError&&fresh.models.includes(model),'Initial native model completion failed');assert(report.clientResults.some(x=>x.model===model&&x.finish==='stop'&&!x.error),'Actual client completion missing')
  if(mode==='baseline'){assert(fresh.historyMessagesRetained<fixture.messages.length&&!fresh.ancientRetained&&fresh.omitted,'Baseline did not reproduce premature trim');assert.equal(report.actualEntries,1);report.result='BASELINE_REPRODUCED'}
  else{
   assert(report.supportedHistory[0].ancientRetained&&report.supportedHistory[0].historyMessagesRetained===fixture.messages.length,'Supported SDK history lost large input');assert.equal(report.proxyWindow,1000000);assert.equal(fresh.historyMessagesRetained,fixture.messages.length);assert(fresh.ancientRetained&&!fresh.omitted&&fresh.inputTokens>200000,'Candidate lost native large history')
   const receipt='OWNED_TOOL_'+randomUUID();writeFileSync(join(project,'receipt.txt'),receipt+'\n')
   await prompt('Use the read tool once to read receipt.txt in the current directory. Then acknowledge completion without any other tool.')
   const toolHistory=JSON.stringify(await api(`/api/session/${info.id}/message?order=asc&limit=100`));assert(toolHistory.includes(receipt),'Actual client read result missing')
   assert.equal(report.actualEntries,3,'Expected initial query plus tool and result continuations')
   assert(report.queries.slice(1).every(q=>q.resumed&&q.sameNativeSession&&q.completed&&q.models.includes(model)),'SDK tool/result did not resume original native session')
   const finalHistory=await supportedHistory();assert.deepEqual(finalHistory.slice(0,initialHistory.length),initialHistory,'Initial public SDK history changed');assert(JSON.stringify(finalHistory).includes(receipt),'Supported SDK tool-result receipt missing');report.sourceHistoryPreserved=true;report.toolReceiptObserved=true;report.result='PASS'
  }
 }
}catch(error){checkpoint('failure');failure=error;report.result='FAIL';report.failure=error.message}
finally{
 try{if(server&&!serverClosed){server.kill('SIGTERM');let timer=setTimeout(()=>{if(!serverClosed)server.kill('SIGKILL')},3000);try{await bounded(actors.find(x=>x.child===server).closed,10000,'Original client close missing')}finally{clearTimeout(timer)}}if(proxy)await bounded(proxy.close(),20000,'Proxy close deadline');await bounded(Promise.all(actors.map(x=>x.closed)),10000,'Original actor close missing');report.joined=actors.every(x=>x.fact.close&&x.fact.stdoutClose&&x.fact.stderrClose);assert(report.joined,'Original pipe closure missing')}catch(error){report.cleanupFailure=error.message;report.result='FAIL';failure??=error}
 report.actors=actors.map(x=>x.fact);report.diagnostics=diagnostics;writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});for(const[k,v]of Object.entries(saved))console[k]=v;console.log(JSON.stringify({result:report.result,actualEntries:report.actualEntries,joined:report.joined,failure:report.failure,cleanupFailure:report.cleanupFailure,output}));if(failure)process.exitCode=1
}
