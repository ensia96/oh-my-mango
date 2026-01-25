import { exec } from "node:child_process";
import { promisify } from "node:util";
import { tool } from "@opencode-ai/plugin";

const execAsync = promisify(exec);

const ISSUE_TYPES = ["report", "story", "task"] as const;
type IssueType = (typeof ISSUE_TYPES)[number];

function validateTitle(type: string, title: string): string | null {
  if (!ISSUE_TYPES.includes(type as IssueType)) {
    return `유효하지 않은 이슈 유형: ${type}. 가능한 값: ${ISSUE_TYPES.join(", ")}`;
  }
  if (!title || title.trim().length === 0) {
    return "제목이 비어있습니다.";
  }
  return null;
}

function generateBody(purpose: string, doneWhen: string[]): string {
  const doneWhenList = doneWhen.map((item) => `- [ ] ${item}`).join("\n");
  return `## Purpose

${purpose}

## Done when

${doneWhenList}`;
}

export const create_issue = tool({
  description: "이슈 생성 (형식: {type}: {title})",
  args: {
    type: tool.schema
      .enum(ISSUE_TYPES)
      .describe("이슈 유형 (report/story/task)"),
    title: tool.schema.string().describe("이슈 제목"),
    purpose: tool.schema.string().describe("목적 (왜 필요한가)"),
    done_when: tool.schema
      .array(tool.schema.string())
      .describe("완료 조건 목록"),
    assignee: tool.schema.string().optional().describe("담당자 (기본: @me)"),
  },
  execute: async ({ type, title, purpose, done_when, assignee }) => {
    const error = validateTitle(type, title);
    if (error) {
      return `Error: ${error}`;
    }

    const fullTitle = `${type}: ${title}`;
    const body = generateBody(purpose, done_when);
    const assigneeArg = assignee ? `--assignee ${assignee}` : "--assignee @me";

    try {
      const { stdout } = await execAsync(
        `gh issue create --title "${fullTitle}" --body "${body.replace(/"/g, '\\"')}" ${assigneeArg}`
      );
      return stdout.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error: 이슈 생성 실패 - ${message}`;
    }
  },
});
