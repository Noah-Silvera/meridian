#!/usr/bin/env bun
/**
 * #1310: actual Pi SDK/controller/read + persisted image feedback escrow.
 *
 * Safe default (no credentials, SDK query, native CLI or external endpoint):
 *   E2E_PI_PACKAGE=/absolute/path/to/@earendil-works/pi-coding-agent \
 *   E2E_PI_VERSION=1.1.0 bun scripts/e2e-pi-image-feedback.mjs
 *
 * Compare the SAME script against another source tree:
 *   E2E_MERIDIAN_ROOT=/absolute/baseline E2E_EXPECT=baseline <command above>
 * Omit E2E_EXPECT=baseline to obtain the candidate assertion's RED on baseline.
 * Capture mode imports production replay.ts; it is NOT SDK/provider acceptance.
 * The scripted endpoint materializes owned fixture copies, NOT SDK attachments.
 *
 * Optional live acceptance, NEVER implicitly enabled:
 *   E2E_ALLOW_LIVE_MODEL=1 E2E_LIVE_PROFILE_FILE=/owned/private/profile.json \
 *   E2E_CLAUDE_BIN=/absolute/claude E2E_MODEL=claude-fable-5-1 \
 *   E2E_PI_PACKAGE=<same package> E2E_PI_VERSION=1.1.0 \
 *   bun scripts/e2e-pi-image-feedback.mjs --live
 * profile.json: one explicitly authorized supported oauth-token profile in an
 * array. No user auth/config discovery, login or profile copying. Any native
 * credential/runtime state is confined to the owned isolated config directory.
 * Live uses actual Pi -> recording loopback relay -> production Meridian HTTP
 * -> unmodified Agent SDK/native Claude -> selected real model. Three fresh
 * replay arms, plus one ordinary resume (four model requests maximum). Client
 * tools are disabled in live arms: no claim of real model attachment read-back
 * or native tool checkpoint coverage. Only supported getSessionMessages reads.
 * E2E_MERIDIAN_ROOT supports source or installed Meridian (dist/server.js) live;
 * source replay.ts is required for credentialless production framing checks.
 * E2E_OUTPUT_DIR, if set, must be a NEW directory. Owned artifacts are retained;
 * nothing is recursively deleted. stdout/report.json contain sanitized facts,
 * not raw history, base64, auth, model prose, or provider endpoints.
 */
import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { deflateSync } from 'node:zlib'

const args = process.argv.slice(2)
assert(args.length === 0 || (args.length === 1 && args[0] === '--live'), 'Use no flags (capture-only) or --live')
const live = args[0] === '--live'
// Gate BEFORE importing Pi, Meridian, the SDK or invoking any model/API.
assert(!live || process.env.E2E_ALLOW_LIVE_MODEL === '1', '--live requires E2E_ALLOW_LIVE_MODEL=1')
assert(globalThis.Bun, 'Run this escrow with Bun (production TypeScript imports)')
const packageDirInput = process.env.E2E_PI_PACKAGE
const expectedPiVersion = process.env.E2E_PI_VERSION
assert(packageDirInput && isAbsolute(packageDirInput) && expectedPiVersion, 'Explicit E2E_PI_PACKAGE and E2E_PI_VERSION required')
const sourceRoot = realpathSync(process.env.E2E_MERIDIAN_ROOT ?? fileURLToPath(new URL('..', import.meta.url)))
const expect = process.env.E2E_EXPECT ?? 'candidate'
assert(['candidate', 'baseline'].includes(expect), 'E2E_EXPECT must be candidate or baseline')
const modelId = process.env.E2E_MODEL ?? 'claude-fable-5-1' // Reporter supplied no model ID.
const profileFile = process.env.E2E_LIVE_PROFILE_FILE
const nativeBin = process.env.E2E_CLAUDE_BIN
assert(!live || (profileFile && isAbsolute(profileFile) && nativeBin && isAbsolute(nativeBin)), 'Live needs explicit private profile file and native CLI')
const rootInput = process.env.E2E_OUTPUT_DIR ? resolve(process.env.E2E_OUTPUT_DIR) : mkdtempSync(join(tmpdir(), 'meridian-pi-image-feedback-'))
if (process.env.E2E_OUTPUT_DIR) {
  assert(isAbsolute(process.env.E2E_OUTPUT_DIR) && !existsSync(rootInput), 'E2E_OUTPUT_DIR must be a new absolute directory')
  mkdirSync(rootInput, { mode: 0o700 })
}
const root = realpathSync(rootInput)
const project = join(root, 'project'), agentDir = join(root, 'pi'), piSessions = join(root, 'pi-sessions')
for (const dir of [project, agentDir, piSessions, join(root, 'home'), join(root, 'native'), join(root, 'plugins')]) mkdirSync(dir, { mode: 0o700 })
// Keep only runtime plumbing. In particular no ambient provider auth, proxy,
// user PI_* settings, SDK options or extension paths survive.
const runtimeEnv = Object.fromEntries(['PATH', 'TMPDIR', 'SYSTEMROOT', 'WINDIR'].filter(key => process.env[key]).map(key => [key, process.env[key]]))
for (const key of Object.keys(process.env)) delete process.env[key]
Object.assign(process.env, runtimeEnv, {
  HOME: join(root, 'home'), USERPROFILE: join(root, 'home'),
  PI_CODING_AGENT_DIR: agentDir, PI_CODING_AGENT_SESSION_DIR: piSessions,
  PI_OFFLINE: '1', PI_SKIP_VERSION_CHECK: '1', PI_TELEMETRY: '0',
  MERIDIAN_CONFIG_DIR: join(root, 'meridian'), MERIDIAN_SESSION_DIR: join(root, 'meridian-sessions'),
  MERIDIAN_WORKDIR: project, MERIDIAN_TELEMETRY_PERSIST: '0', MERIDIAN_NO_UPDATE_CHECK: '1',
  MERIDIAN_CREDENTIALS_READONLY: '1', CLAUDE_CONFIG_DIR: join(root, 'native'),
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1',
})
for (const kind of ['CONFIG', 'DATA', 'CACHE', 'STATE']) process.env[`XDG_${kind}_HOME`] = join(root, kind.toLowerCase())
process.chdir(project)

