import { exec } from "node:child_process";
import { promisify } from "node:util";
import { tool } from "@opencode-ai/plugin";

const execAsync = promisify(exec);

function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getGitHubUsername(): Promise<string> {
  const { stdout } = await execAsync("gh api user --jq '.login'");
  return stdout.trim();
}

function generateBody(
  summary: string,
  why: string,
  verification: string[],
  issueNumber: number
): string {
  const verificationList = verification.map((item) => `- [ ] ${item}`).join("\n");
  return `## Summary

${summary}

## Why

${why}

## Verification

${verificationList}

## Links

Closes #${issueNumber}`;
}

export const create_pr = tool({
  description: "PR 생성 (형식: [#{issue_number}] {username} ({YYYY-MM-DD}))",
  args: {
    issue_number: tool.schema.number().describe("연결할 이슈 번호"),
    summary: tool.schema.string().describe("요약 (무엇을 변경했는가)"),
    why: tool.schema.string().describe("이유 (왜 이렇게 변경했는가)"),
    verification: tool.schema
      .array(tool.schema.string())
      .describe("검증 항목 목록"),
    username: tool.schema
      .string()
      .optional()
      .describe("GitHub 유저명 (기본: 현재 로그인 유저)"),
    date: tool.schema
      .string()
      .optional()
      .describe("날짜 (기본: 오늘, 형식: YYYY-MM-DD)"),
  },
  execute: async ({
    issue_number,
    summary,
    why,
    verification,
    username,
    date,
  }) => {
    try {
      const user = username || (await getGitHubUsername());
      const prDate = date || getToday();

      // 날짜 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(prDate)) {
        return `Error: 날짜 형식이 올바르지 않습니다. (예: 2026-01-25)`;
      }

      const title = `[#${issue_number}] ${user} (${prDate})`;
      const body = generateBody(summary, why, verification, issue_number);

      // 먼저 push
      await execAsync("git push -u origin HEAD");

      const { stdout } = await execAsync(
        `gh pr create --title "${title}" --body "${body.replace(/"/g, '\\"')}" --assignee @me`
      );
      return stdout.trim();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error: PR 생성 실패 - ${message}`;
    }
  },
});
