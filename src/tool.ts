import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tool, ToolDefinition } from "@opencode-ai/plugin";

export namespace Tool {
  function _(command: TemplateStringsArray, ...values: unknown[]) {
    return command.reduce(
      (command, segment, index) =>
        command +
        segment +
        (values.length > index
          ? `'${String(values[index] ?? "")
              .replace(/\x00/g, "")
              .replace(/'/g, "'\\''")}'`
          : ""),
      "",
    );
  }
  function $(command: string | TemplateStringsArray, ...values: unknown[]) {
    return execSync(
      typeof command === "object" && "raw" in command
        ? _(command, ...values)
        : command,
      { encoding: "utf-8" },
    ).trim();
  }
  $.pipe = (...parts: (string | false | null | undefined)[]) =>
    $(parts.filter(Boolean).join(" "));
  const is = tool.schema;

  export abstract class Interface {
    static handles(error: unknown) {
      return `Error(${this.name}): ${error instanceof Error ? error.message : String(error)}`;
    }

    abstract readonly config: ToolDefinition;
    abstract readonly name: string;
  }

  export class FindFiles extends Interface {
    config = tool({
      args: {
        content: is.string().optional().describe("내용 정규표현식 패턴"),
        cursor: is.number().optional().describe("이전 조회 마지막 mtime"),
        directory: is
          .string()
          .optional()
          .describe("검색 범위 절대 경로(기본: cwd)"),
        path: is.string().optional().describe("경로 정규표현식 패턴"),
      },
      description: "파일 검색 (mtime 내림차순, 10개 단위)",
      async execute({ content, cursor, directory = process.cwd(), path }) {
        try {
          return JSON.stringify(
            $.pipe(
              ...(content
                ? [
                    _`ag -l`,
                    path && _`-G ${path}`,
                    _`${content}`,
                    _`${directory}`,
                  ]
                : [
                    _`find ${directory} -type f 2>/dev/null`,
                    path && _`| grep -E ${path}`,
                  ]),
              _`| xargs stat -f '%m\t%z\t%N' 2>/dev/null`,
              cursor ? _`| awk -F'\t' '$1 < ${cursor}'` : null,
              _`| sort -rn | head -10`,
            )
              .split("\n")
              .filter(Boolean)
              .map((line) => {
                const [mtime, size, ...pathParts] = line.split("\t");
                return {
                  mtime: Number(mtime),
                  path: pathParts.join("\t"),
                  size: Number(size),
                };
              }),
          );
        } catch (error) {
          return FindFiles.handles(error);
        }
      },
    });
    name = "find-files";
  }

  export namespace Git {
    export class Branch extends Interface {
      config = tool({
        args: {
          base: is.string().optional().describe("기반 브랜치 (기본: main)"),
          issueNumber: is.number().describe("이슈 번호"),
          project: is.string().describe("프로젝트 절대 경로"),
        },
        description: "브랜치 적용",
        async execute({ base = "main", issueNumber, project }) {
          try {
            $`cd ${project} && git checkout ${base} && git pull`;
            const issue = JSON.parse(
              $`cd ${project} && gh issue view ${issueNumber} --json state,title`,
            );
            if (issue.state === "CLOSED")
              $`cd ${project} && gh issue reopen ${issueNumber}`;
            const name = `${issueNumber}/${$`gh api user --jq '.login'`}/${new Date().toLocaleDateString("en-CA")}`;
            return $.pipe(
              _`cd ${project}`,
              $`cd ${project} && git branch`
                .split("\n")
                .some((branch) => branch.trim().replace(/^\* /, "") === name)
                ? _`&& git checkout ${name}`
                : _`&& gh issue develop ${issueNumber} --checkout --name ${name}`,
            );
          } catch (error) {
            return Branch.handles(error);
          }
        },
      });
      name = "git-branch";
    }

    export class Commit extends Interface {
      static TYPE = {
        chore: "동작에 영향을 주지 않는 변경사항",
        docs: "문서, 주석 등 주변 내용 변경사항",
        feat: "chore, docs, fix 이외의 모든 변경사항",
        fix: "의도하지 않은 동작에 대한 수정 변경사항",
      } as const;

