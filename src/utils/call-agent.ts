import type { PluginInput } from "@opencode-ai/plugin"

const POLL_INTERVAL_MS = 500
const MAX_POLL_TIME_MS = 5 * 60 * 1000 // 5 minutes
const STABILITY_REQUIRED = 3

/**
 * 서브에이전트를 동기적으로 호출하고 결과를 반환합니다.
 *
 * @param ctx - 플러그인 입력 컨텍스트
 * @param toolContext - 현재 세션 정보
 * @param agentName - 호출할 에이전트 이름
 * @param prompt - 에이전트에게 전달할 프롬프트
 * @returns 에이전트의 응답 텍스트
 */
export async function callAgent(
  ctx: PluginInput,
  toolContext: { sessionID: string },
  agentName: string,
  prompt: string
): Promise<string> {
  // 1. 세션 생성
  const createResult = await ctx.client.session.create({
    body: {
      parentID: toolContext.sessionID,
      title: `@${agentName} subagent`,
    },
    query: {
      directory: ctx.directory,
    },
  })

  if (createResult.error) {
    return `Error: 세션 생성 실패: ${createResult.error}`
  }

  const sessionID = createResult.data.id

  // 2. 프롬프트 전송 (task: false로 재귀 방지)
  try {
    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        agent: agentName,
        model: {
          providerID: "anthropic",
          modelID: "claude-sonnet-4-20250514",
        },
        tools: {
          task: false,
        },
        parts: [{ type: "text", text: prompt }],
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return `Error: 프롬프트 전송 실패: ${errorMessage}`
  }

  // 3. 응답 폴링 (세션 완료 대기)
  const pollStart = Date.now()
  let lastMsgCount = 0
  let stablePolls = 0

  while (Date.now() - pollStart < MAX_POLL_TIME_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    // 세션 상태 확인
    const statusResult = await ctx.client.session.status()
    const allStatuses = (statusResult.data ?? {}) as Record<string, { type: string }>
    const sessionStatus = allStatuses[sessionID]

    // 세션이 아직 실행 중이면 계속 대기
    if (sessionStatus && sessionStatus.type !== "idle") {
      stablePolls = 0
      lastMsgCount = 0
      continue
    }

    // 세션이 idle 상태면 메시지 안정성 확인
    const messagesCheck = await ctx.client.session.messages({ path: { id: sessionID } })
    const msgs = ((messagesCheck as { data?: unknown }).data ?? messagesCheck) as Array<unknown>
    const currentMsgCount = msgs.length

    if (currentMsgCount > 0 && currentMsgCount === lastMsgCount) {
      stablePolls++
      if (stablePolls >= STABILITY_REQUIRED) {
        break
      }
    } else {
      stablePolls = 0
      lastMsgCount = currentMsgCount
    }
  }

  if (Date.now() - pollStart >= MAX_POLL_TIME_MS) {
    return `Error: 에이전트 작업 시간 초과 (5분)`
  }

  // 4. 결과 메시지 추출 및 반환
  const messagesResult = await ctx.client.session.messages({
    path: { id: sessionID },
  })

  if (messagesResult.error) {
    return `Error: 메시지 조회 실패: ${messagesResult.error}`
  }

  const messages = messagesResult.data

  // assistant 또는 tool 역할의 메시지 필터링
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relevantMessages = messages.filter(
    (m: any) => m.info?.role === "assistant" || m.info?.role === "tool"
  )

  if (relevantMessages.length === 0) {
    return `Error: 에이전트 응답 없음`
  }

  // 시간순 정렬 (오래된 것 먼저)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedMessages = [...relevantMessages].sort((a: any, b: any) => {
    const timeA = a.info?.time?.created ?? 0
    const timeB = b.info?.time?.created ?? 0
    return timeA - timeB
  })

  // 모든 메시지에서 콘텐츠 추출
  const extractedContent: string[] = []

  for (const message of sortedMessages) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const part of (message as any).parts ?? []) {
      if ((part.type === "text" || part.type === "reasoning") && part.text) {
        extractedContent.push(part.text)
      } else if (part.type === "tool_result") {
        const toolResult = part as { content?: string | Array<{ type: string; text?: string }> }
        if (typeof toolResult.content === "string" && toolResult.content) {
          extractedContent.push(toolResult.content)
        } else if (Array.isArray(toolResult.content)) {
          for (const block of toolResult.content) {
            if ((block.type === "text" || block.type === "reasoning") && block.text) {
              extractedContent.push(block.text)
            }
          }
        }
      }
    }
  }

  return extractedContent.filter((text) => text.length > 0).join("\n\n")
}
