import type { PluginInput } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { callAgent } from "../utils/call-agent"

export function createCallBuildMango(ctx: PluginInput) {
  return tool({
    description: "빌드 망고에게 코드 작업 요청",
    args: {
      prompt: tool.schema.string().describe("작업 요청 내용"),
    },
    execute: async ({ prompt }, toolContext) => {
      return await callAgent(
        ctx,
        { sessionID: toolContext.sessionID },
        "build-mango",
        prompt
      )
    },
  })
}