      config = tool({
        args: {
          message: is.string().describe("변경사항 설명"),
          project: is.string().describe("프로젝트 절대 경로"),
          type: is.enum(Object.keys(Commit.TYPE)).describe(
            Object.entries(Commit.TYPE)
              .map(([type, description]) => `- **${type}**: ${description}`)
              .join("\n"),
          ),
        },
        description: "커밋 생성",
        async execute({ message, project, type }) {
          try {
            return $`cd ${project} && git commit -m ${`${type}: ${message}`}`;
          } catch (error) {
            return Commit.handles(error);
          }
        },
      });
      name = "git-commit";
    }

    export class Issue extends Interface {
      static TYPE = {
        report: "제보, 요청 등 구체화되지 않은 외부 요구사항",
        story: "아이디어 등 구체화되지 않은 내부 요구사항",
        task: "구체화된 작업 명세",
      } as const;

      config = tool({
        args: {
          checklist: is.string().array().describe("완료 조건"),
          project: is.string().describe("프로젝트 절대 경로"),
          purpose: is.string().describe("목적"),
          title: is.string().describe("제목"),
          type: is.enum(Object.keys(Issue.TYPE)).describe(
            Object.entries(Issue.TYPE)
              .map(([type, description]) => `- **${type}**: ${description}`)
              .join("\n"),
          ),
        },
        description: "이슈 생성",
        async execute({ checklist, project, purpose, title, type }) {
          try {
            if (type !== "task")
              throw new Error("Agent Only Can Create Task Issues");
            return $`cd ${project} && gh issue create --title ${`${type}: ${title}`} --body ${[
              "## Purpose",
              purpose,
              "## Done when",
              checklist.map((item) => `- [ ] ${item}`).join("\n"),
            ].join("\n\n")} --assignee @me`;
          } catch (error) {
            return Issue.handles(error);
          }
        },
      });
      name = "git-issue";
    }

    export class RequestMerge extends Interface {
      config = tool({
        args: {
          project: is.string().describe("프로젝트 절대 경로"),
        },
        description: "풀 리퀘스트 병합",
        async execute({ project }) {
          try {
            return $`cd ${project} && gh pr merge --merge`;
          } catch (error) {
            return RequestMerge.handles(error);
          }
        },
      });
      name = "git-request-merge";
    }

