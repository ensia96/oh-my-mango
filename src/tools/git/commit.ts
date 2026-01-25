import { exec } from "node:child_process";
import { promisify } from "node:util";
import { tool } from "@opencode-ai/plugin";

const execAsync = promisify(exec);

const COMMIT_TYPES = ["chore", "docs", "feat", "fix"] as const;
type CommitType = (typeof COMMIT_TYPES)[number];

function validateMessage(type: string, message: string): string | null {
  if (!COMMIT_TYPES.includes(type as CommitType)) {
    return `유효하지 않은 커밋 유형: ${type}. 가능한 값: ${COMMIT_TYPES.join(", ")}`;
  }
  if (!message || message.trim().length === 0) {
    return "커밋 메시지가 비어있습니다.";
  }
  return null;
}

export const commit = tool({
  description: "커밋 생성 (형식: {type}: {message})",
  args: {
    type: tool.schema
      .enum(COMMIT_TYPES)
      .describe("커밋 유형 (chore/docs/feat/fix)"),
    message: tool.schema.string().describe("커밋 메시지"),
    add_all: tool.schema
      .boolean()
      .optional()
      .describe("모든 변경사항 스테이징 (기본: true)"),
  },
  execute: async ({ type, message, add_all }) => {
    const error = validateMessage(type, message);
    if (error) {
      return `Error: ${error}`;
    }

    const fullMessage = `${type}: ${message}`;
    const shouldAddAll = add_all !== false;

    try {
      if (shouldAddAll) {
        await execAsync("git add -A");
      }

      const { stdout } = await execAsync(`git commit -m "${fullMessage}"`);
      return stdout.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error: 커밋 실패 - ${message}`;
    }
  },
});
