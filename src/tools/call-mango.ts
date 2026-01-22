import type { PluginInput } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { callAgent } from "../utils/call-agent"
import { canCall, getCallableTargets, type AgentId } from "../permissions"

/**
 * 에이전트별 한글 설명
 * 
 * plan-mango용 call_mango_plan 도구:
 * - call_mango_plan 도구를 사용하여 실행/어댑터 계층 에이전트를 호출합니다
 * - 호출 가능 대상: research-mango, build-mango, issue-mango, pr-mango
 * 
 * coach-mango용 call_mango_coach 도구:
 * - call_mango_coach 도구를 사용하여 실행/어댑터 계층 에이전트를 호출합니다  
 * - 호출 가능 대상: research-mango, build-mango, issue-mango, pr-mango
 */
const AGENT_DESCRIPTIONS: Record<string, string> = {
  "research-mango": "리서치 망고에게 정보 조사/탐색 요청",
  "build-mango": "빌드 망고에게 코드 작업 요청",
  "issue-mango": "이슈 망고에게 이슈 생성/수정 요청",
  "pr-mango": "PR 망고에게 PR 생성/머지 요청",
}

/**
 * 동적으로 호출 가능한 에이전트 목록을 enum으로 생성
 */
function createAgentEnum(callableTargets: AgentId[]) {
  return callableTargets.reduce((acc, target) => {
    acc[target] = target
    return acc
  }, {} as Record<string, string>)
}

/**
 * ctx와 callerAgent를 받아서 call_mango 도구를 생성하는 팩토리 함수
 * @param ctx MCP 컨텍스트
 * @param callerAgent 호출하는 에이전트 ID
 */
export function createCallMango(ctx: PluginInput, callerAgent: AgentId) {
  const callableTargets = getCallableTargets(callerAgent)
  
  // 호출 가능한 대상이 없는 경우 빈 도구 반환
  if (callableTargets.length === 0) {
    return tool({
      description: "호출 권한이 없습니다",
      args: {
        agent: tool.schema.enum([]).describe("호출할 에이전트 (권한 없음)"),
        prompt: tool.schema.string().describe("작업 요청 내용"),
      },
      execute: async () => {
        return `Error: ${callerAgent}는 다른 에이전트를 호출할 권한이 없습니다.`
      },
    })
  }

  // 동적으로 agent enum 생성
  const agentEnum = createAgentEnum(callableTargets)
  
  return tool({
    description: `다른 망고 에이전트에게 작업 요청 (${callerAgent}용)`,
    args: {
      agent: tool.schema.enum(Object.keys(agentEnum)).describe(
        `호출할 에이전트: ${callableTargets.map(target => 
          `${target} (${AGENT_DESCRIPTIONS[target] || "작업 요청"})`
        ).join(", ")}`
      ),
      prompt: tool.schema.string().describe("작업 요청 내용"),
    },
    execute: async ({ agent, prompt }, toolContext) => {
      // 권한 검증
      if (!canCall(callerAgent, agent as AgentId)) {
        return `Error: ${callerAgent}는 ${agent}를 호출할 권한이 없습니다.`
      }

      // 에이전트 호출
      return await callAgent(
        ctx,
        { sessionID: toolContext.sessionID },
        agent,
        prompt
      )
    },
  })
}