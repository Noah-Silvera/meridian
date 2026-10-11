import { beforeEach, describe, expect, it } from "bun:test"
import { installSdkMock } from "./sdkMock"
import { installLoggerMock } from "./loggerMock"
import { installMcpToolsMock } from "./mcpToolsMock"
import { assistantMessage, messageStart, textBlockStart, textDelta, blockStop, messageDelta, messageStop, withMockSdkSessionId } from "./helpers"

type Input = {
  prompt: string | AsyncIterable<{ message: { content: unknown } }>
  options?: { sessionId?: string; resume?: string }
}
const captured: Array<{ blocks: unknown[]; inputs: number; resume?: string }> = []
installSdkMock(() => ({
  query: (input: Input) => (async function* () {
    const blocks: unknown[] = []
    let inputs = 0
    if (typeof input.prompt === "string") throw new Error("image replay must be structured")
    for await (const row of input.prompt) {
      inputs++
      if (!Array.isArray(row.message.content)) throw new Error("image replay must contain blocks")
      blocks.push(...row.message.content)
    }
    captured.push({ blocks, inputs, resume: input.options?.resume })
    for (const event of [messageStart(), textBlockStart(0), textDelta(0, "ok"), blockStop(0), messageDelta(), messageStop(), assistantMessage([{ type: "text", text: "ok" }])]) {
      yield withMockSdkSessionId(event, input.options)
    }
  })(),
  createSdkMcpServer: () => ({ type: "sdk", name: "test", instance: {} }),
  tool: () => ({}),
}), "proxy-image-replay-dedup.test.ts")
installLoggerMock(() => ({ claudeLog: () => {}, withClaudeLogContext: (_context: unknown, fn: () => unknown) => fn() }))
installMcpToolsMock(() => ({ createOpencodeMcpServer: () => ({ type: "sdk", name: "opencode", instance: {} }) }))
const { createProxyServer, clearSessionCache } = await import("../proxy/server")

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
function textOf(value: unknown): string {
  return record(value) && typeof value.text === "string" ? value.text : ""
}
function imageBlocks(values: unknown[]): unknown[] {
  return values.filter(value => record(value) && value.type === "image")
}

// Synthetic bytes test exact outbound layout, not native image decoding/model
// behavior. Actual SDK/client acceptance is escrowed separately, not mocked here.
const historical = { type: "image", source: {
  type: "base64", media_type: "image/png", data: Buffer.from("historic-pixels").toString("base64"),
} }
const distinct = { ...historical, source: { ...historical.source, data: Buffer.from("distinct-pixels").toString("base64") } }

describe("fresh Pi image replay through HTTP", () => {
  beforeEach(async () => { captured.length = 0; await clearSessionCache() })
  for (const stream of [false, true]) for (const currentImages of [false, true]) {
    it(`emits one historical visual, retaining result identity and current media (stream=${stream}, current=${currentImages})`, async () => {
      const { app } = createProxyServer({ silent: true })
      const messages = [
        { role: "user", content: [{ type: "text", text: "ORIGINAL_CONTEXT" }, historical, distinct] },
        { role: "assistant", content: [{ type: "tool_use", id: "read-history", name: "read", input: { path: "/owned-fixture/image.png" } }] },
        { role: "user", content: [{ type: "tool_result", tool_use_id: "read-history", is_error: false,
          content: [{ type: "text", text: "RECORDED_READ_TEXT" }, structuredClone(historical)] }] },
        { role: "assistant", content: [{ type: "text", text: "EARLIER_ANSWER" }] },
        { role: "user", content: [{ type: "text", text: "CURRENT_TURN" },
          ...(currentImages ? [structuredClone(historical), structuredClone(historical), distinct] : [])] },
      ]
      const before = structuredClone(messages)
      const response = await app.fetch(new Request("http://localhost/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-meridian-agent": "pi", "x-session-affinity": crypto.randomUUID() },
        body: JSON.stringify({ model: "haiku", messages, stream }),
      }))
      const body = await response.text()
      expect(response.status, body).toBe(200)
      if (stream) { expect(body).toContain("event: message_stop"); expect(body).not.toContain("event: error") }
      expect(captured).toHaveLength(1)
      const input = captured[0]!
      expect(input.inputs).toBe(1)
      expect(input.resume).toBeUndefined()
      const boundary = input.blocks.findIndex(block => textOf(block).includes("</conversation_history>"))
      expect(boundary).toBeGreaterThan(0)
      expect(imageBlocks(input.blocks.slice(0, boundary))).toEqual([historical, distinct])
      expect(imageBlocks(input.blocks.slice(boundary))).toEqual(currentImages ? [historical, historical, distinct] : [])
      const text = input.blocks.map(textOf).join("\n")
      for (const marker of ["ORIGINAL_CONTEXT", "RECORDED_READ_TEXT", "EARLIER_ANSWER", "CURRENT_TURN", '"tool_use_id":"read-history"', '"is_error":false', "historical visual #1", "Earlier replayed turns contain 3 images"]) {
        expect(text).toContain(marker)
      }
      expect(text).toContain(`current client turn contains exactly ${currentImages ? "3 images" : "0 images"}`)
      expect(messages).toEqual(before)
    })
  }
})
