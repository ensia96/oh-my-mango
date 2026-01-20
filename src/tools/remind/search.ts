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
    // session_id가 있으면 해당 세션의 메시지만, 없으면 전체 검색
    const searchPath = session_id
      ? `~/.local/share/opencode/storage/message/${session_id}/*.json`
      : `~/.local/share/opencode/storage/part/*/*.json`

    const { stdout, stderr } = await execAsync(`
      grep -rl "${query}" ${searchPath} 2>/dev/null | head -${limit}
    `)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "검색 결과가 없습니다."
  },
})
