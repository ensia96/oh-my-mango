import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const remind_read = tool({
  description: "세션 메시지 읽기",
  args: {
    session_id: tool.schema.string().describe("세션 ID"),
    limit: tool.schema.number().optional().describe("최대 메시지 개수"),
  },
  execute: async ({ session_id, limit }) => {
    const limitCmd = limit ? `| head -${limit * 20}` : ""

    const { stdout, stderr } = await execAsync(`
      for msg in ~/.local/share/opencode/storage/message/${session_id}/*.json; do
        msg_id=$(jq -r '.id' "$msg")
        role=$(jq -r '.role' "$msg")
        echo "=== [$role] ==="
        for part in ~/.local/share/opencode/storage/part/$msg_id/*.json; do
          jq -r 'select(.type == "text") | .text // empty' "$part" 2>/dev/null
        done
        echo ""
      done ${limitCmd}
    `)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "메시지가 없습니다."
  },
})