const report = {
  issue: 1310, mode: live ? 'actual-Pi-Meridian-SDK-live' : 'capture-only-actual-Pi-scripted-Anthropic', expect,
  runtime: { bun: Bun.version, nodeCompatibility: process.version, platform: `${process.platform}/${process.arch}` },
  isolation: { ownedHome: true, explicitEmptyPiAuth: true, resourceDiscovery: false, retries: false, compaction: false, cacheWarming: false },
  artifacts: root, capture: [], framing: [], framingAttempts: [], live: [], liveStructuralAcceptance: false, issueAcceptance: false,
  missingEvidence: live ? ['real-model-materialized-attachment-read-back', 'native-tool-checkpoint'] :
    ['native-SDK-provider-model-acceptance', 'real-SDK-materialized-attachment-read-back', 'native-tool-checkpoint', 'live-ordinary-resume'],
}
let stage = 'package-identity', failure, fixture, relay, proxy, observer, activeSession, versionChild, interrupted = false
const sdkQueries = [], nativeChildren = [], allowedReads = new Set(), wire = [], toolEnds = []
const onInterrupt = () => { interrupted = true; versionChild?.kill(); void activeSession?.abort() }
process.on('SIGINT', onInterrupt); process.on('SIGTERM', onInterrupt)
const hash = value => createHash('sha256').update(value).digest('hex')
const text = blocks => typeof blocks === 'string' ? blocks : Array.isArray(blocks)
  ? blocks.filter(block => block?.type === 'text').map(block => block.text).join('\n') : ''
const images = blocks => Array.isArray(blocks) ? blocks.flatMap(block => block?.type === 'image' ? [block]
  : block?.type === 'tool_result' ? images(block.content) : []) : []
const wireImages = messages => messages.flatMap(message => images(message.content))
const count = (blocks, data) => images(blocks).filter(block => block.source?.data === data).length
const summarizeWire = body => ({ roles: body.messages.map(message => message.role),
  imageCounts: body.messages.map(message => images(message.content).length),
  currentImageCount: images(body.messages.at(-1)?.content).length,
  toolResultIds: body.messages.flatMap(message => Array.isArray(message.content)
    ? message.content.filter(block => block.type === 'tool_result').map(block => block.tool_use_id) : []),
  declaredTools: (body.tools ?? []).map(tool => tool.name), stream: body.stream, model: body.model })

function png(r, g, b) {
  const chunk = (type, data) => {
    const bytes = Buffer.concat([Buffer.from(type), data]); let crc = 0xffffffff
    for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1 }
    const size = Buffer.alloc(4); size.writeUInt32BE(data.length)
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
    return Buffer.concat([size, bytes, checksum])
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(48); header.writeUInt32BE(48, 4); header[8] = 8; header[9] = 2
  const row = Buffer.from([0, ...Array.from({ length: 48 }, () => [r, g, b]).flat()])
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: 48 }, () => row)))), chunk('IEND', Buffer.alloc(0))]).toString('base64')
}
const A = png(0, 0, 255), B = png(0, 255, 0), C = png(255, 0, 0)
const piImage = data => ({ type: 'image', data, mimeType: 'image/png' })
const marks = [0, 1, 2].map(n => `OWNED_CURRENT_${n}_${randomUUID()}`)

