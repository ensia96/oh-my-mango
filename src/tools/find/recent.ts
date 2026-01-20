import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const find_recent = tool({
  description: "최근 수정 파일 검색",
  args: {
    path: tool.schema.string().optional().describe("검색 경로 (기본: cwd)"),
    days: tool.schema.number().optional().describe("최근 N일 이내 (기본: 1)"),
    pattern: tool.schema.string().optional().describe("파일명 패턴 (예: *.ts)"),
  },
  execute: async ({ path, days, pattern }) => {
    const dir = path ?? process.cwd()
    const mtime = days ?? 1
    const nameOpt = pattern ? `-name "${pattern}"` : ""

    const { stdout, stderr } = await execAsync(
      `find "${dir}" -type f -mtime -${mtime} ${nameOpt} 2>/dev/null | head -50`
    )

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "검색 결과가 없습니다."
  },
})
