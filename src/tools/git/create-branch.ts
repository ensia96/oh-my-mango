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

export const create_branch = tool({
  description:
    "브랜치 생성 (형식: {issue_number}/{username}/{YYYY-MM-DD})",
  args: {
    issue_number: tool.schema.number().describe("이슈 번호"),
    username: tool.schema
      .string()
      .optional()
      .describe("GitHub 유저명 (기본: 현재 로그인 유저)"),
    date: tool.schema
      .string()
      .optional()
      .describe("날짜 (기본: 오늘, 형식: YYYY-MM-DD)"),
  },
  execute: async ({ issue_number, username, date }) => {
    try {
      const user = username || (await getGitHubUsername());
      const branchDate = date || getToday();

      // 날짜 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(branchDate)) {
        return `Error: 날짜 형식이 올바르지 않습니다. (예: 2026-01-25)`;
      }

      const branchName = `${issue_number}/${user}/${branchDate}`;

      const { stdout } = await execAsync(
        `gh issue develop ${issue_number} --checkout --name "${branchName}"`
      );
      return stdout.trim() || `브랜치 생성 완료: ${branchName}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error: 브랜치 생성 실패 - ${message}`;
    }
  },
});
