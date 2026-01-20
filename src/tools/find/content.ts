import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const find_content = tool({
  description: "파일 내용 검색",
  args: {
    query: tool.schema.string().describe("검색어"),
    path: tool.schema.string().optional().describe("검색 경로 (기본: cwd)"),
    include: tool.schema.string().optional().describe("파일 패턴 (예: *.ts)"),
  },
  execute: async ({ query, path, include }) => {
    const dir = path ?? process.cwd()
    const includeOpt = include ? `--include="${include}"` : ""

    const { stdout, stderr } = await execAsync(
      `grep -rl "${query}" "${dir}" ${includeOpt} 2>/dev/null | head -50`
    )

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "검색 결과가 없습니다."
  },
})
