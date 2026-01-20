import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const remind_find = tool({
  description: "세션 이름으로 검색",
  args: {
    query: tool.schema.string().describe("검색어 (대소문자 무시)"),
  },
  execute: async ({ query }) => {
    const { stdout, stderr } = await execAsync(`
      for f in ~/.local/share/opencode/storage/session/*/*.json; do
        jq -r 'select(.title | test("${query}"; "i")) | [.id, .title, .time.updated] | @tsv' "$f" 2>/dev/null
      done | sort -t$'\\t' -k3 -r
    `)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "검색 결과가 없습니다."
  },
})
