import type { PluginInput } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { callAgent } from "../utils/call-agent"

/**
 * ctx를 받아서 call_research_mango 도구를 생성하는 팩토리 함수
 */
export function createCallResearchMango(ctx: PluginInput) {
  return tool({
    description: "리서치 망고에게 정보 조사/탐색 요청",
    args: {
      prompt: tool.schema.string().describe("조사 요청 내용"),
    },
    execute: async ({ prompt }, toolContext) => {
      return await callAgent(
        ctx,
        { sessionID: toolContext.sessionID },
        "research-mango",
        prompt
      )
    },
  })
}
