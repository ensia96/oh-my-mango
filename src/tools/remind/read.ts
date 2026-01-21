import { exec } from "node:child_process"
import { promisify } from "node:util"
import { tool } from "@opencode-ai/plugin"

const execAsync = promisify(exec)

export const remind_read = tool({
  description: "세션 메시지 읽기",
  args: {
    session_id: tool.schema.string().describe("세션 ID"),
    limit: tool.schema.number().optional().describe("최대 메시지 개수"),
    order: tool.schema.enum(["asc", "desc"]).optional().describe("정렬 순서 (기본: desc)"),
  },
  execute: async ({ session_id, limit, order = "desc" }) => {
    const sortOrder = order === "asc" ? "" : "-r"
    const limitCmd = limit ? `| head -${limit}` : ""

    const { stdout, stderr } = await execAsync(`
      for msg in $(ls ~/.local/share/opencode/storage/message/${session_id}/*.json | while read f; do
        created=$(jq -r '.time.created' "$f")
        echo "$created $f"
      done | sort -n ${sortOrder} ${limitCmd} | awk '{print $2}'); do
        msg_id=$(jq -r '.id' "$msg")
        role=$(jq -r '.role' "$msg")
        echo "=== [$role] ==="
        for part in ~/.local/share/opencode/storage/part/$msg_id/*.json; do
          jq -r 'select(.type == "text") | .text // empty' "$part" 2>/dev/null
        done
        echo ""
      done
    `)

    if (stderr && !stdout) {
      return `Error: ${stderr}`
    }

    return stdout.trim() || "메시지가 없습니다."
  },
})
