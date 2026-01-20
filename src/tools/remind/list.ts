import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const remind_list = tool({
  description: "세션 목록 조회",
  args: {
    limit: tool.schema.number().optional().describe("최대 반환 개수"),
    project_path: tool.schema.string().optional().describe("프로젝트 경로 필터 (기본: cwd)"),
  },
  execute: async ({ limit, project_path }) => {
    const dir = project_path ?? process.cwd()
    const limitCmd = limit ? `| head -${limit}` : ""

    const { stdout, stderr } = await execAsync(`
      for f in ~/.local/share/opencode/storage/session/*/*.json; do
        jq -r '[.id, .title, .directory, .time.updated] | @tsv' "$f" 2>/dev/null
      done | grep "${dir}" | sort -t$'\\t' -k4 -r ${limitCmd}
    `)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "세션이 없습니다."
  },
})
