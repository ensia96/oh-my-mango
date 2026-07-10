import Database from "bun:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";
import { tool, ToolDefinition } from "@opencode-ai/plugin";
import { _, $ } from "./utility";

const DB_PATH = join(homedir(), ".local/share/opencode/opencode.db");

export namespace Tool {
  const is = tool.schema;

  export abstract class Interface {
    static handles(error: unknown) {
      return `Error(${this.name}): ${error instanceof Error ? error.message : String(error)}`;
    }

    abstract readonly config: ToolDefinition;
    abstract readonly name: string;
  }

  export namespace Git {
    export class Branch extends Interface {
      config = tool({
        args: {
          base: is.string().optional().describe("기반 브랜치 (기본: main)"),
          project: is.string().describe("프로젝트 절대 경로"),
        },
        description: "브랜치 적용",
        async execute({ base = "main", project }) {
          try {
            return $`cd ${project} && git fetch origin && git checkout ${base} && git pull && if git show-ref --verify --quiet refs/remotes/origin/dev; then git checkout dev; else git checkout -b dev && git push -u origin dev; fi && git pull`;
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
      config = tool({
        args: {
          base: is.string().optional().describe("기반 브랜치 (기본: main)"),
          checklist: is.string().array().describe("검증 항목"),
          issues: is.number().array().optional().describe("관련 이슈"),
          project: is.string().describe("프로젝트 절대 경로"),
          summary: is.string().describe("작업 요약"),
          why: is.string().describe("작업 목적"),
        },
        description: "풀 리퀘스트 생성",
        async execute({
          base = "main",
          checklist,
          issues,
          project,
          summary,
          why,
        }) {
          try {
            return $`cd ${project} && git checkout dev && gh pr create --base ${base} --head dev --title ${`[${$`gh api user --jq '.login'`}] ${$`date '+%Y-%m-%d %H:%M:%S'`}`} --body ${[
              "## Summary",
              summary,
              "## Why",
              why,
              "## Verification",
              checklist.map((item) => `- [ ] ${item}`).join("\n"),
              "## Links",
            ]
              .concat(
                issues?.length
                  ? issues.map((issue) => `Closes #${issue}`).join("\n")
                  : ["-"],
              )
              .join("\n\n")} --assignee @me`;
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
            const db = new Database(DB_PATH, { readonly: true });
            const conditions = [
              '(data LIKE \'%"type":"text"%\' OR data LIKE \'%"tool":"task"%\')',
            ];
            const params: (string | number)[] = [];
            if (sessionId) {
              conditions.push("session_id = ?");
              params.push(sessionId);
            }
            if (keyword) {
              conditions.push("data LIKE ?");
              params.push(`%${keyword}%`);
            }
            if (cursor) {
              conditions.push("time_updated < ?");
              params.push(cursor);
            }
            const query = `
              SELECT time_updated, data FROM part
              WHERE ${conditions.join(" AND ")}
              ORDER BY time_updated DESC LIMIT 10
            `;
            const rows = db.prepare(query).all(...params) as {
              time_updated: number;
              data: string;
            }[];
            db.close();
            return JSON.stringify(
              rows.map((row) => {
                const part = JSON.parse(row.data);
                return {
                  cursor: row.time_updated,
                  text:
                    part.type === "text"
                      ? part.text
                      : `${part.tool}(${Object.entries(part.state.input)
                          .map(
                            ([parameter, value]) =>
                              `${parameter}: ${String(value).slice(0, 30)}`,
                          )
                          .join(", ")})`,
                };
              }),
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
          id: is.string().optional().describe("세션 ID"),
          parentId: is.string().optional().describe("부모 세션 ID"),
          self: is
            .boolean()
            .optional()
            .describe("현재 소속 세션 기준 조회 여부"),
          title: is.string().optional().describe("세션 제목 검색 키워드"),
        },
        description: "세션 목록 조회",
        async execute(
          { cursor, directory, id, parentId, self, title },
          context,
        ) {
          try {
            const db = new Database(DB_PATH, { readonly: true });
            const conditions: string[] = [];
            const params: (string | number)[] = [];
            if (id) {
              conditions.push("id = ?");
              params.push(id);
            }
            if (parentId) {
              conditions.push("parent_id = ?");
              params.push(parentId);
            }
            if (self) {
              conditions.push("id = ?");
              params.push(context.sessionID);
            }
            if (directory) {
              conditions.push("directory = ?");
              params.push(directory);
            }
            if (title) {
              conditions.push("title LIKE ?");
              params.push(`%${title}%`);
            }
            if (cursor) {
              conditions.push("time_updated < ?");
              params.push(cursor);
            }
            const where = conditions.length
              ? `WHERE ${conditions.join(" AND ")}`
              : "";
            const query = `
              SELECT time_updated, id, parent_id, title, directory FROM session
              ${where}
              ORDER BY time_updated DESC LIMIT 10
            `;
            const rows = db.prepare(query).all(...params) as {
              time_updated: number;
              id: string;
              parent_id: string | null;
              title: string;
              directory: string;
            }[];
            db.close();
            return JSON.stringify(
              rows.map((row) => ({
                cursor: row.time_updated,
                directory: row.directory,
                id: row.id,
                parentID: row.parent_id,
                title: row.title,
              })),
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