    export class RequestPull extends Interface {
      static BRANCH_REGEX =
        /^(\d+)\/([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)\/(\d{4}-\d{2}-\d{2})$/;

      config = tool({
        args: {
          base: is.string().optional().describe("기반 브랜치 (기본: main)"),
          checklist: is.string().array().describe("검증 항목"),
          closes: is
            .boolean()
            .optional()
            .describe("이슈 종결 여부 (default: true)"),
          project: is.string().describe("프로젝트 절대 경로"),
          summary: is.string().describe("작업 요약"),
          why: is.string().describe("작업 목적"),
        },
        description: "풀 리퀘스트 생성",
        async execute({
          base = "main",
          checklist,
          closes = true,
          project,
          summary,
          why,
        }) {
          try {
            const branch = $`cd ${project} && git branch --show-current`;
            const match = branch.match(RequestPull.BRANCH_REGEX);
            if (!match) throw new Error("Current Branch Is Invalid");
            const [, issue, user, date] = match;
            if (date !== new Date().toLocaleDateString("en-CA"))
              throw new Error("Date Of Branch Does Not Match Today");
            return $`cd ${project} && gh pr create --base ${base} --title ${`[#${issue}] ${user} (${date})`} --body ${[
              "## Summary",
              summary,
              "## Why",
              why,
              "## Verification",
              checklist.map((item) => `- [ ] ${item}`).join("\n"),
              "## Links",
              `${closes ? "Closes" : "Relates to"} #${issue}`,
            ].join("\n\n")} --assignee @me`;
          } catch (error) {
            return RequestPull.handles(error);
          }
        },
      });
      name = "git-request-pull";
    }

    export class WorkflowList extends Interface {
      config = tool({
        args: {
          branch: is.string().optional().describe("브랜치 이름"),
          project: is.string().describe("프로젝트 절대 경로"),
        },
        description: "워크플로우 목록 조회",
        async execute({ branch, project }) {
          try {
            return JSON.stringify(
              JSON.parse(
                $.pipe(
                  _`cd ${project} && gh run list`,
                  branch && _`--branch ${branch}`,
                  _`--limit 5 --json databaseId,displayTitle,status,conclusion,headBranch`,
                ),
              ),
            );
          } catch (error) {
            return WorkflowList.handles(error);
          }
        },
      });
      name = "git-workflow-list";
    }

    export class WorkflowStatus extends Interface {
      config = tool({
        args: {
          project: is.string().describe("프로젝트 절대 경로"),
          runId: is.number().describe("워크플로우 실행 ID"),
        },
        description: "워크플로우 상태 조회",
        async execute({ project, runId }) {
          try {
            return $`cd ${project} && gh run watch ${runId} --exit-status`;
          } catch (error) {
            return WorkflowStatus.handles(error);
          }
        },
      });
      name = "git-workflow-status";
    }
  }

  export namespace Remind {
    export class Messages extends Interface {
      config = tool({
        args: {
          cursor: is.number().optional().describe("이전 조회 마지막 mtime"),
          keyword: is.string().optional().describe("메시지 내용 검색 키워드"),
          sessionId: is.string().optional().describe("세션 ID"),
        },
        description: "세션 메시지 조회",
        async execute({ cursor, keyword, sessionId }) {
          try {
            return JSON.stringify(
              await Promise.all(
                $.pipe(
                  _`find ~/.local/share/opencode/storage/part -name "*.json"`,
                  sessionId &&
                    _`| xargs grep -l ${`"sessionID": "${sessionId}"`}`,
                  _`| xargs grep -l '"type": "text"'`,
                  keyword && _`| xargs grep -l ${keyword}`,
                  _`| xargs stat -f "%m\t%N"`,
                  cursor ? _`| awk -F'\t' '$1 < ${cursor}'` : null,
                  _`| sort -rn | head -10`,
                )
                  .split("\n")
                  .filter(Boolean)
                  .map(async (line) => {
                    const [mtime, path] = line.split("\t");
                    const part = JSON.parse(await readFile(path, "utf-8"));
                    return { cursor: Number(mtime), text: part.text };
                  }),
              ),
            );
          } catch (error) {
            return Messages.handles(error);
          }
        },
      });
      name = "remind-messages";
    }

    export class Sessions extends Interface {
      config = tool({
        args: {
          cursor: is
            .number()
            .optional()
            .describe("이전 조회 결과의 마지막 mtime"),
          directory: is
            .string()
            .optional()
            .describe("세션의 프로젝트 절대 경로"),
          title: is.string().optional().describe("세션 제목 검색 키워드"),
        },
        description: "세션 목록 조회",
        async execute({ cursor, directory, title }) {
          try {
            return JSON.stringify(
              await Promise.all(
                $.pipe(
                  _`find ~/.local/share/opencode/storage/session -name "*.json"`,
                  directory && _`| xargs grep -Fl ${directory}`,
                  title && _`| xargs grep -Fl ${title}`,
                  _`| xargs stat -f "%m\t%N"`,
                  cursor ? _`| awk -F'\t' '$1 < ${cursor}'` : null,
                  _`| sort -rn | head -10`,
                )
                  .split("\n")
                  .filter(Boolean)
                  .map(async (line) => {
                    const [mtime, path] = line.split("\t");
                    const session = JSON.parse(await readFile(path, "utf-8"));
                    return {
                      cursor: Number(mtime),
                      directory: session.directory,
                      id: session.id,
                      title: session.title,
                    };
                  }),
              ),
            );
          } catch (error) {
            return Sessions.handles(error);
          }
        },
      });
      name = "remind-sessions";
    }
  }

  export const box: Record<string, ToolDefinition> = [
    new FindFiles(),
    new Git.Branch(),
    new Git.Commit(),
    new Git.Issue(),
    new Git.RequestMerge(),
    new Git.RequestPull(),
    new Git.WorkflowList(),
    new Git.WorkflowStatus(),
    new Remind.Messages(),
    new Remind.Sessions(),
  ].reduce((box, tool) => ({ ...box, [tool.name]: tool.config }), {});
}
