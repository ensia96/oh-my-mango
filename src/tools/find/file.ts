import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const find_file = tool({
  description: "파일명 패턴 검색",
  args: {
    pattern: tool.schema.string().describe("파일명 패턴 (예: *.ts, *config*)"),
    path: tool.schema.string().optional().describe("검색 경로 (기본: cwd)"),
  },
  execute: async ({ pattern, path }) => {
    const dir = path ?? process.cwd()

    const { stdout, stderr } = await execAsync(
      `find "${dir}" -name "${pattern}" -type f 2>/dev/null | head -50`
    )

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "검색 결과가 없습니다."
  },
})
