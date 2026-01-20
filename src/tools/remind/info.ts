import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const remind_info = tool({
  description: "세션 메타데이터 조회",
  args: {
    session_id: tool.schema.string().describe("세션 ID"),
  },
  execute: async ({ session_id }) => {
    const { stdout, stderr } = await execAsync(`
      find ~/.local/share/opencode/storage/session -name "${session_id}.json" -exec cat {} \\; | jq '.'
    `)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "세션을 찾을 수 없습니다."
  },
})
