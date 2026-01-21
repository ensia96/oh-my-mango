import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const remind_search = tool({
  description: "세션 메시지 검색",
  args: {
    query: tool.schema.string().describe("검색어"),
    session_id: tool.schema.string().optional().describe("특정 세션만 검색"),
    limit: tool.schema.number().optional().describe("최대 결과 개수 (기본: 20)"),
  },
  execute: async ({ query, session_id, limit = 20 }) => {
    const basePath = "~/.local/share/opencode/storage"

    // session_id 지정 시: 해당 세션의 메시지 ID 목록 조회 → part/에서 해당 ID만 검색
    // session_id 미지정 시: 전체 part/에서 검색
    const grepCommand = session_id
      ? `for msg_id in $(ls ${basePath}/message/${session_id}/*.json 2>/dev/null | xargs -n1 basename -s .json); do grep -rl "${query}" ${basePath}/part/$msg_id/*.json 2>/dev/null; done | head -${limit}`
      : `grep -rl "${query}" ${basePath}/part/*/*.json 2>/dev/null | head -${limit}`

    const { stdout, stderr } = await execAsync(grepCommand)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "검색 결과가 없습니다."
  },
})
