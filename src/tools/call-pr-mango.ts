import type { PluginInput } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { callAgent } from "../utils/call-agent"

export function createCallPrMango(ctx: PluginInput) {
  return tool({
    description: "PR 망고에게 PR 생성/머지 요청",
    args: {
      prompt: tool.schema.string().describe("작업 요청 내용"),
    },
    execute: async ({ prompt }, toolContext) => {
      return await callAgent(
        ctx,
        { sessionID: toolContext.sessionID },
        "pr-mango",
        prompt
      )
    },
  })
}