function sse(model, content) {
  const events = [['message_start', { type: 'message_start', message: { id: `msg_${randomUUID()}`, type: 'message', role: 'assistant',
    model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 20, output_tokens: 0 } } }]]
  for (const [index, block] of content.entries()) {
    events.push(['content_block_start', { type: 'content_block_start', index, content_block: block.type === 'tool_use'
      ? { ...block, input: {} } : { type: 'text', text: '' } }])
    events.push(['content_block_delta', { type: 'content_block_delta', index, delta: block.type === 'tool_use'
      ? { type: 'input_json_delta', partial_json: JSON.stringify(block.input) } : { type: 'text_delta', text: block.text } }])
    events.push(['content_block_stop', { type: 'content_block_stop', index }])
  }
  events.push(['message_delta', { type: 'message_delta', delta: { stop_reason: content.some(block => block.type === 'tool_use') ? 'tool_use' : 'end_turn',
    stop_sequence: null }, usage: { output_tokens: 10 } }], ['message_stop', { type: 'message_stop' }])
  return new Response(events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } })
}

try {
  const packageDir = realpathSync(packageDirInput)
  const metadata = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
  assert.equal(metadata.name, '@earendil-works/pi-coding-agent', 'Not actual Pi')
  assert.equal(metadata.version, expectedPiVersion, 'Pi version did not match explicit identity')
  const entry = join(packageDir, metadata.exports['.'].import)
  assert(existsSync(entry), 'Pi exported SDK unavailable: source quarantine, no substitute client')
  report.pi = { name: metadata.name, version: metadata.version, packageDir, entry, integration: 'exported createAgentSession / SessionManager / ModelRuntime' }
  const pi = await import(pathToFileURL(entry).href)
  for (const name of ['createAgentSession', 'SessionManager', 'ModelRuntime', 'SettingsManager', 'createExtensionRuntime', 'createReadToolDefinition'])
    assert(pi[name], `Required public Pi API unavailable: ${name}`)
  const resourceLoader = {
    getExtensions: () => ({ extensions: [], errors: [], runtime: pi.createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => 'This is an owned Pi image feedback fixture. Follow only the current request. Never read any files unless tools are declared.',
    getSystemPromptSource: () => undefined, getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [],
    extendResources: () => {}, reload: async () => {},
  }
  const settingsManager = pi.SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false, provider: { maxRetries: 0 } },
    cacheWarming: 'off', images: { autoResize: false }, enableInstallTelemetry: false })
  const readTool = pi.createReadToolDefinition(project, { autoResizeImages: false, operations: {
    access: async path => { assert(allowedReads.has(path), 'Only exact owned materialized fixture paths may be read') },
    readFile: async path => { assert(allowedReads.has(path), 'Read escaped owned fixtures'); return readFileSync(path) },
    detectImageMimeType: async path => { assert(allowedReads.has(path), 'MIME check escaped owned fixtures'); return 'image/png' },
  } })
  async function makeSession(manager, baseUrl, id, headers = {}, withRead = false) {
    assert(!interrupted, 'Interrupted before session admission')
    const modelsPath = join(agentDir, `models-${randomUUID()}.json`)
    writeFileSync(modelsPath, JSON.stringify({ providers: { 'owned-meridian-fixture': { api: 'anthropic-messages', baseUrl,
      apiKey: 'owned-loopback-placeholder', headers, models: [{ id, name: id, reasoning: false, input: ['text', 'image'],
        contextWindow: 200000, maxTokens: 512, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } }] } } }), { mode: 0o600 })
    const authPath = join(agentDir, `auth-${randomUUID()}.json`)
    writeFileSync(authPath, '{}', { mode: 0o600 })
    const modelRuntime = await pi.ModelRuntime.create({ authPath, modelsPath, allowModelNetwork: false })
    const model = modelRuntime.getModel('owned-meridian-fixture', id)
    assert(model && model.baseUrl === baseUrl, 'Pi did not load the exact owned loopback model route')
    const created = await pi.createAgentSession({ cwd: project, agentDir, modelRuntime, model, thinkingLevel: 'off', resourceLoader,
      sessionManager: manager, settingsManager, tools: withRead ? ['read'] : [], customTools: withRead ? [readTool] : [] })
    assert.equal(created.extensionsResult.extensions.length, 0, 'Unexpected Pi extension loaded')
    assert.deepEqual(created.session.getActiveToolNames(), withRead ? ['read'] : [])
    return created.session
  }
  async function prompt(session, message, attached = []) {
    assert(!interrupted, 'Interrupted before model admission')
    activeSession = session
    const deadline = setTimeout(() => { void session.abort() }, live ? 120000 : 20000)
    try {
      await session.prompt(message, { images: attached })
      await session.waitForIdle()
      assert(!interrupted, 'Interrupted during prompt')
      const last = session.messages.filter(row => row.role === 'assistant').at(-1)
      assert(last && !['error', 'aborted'].includes(last.stopReason), 'Pi prompt did not complete successfully')
    } finally { clearTimeout(deadline); activeSession = undefined }
  }
  stage = 'actual-Pi-capture'
  let round = 0, roundRequests = 0, control
  const controlRequests = []
  const fixtureErrors = []
  fixture = Bun.serve({ hostname: '127.0.0.1', port: 0, idleTimeout: 30, async fetch(request) {
    try {
      assert.equal(new URL(request.url).pathname, '/v1/messages', 'Unexpected Pi endpoint')
      assert.equal(request.method, 'POST'); assert(++roundRequests <= 2, 'Unbounded Pi fixture requests')
      const body = await request.json(); assert.equal(body.stream, true)
      wire.push(structuredClone(body))
      if (control) {
        assert.equal(roundRequests, 1, 'Unexpected control continuation')
        assert.equal(wireImages(body.messages).filter(block => block.source?.data === A).length,
          4 + control.data.filter(data => data === A).length, 'Control rewrote historical/current A')
        assert.equal(wireImages(body.messages).filter(block => block.source?.data === B).length, 1)
        assert.equal(images(body.messages.at(-1).content).length, control.data.length, 'Actual Pi current control lost media')
        assert(text(body.messages.at(-1).content).includes(control.marker))
        assert.equal(body.tools?.length ?? 0, 0, 'Unexpected control tool loadout')
        return sse(body.model, [{ type: 'text', text: 'Owned scripted current-media control completed.' }])
      }
      const aCopies = wireImages(body.messages).filter(block => block.source?.data === A).length
      const bCopies = wireImages(body.messages).filter(block => block.source?.data === B).length
      assert.equal(bCopies, 1, 'Distinct historical image was lost')
      assert(text(body.messages.at(-1).content).includes(marks[round]) || roundRequests === 2, 'Current marker missing')
      if (roundRequests === 1 && round < 2) {
        assert.equal(aCopies, 2 ** round, 'Client feedback input count changed')
        assert(body.tools.some(tool => tool.name === 'read'), 'Actual Pi read was not declared')
        const content = Array.from({ length: aCopies }, (_, index) => {
          const path = join(project, `script-materialized-${round}-${index}.png`)
          writeFileSync(path, Buffer.from(A, 'base64'), { mode: 0o600 }); allowedReads.add(path)
          return { type: 'tool_use', id: `toolu_owned_${round}_${index}`, name: 'read', input: { path } }
        })
        return sse(body.model, content)
      }
      assert.equal(aCopies, round < 2 ? 2 ** (round + 1) : 4, 'Actual Pi read-back did not persist matching image bytes')
      return sse(body.model, [{ type: 'text', text: 'Owned scripted fixture completed.' }])
    } catch (error) {
      fixtureErrors.push(error instanceof assert.AssertionError ? error.message : 'fixture-I/O-failed')
      return Response.json({ error: { type: 'api_error', message: 'Owned fixture failed' } }, { status: 500 })
    }
  } })
  const zeroUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }
  const seedAssistant = () => ({ role: 'assistant', api: 'anthropic-messages', provider: 'owned-meridian-fixture', model: 'owned-scripted-image-fixture',
    content: [{ type: 'text', text: 'Owned historical image recorded.' }], stopReason: 'stop', usage: structuredClone(zeroUsage), timestamp: Date.now() })
  let manager = pi.SessionManager.create(project, piSessions)
  manager.appendMessage({ role: 'user', content: [{ type: 'text', text: 'OWNED_HISTORICAL_A' }, piImage(A)], timestamp: Date.now() })
  manager.appendMessage(seedAssistant())
  manager.appendMessage({ role: 'user', content: [{ type: 'text', text: 'OWNED_DISTINCT_HISTORICAL_B' }, piImage(B)], timestamp: Date.now() })
  manager.appendMessage(seedAssistant())
  const firstRequests = []
  for (round = 0; round < 3; round++) {
    roundRequests = 0
    const session = await makeSession(manager, `http://127.0.0.1:${fixture.port}`, 'owned-scripted-image-fixture', {}, true)
    const unsubscribe = session.subscribe(event => {
      if (event.type === 'tool_execution_end') toolEnds.push({ id: event.toolCallId, name: event.toolName, isError: event.isError,
        exactA: (event.result?.content ?? []).some(block => block.type === 'image' && block.data === A && block.mimeType === 'image/png') })
    })
    const start = wire.length
    try { activeSession = session; await prompt(session, `This current turn is text only. ${marks[round]}`) }
    finally { unsubscribe(); await session.abort(); await session.waitForIdle(); session.dispose(); activeSession = undefined }
    assert.deepEqual(fixtureErrors, [], 'Scripted endpoint failed')
    assert.equal(roundRequests, round < 2 ? 2 : 1)
    const first = wire[start]; firstRequests.push(first)
    assert.equal(images(first.messages.at(-1).content).length, 0)
    report.capture.push({ round, route: 'POST /v1/messages -> scripted loopback SSE', historicalACopies: 2 ** round,
      distinctBCopies: 1, ...summarizeWire(first), persistedReadResults: round < 2 ? 2 ** round : 0 })
    const file = manager.getSessionFile(); assert(file, 'Actual Pi session was not file-backed')
    const before = manager.buildSessionContext().messages
    manager = pi.SessionManager.open(file, piSessions, project)
    // JSON persistence legitimately omits undefined optional fields.
    assert.equal(JSON.stringify(manager.buildSessionContext().messages), JSON.stringify(before), 'Public Pi reopen changed persisted model history')
  }
  assert.equal(toolEnds.length, 3)
  assert(toolEnds.every(row => row.name === 'read' && !row.isError && row.exactA), 'Actual Pi controller/read did not execute owned image calls')
  const persisted = manager.buildSessionContext().messages
  assert.equal(persisted.filter(row => row.role === 'toolResult').length, 3)
  assert(persisted.filter(row => row.role === 'toolResult').every(row => row.content.some(block => block.type === 'image' && block.data === A)))
  report.readWitness = { tool: 'exported Pi createReadToolDefinition with owned-path operations', calls: toolEnds,
    persistence: 'SessionManager.create -> actual controller message entries -> SessionManager.open -> buildSessionContext',
    feedbackACounts: [1, 2, 4], materialization: 'scripted endpoint owned copies, NOT SDK attachment files' }
  report.fixtures = { mime: 'image/png', hashEncoding: 'sha256-of-canonical-base64', A: hash(A), distinctB: hash(B), differentCurrentC: hash(C), dimensions: [48, 48] }
  report.captureControls = []
  for (const [arm, data] of [['same-byte-current', [A]], ['different-current', [C]], ['two-same-current', [A, A]]]) {
    control = { arm, data, marker: `OWNED_CAPTURE_CONTROL_${randomUUID()}` }
    roundRequests = 0
    const controlManager = pi.SessionManager.create(project, piSessions)
    for (const row of persisted) if (row.role !== 'system') controlManager.appendMessage(structuredClone(row))
    const sourceEntries = JSON.stringify(controlManager.getEntries())
    const session = await makeSession(controlManager, `http://127.0.0.1:${fixture.port}`, 'owned-scripted-image-fixture')
    const start = wire.length
    try { activeSession = session; await prompt(session, `This is a genuine current-media control. ${control.marker}`, data.map(piImage)) }
    finally { await session.abort(); await session.waitForIdle(); session.dispose(); activeSession = undefined }
    assert.deepEqual(fixtureErrors, [], 'Scripted control endpoint failed')
    assert.equal(roundRequests, 1)
    const body = wire[start]
    controlRequests.push({ arm, data, marker: control.marker, body })
    report.captureControls.push({ arm, route: 'actual Pi prompt(images) -> POST /v1/messages -> scripted loopback SSE', ...summarizeWire(body) })
    const originalEntries = JSON.parse(sourceEntries)
    assert.equal(JSON.stringify(controlManager.getEntries().slice(0, originalEntries.length)), sourceEntries, 'Control rewrote historical Pi entries')
  }
  await fixture.stop(true); fixture = undefined

  stage = 'production-framing'
  const replayPath = join(sourceRoot, 'src/proxy/replay.ts')
  if (existsSync(replayPath)) {
    const replay = await import(pathToFileURL(replayPath).href)
    report.productionImport = { root: sourceRoot, module: replayPath, moduleSha256: hash(readFileSync(replayPath)), functions: ['normalizeStructuredUserContent', 'flattenAssistantContent', 'frameStructuredReplay'],
      scope: 'production pure import fed real Pi wire; NOT full HTTP/SDK acceptance' }
    function frame(body) {
      const original = JSON.stringify(body)
      const turns = body.messages.map(row => ({ type: 'user', message: { role: 'user', content: row.role === 'assistant'
        ? replay.flattenAssistantContent(row.content) : replay.normalizeStructuredUserContent(row.content) } }))
      const result = replay.frameStructuredReplay(turns)[0].message.content
      assert.equal(JSON.stringify(body), original, 'Framing mutated captured client source')
      for (const id of summarizeWire(body).toolResultIds) assert(text(result).includes(id), 'Framing lost actual Pi read-result identity')
      return result
    }
    function check(blocks, marker, historicalA, currentData) {
      assert(Array.isArray(blocks), 'Replay must remain structured')
      const close = blocks.findIndex(block => block.type === 'text' && block.text.includes('</conversation_history>'))
      const current = blocks.findIndex(block => block.type === 'text' && block.text.includes(marker))
      assert(close >= 0 && current >= close, 'Current turn crossed history boundary')
      const history = blocks.slice(0, close), now = blocks.slice(close)
      // Keep the actual/expected facts even when a baseline RED throws here.
      report.framingAttempts.push({ sourceHistoricalACopies: historicalA, expectedHistoricalACopies: expect === 'candidate' ? 1 : historicalA,
        observedHistoricalACopies: count(history, A), expectedCurrentImages: currentData.length, observedCurrentImages: images(now).length,
        sourceImmutable: true, toolResultIdentityPreserved: true })
      assert(images(blocks).every(block => block.source?.type === 'base64' && block.source.media_type === 'image/png'), 'PNG source/MIME changed')
      assert.equal(count(history, A), expect === 'candidate' ? 1 : historicalA, 'Historical exact-image count')
      assert.equal(count(history, B), 1, 'Distinct historical image count')
      assert.equal(images(now).length, currentData.length, 'Current media count changed')
      for (const data of currentData) assert.equal(count(now, data), currentData.filter(value => value === data).length, 'Current bytes changed')
      const allText = text(blocks)
      assert(allText.includes(`current client turn contains exactly ${currentData.length} ${currentData.length === 1 ? 'image' : 'images'}`), 'Current provenance missing')
      assert(allText.includes(`Earlier replayed turns contain ${historicalA + 1} images`), 'Historical source provenance changed')
      assert(allText.includes('OWNED_HISTORICAL_A') && allText.includes('OWNED_DISTINCT_HISTORICAL_B'), 'Historical text lost')
      if (expect === 'candidate' && historicalA > 1) assert(allText.includes('Historical image reference:'), 'Visual reference missing')
      return { historicalA: count(history, A), historicalB: count(history, B), currentImages: images(now).length, closeIndex: close, currentIndex: current }
    }
    for (const [index, body] of firstRequests.entries()) report.framing.push({ arm: `feedback-${index}`, ...check(frame(body), marks[index], 2 ** index, []) })
    for (const { arm, data, marker, body } of controlRequests)
      report.framing.push({ arm, ...check(frame(body), marker, 4, data) })
  } else {
    assert(live, 'Capture production check requires sourceRoot/src/proxy/replay.ts; installed bundle is live-only')
    report.missingEvidence.push('installed-package-pure-framing-import')
  }

  if (live) {
    stage = 'live-preflight'
    assert.equal(statSync(profileFile).mode & 0o077, 0, 'Explicit live profile file must be private')
    const profiles = JSON.parse(readFileSync(profileFile, 'utf8'))
    assert(Array.isArray(profiles) && profiles.length === 1 && profiles[0].type === 'oauth-token'
      && /^[a-z0-9_-]{1,80}$/i.test(profiles[0].id) && typeof profiles[0].oauthToken === 'string' && profiles[0].oauthToken
      && Object.keys(profiles[0]).every(key => ['id', 'name', 'type', 'oauthToken'].includes(key)),
    'Require exactly one explicit OAuth-token profile without environment/endpoint overrides')
    versionChild = Bun.spawn([nativeBin, '--version'], { env: process.env, stdout: 'pipe', stderr: 'pipe' })
    let version, stderr, code, versionTimedOut = false
    const versionDeadline = setTimeout(() => { versionTimedOut = true; versionChild?.kill('SIGKILL') }, 10000)
    try {
      [version, stderr, code] = await Promise.all([new Response(versionChild.stdout).text(), new Response(versionChild.stderr).text(), versionChild.exited])
    } finally { clearTimeout(versionDeadline); versionChild = undefined }
    assert(!versionTimedOut && !interrupted, 'Native version preflight timed out/interrupted')
    assert.equal(code, 0); assert(!stderr.trim()); assert(/^\d+\.\d+\.\d+ \(Claude Code\)\s*$/.test(version), 'Explicit executable is not native Claude Code')
    report.runtime.claude = version.trim()
    report.nativeVersionPreflight = { exactEntry: realpathSync(nativeBin), exit: code, bothPipesJoined: true, timedOut: false }
    process.env.MERIDIAN_CLAUDE_PATH = nativeBin
    const require = createRequire(join(sourceRoot, 'package.json'))
    const sdkPath = require.resolve('@anthropic-ai/claude-agent-sdk')
    const sdk = await import(pathToFileURL(sdkPath).href)
    assert.equal(typeof sdk.getSessionMessages, 'function', 'Supported SDK history API missing')
    report.sdk = { version: JSON.parse(readFileSync(join(dirname(sdkPath), 'package.json'), 'utf8')).version, entry: sdkPath }
    const { spyOn } = await import('bun:test')
    const originalQuery = sdk.query, queryFacts = []
    observer = spyOn(sdk, 'query').mockImplementation(input => {
      assert(live && !interrupted, 'Live admission revoked')
      assert(queryFacts.length < 4, 'Exceeded four explicitly allowed live SDK queries')
      const configDir = input.options?.env?.CLAUDE_CONFIG_DIR ?? process.env.CLAUDE_CONFIG_DIR
      const cwd = input.options?.cwd ?? project
      assert(configDir?.startsWith(root + '/') && cwd.startsWith(root + '/'), 'Native SDK config/workdir escaped owned isolation')
      queryFacts.push({ resume: Boolean(input.options?.resume), checkpoint: Boolean(input.options?.resumeSessionAt), sessionId: input.options?.sessionId,
        configDir, cwd })
      const originalSpawn = input.options?.spawnClaudeCodeProcess
      assert.equal(typeof originalSpawn, 'function', 'Live proof requires the production-owned native spawn boundary')
      const options = { ...input.options, spawnClaudeCodeProcess(spawnOptions) {
        const child = originalSpawn(spawnOptions)
        assert(child instanceof ChildProcess, 'Native join observer requires the exact production ChildProcess')
        assert(child.stdout && child.stderr, 'Native join observer requires both captured pipes')
        const fact = { originalClose: false, stdoutClosed: child.stdout.closed, stderrClosed: child.stderr.closed }
        child.once('close', () => { fact.originalClose = true })
        child.stdout.once('close', () => { fact.stdoutClosed = true })
        child.stderr.once('close', () => { fact.stderrClosed = true })
        nativeChildren.push(fact)
        return child
      } }
      const query = originalQuery({ ...input, options }); sdkQueries.push(query); return query
    })
    const sourceEntry = join(sourceRoot, 'src/proxy/server.ts')
    const serverEntry = existsSync(sourceEntry) ? sourceEntry : join(sourceRoot, 'dist/server.js')
    const { startProxyServer } = await import(pathToFileURL(serverEntry).href)
    report.liveRoute = { root: sourceRoot, entry: serverEntry, route: 'actual Pi POST /v1/messages -> owned relay -> production Meridian -> original SDK.query', model: modelId }
    writeFileSync(join(root, 'plugins.json'), JSON.stringify({ plugins: [] }), { mode: 0o600 })
    proxy = await startProxyServer({ port: 0, host: '127.0.0.1', silent: true, profiles,
      defaultProfile: profiles[0].id, pluginDir: join(root, 'plugins'), pluginConfigPath: join(root, 'plugins.json') })
    const proxyPort = proxy.server.address().port
    let currentRequests = []
    relay = Bun.serve({ hostname: '127.0.0.1', port: 0, idleTimeout: 150, async fetch(request) {
      assert(!interrupted, 'Live relay admission revoked')
      assert.equal(new URL(request.url).pathname, '/v1/messages'); assert.equal(request.method, 'POST')
      const raw = await request.text(), body = JSON.parse(raw)
      currentRequests.push(structuredClone(body)); assert(currentRequests.length <= 1, 'Live client unexpectedly queried again')
      const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/messages`, { method: 'POST', headers: request.headers, body: raw, signal: AbortSignal.timeout(120000) })
      assert.equal(response.status, 200, 'Production HTTP did not accept live request')
      return response
    } })
    async function history(id) {
      assert(id, 'Original SDK query did not identify exact native session')
      const query = queryFacts.at(-1)
      const previousConfig = process.env.CLAUDE_CONFIG_DIR
      try {
        // Public SDK history takes dir, not configDir. Use the exact original
        // query's isolated environment, never discover/read private transcripts.
        process.env.CLAUDE_CONFIG_DIR = query.configDir
        for (let attempt = 0; attempt < 5; attempt++) {
          const rows = await sdk.getSessionMessages(id, { dir: query.cwd })
          if (rows.some(row => row.type === 'user') && rows.some(row => row.type === 'assistant')) return rows
          await Bun.sleep(200)
        }
        throw new Error('Supported SDK history did not publish exact live session')
      } finally {
        if (previousConfig === undefined) delete process.env.CLAUDE_CONFIG_DIR
        else process.env.CLAUDE_CONFIG_DIR = previousConfig
      }
    }
    for (const [arm, currentData] of [['text-only', []], ['same-byte-current', [A]], ['different-current', [C]]]) {
      stage = `live-${arm}`
      const liveManager = pi.SessionManager.create(project, piSessions)
      for (const row of persisted) if (row.role !== 'system') liveManager.appendMessage(structuredClone(row))
      const sourceEntries = structuredClone(liveManager.getEntries())
      const marker = `OWNED_LIVE_CURRENT_${randomUUID()}`, affinity = `owned-pi-${randomUUID()}`
      currentRequests = []
      const session = await makeSession(liveManager, `http://127.0.0.1:${relay.port}`, modelId,
        { 'x-meridian-agent': 'pi', 'x-session-affinity': affinity, 'x-meridian-profile': profiles[0].id })
      try {
        activeSession = session
        const queryStart = queryFacts.length
        await prompt(session, `Acknowledge this current turn briefly without tools. ${marker}`, currentData.map(piImage))
        assert.equal(queryFacts.length, queryStart + 1); assert.equal(queryFacts.at(-1).resume, false)
        assert.equal(currentRequests.length, 1)
        assert.equal(wireImages(currentRequests[0].messages).filter(block => block.source?.data === A).length, 4 + currentData.filter(data => data === A).length)
        assert.equal(images(currentRequests[0].messages.at(-1).content).length, currentData.length)
        const id = queryFacts.at(-1).sessionId, rows = await history(id)
        const blocks = rows.find(row => row.type === 'user').message.content
        assert(Array.isArray(blocks))
        // Installed-package live arms use the same structural assertions, without
        // importing a different source tree's framing implementation.
        const close = blocks.findIndex(block => block.type === 'text' && block.text.includes('</conversation_history>'))
        const now = blocks.slice(close)
        assert(close >= 0 && text(now).includes(marker), 'Live SDK current boundary missing')
        assert.equal(count(blocks.slice(0, close), A), expect === 'candidate' ? 1 : 4)
        assert.equal(count(blocks.slice(0, close), B), 1)
        assert.equal(images(now).length, currentData.length)
        for (const data of currentData) assert.equal(count(now, data), 1)
        assert(text(blocks).includes(`current client turn contains exactly ${currentData.length} ${currentData.length ? 'image' : 'images'}`))
        assert(text(blocks).includes('Earlier replayed turns contain 5 images'))
        for (const call of toolEnds) assert(text(blocks).includes(call.id), 'Live replay lost actual Pi read identity')
        if (expect === 'candidate') assert(text(blocks).includes('Historical image reference:'))
        const actualModels = [...new Set(rows.filter(row => row.type === 'assistant').map(row => row.message?.model).filter(Boolean))]
        assert(actualModels.length && actualModels.every(model => model === modelId), 'SDK assistant metadata did not identify the selected implicated model')
        const telemetryResponse = await fetch(`http://127.0.0.1:${proxyPort}/telemetry/requests?limit=1`)
        assert.equal(telemetryResponse.status, 200)
        const metric = (await telemetryResponse.json())[0]
        assert.equal(metric.adapter, 'pi'); assert.equal(metric.lineageType, 'new')
        report.live.push({ arm, sdkHistoricalA: count(blocks.slice(0, close), A), sdkDistinctB: 1, sdkCurrentImages: images(now).length,
          actualModels, adapter: metric.adapter, lineage: metric.lineageType, clientWire: summarizeWire(currentRequests[0]) })
        if (arm === 'text-only') {
          const sourceHistory = structuredClone(rows), oldId = id
          currentRequests = []
          await prompt(session, `Acknowledge the follow-up briefly without tools. OWNED_RESUME_${randomUUID()}`, [piImage(A), piImage(A)])
          assert.equal(queryFacts.length, queryStart + 2); assert(queryFacts.at(-1).resume && !queryFacts.at(-1).checkpoint)
          const continued = await history(queryFacts.at(-1).sessionId ?? oldId)
          assert.deepEqual(continued.slice(0, sourceHistory.length), sourceHistory, 'Ordinary resume rewrote existing supported SDK history')
          const delta = continued.filter(row => row.type === 'user').at(-1).message.content
          assert.equal(count(delta, A), 2, 'Ordinary resume delta deduplicated genuine current images')
          report.ordinaryResume = { supportedHistoryPrefixImmutable: true, currentIdenticalACopies: 2, nativeCheckpoint: false }
        }
        assert.deepEqual(liveManager.getEntries().slice(0, sourceEntries.length), sourceEntries, 'Live request rewrote persisted Pi source entries')
      } finally { await session.abort(); await session.waitForIdle(); session.dispose(); activeSession = undefined }
    }
    report.liveStructuralAcceptance = true
  } else report.liveStructuralAcceptance = false
} catch (error) {
  failure = error
  // AssertionError.message can include a raw deepEqual transcript/base64 diff.
  // Never serialize it, even though this run is supposed to own all fixtures.
  report.failure = { stage, name: error.name, operator: error instanceof assert.AssertionError ? error.operator : undefined,
    message: 'Gate failed; raw exception/transcript diagnostics deliberately withheld' }
} finally {
  const cleanup = await Promise.allSettled([
    (async () => { if (activeSession) { await activeSession.abort(); await activeSession.waitForIdle(); activeSession.dispose(); activeSession = undefined } })(),
    (async () => { if (versionChild) { versionChild.kill(); await versionChild.exited; versionChild = undefined } })(),
    (async () => { await relay?.stop(true) })(), (async () => { await fixture?.stop(true) })(),
    (async () => {
      await proxy?.close()
      for (const query of sdkQueries) query.close()
      if (live && sdkQueries.length) {
        const deadline = Date.now() + 5000
        const joined = () => nativeChildren.length > 0 && nativeChildren.every(fact =>
          fact.originalClose && fact.stdoutClosed && fact.stderrClosed)
        while (!joined() && Date.now() < deadline) await Bun.sleep(20)
        assert(joined(), 'Original native close and both captured pipes remain unproven; retain all fixtures')
      }
    })(),
  ])
  observer?.mockRestore()
  process.removeListener('SIGINT', onInterrupt); process.removeListener('SIGTERM', onInterrupt)
  report.cleanup = { ownedPiSessionsSettledAndDisposed: !activeSession, ownedServersClosed: cleanup.every(row => row.status === 'fulfilled'),
    sdkQueries: sdkQueries.length, nativeChildJoins: nativeChildren,
    nativeProcessCustody: live ? 'Observed production original ChildProcess close plus both captured pipe closures; no whole-OS custody claim' : 'no native CLI/SDK query started' }
  if (cleanup.some(row => row.status === 'rejected')) {
    failure ??= new Error('Owned cleanup failed'); report.cleanupFailed = true; report.liveStructuralAcceptance = false
    report.missingEvidence.push('joined-owned-cleanup')
  }
  report.result = failure ? 'FAIL' : 'PASS'
  writeFileSync(join(root, 'report.json'), JSON.stringify(report, null, 2), { mode: 0o600 })
  console.log(JSON.stringify(report))
}
if (failure) process.exitCode = 1
