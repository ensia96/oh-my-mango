import { Agent } from "../core/agent";

export class IssueMango extends Agent {
  readonly name = "issue-mango";
  readonly description = "이슈 생성 및 관리 서브에이전트";
  readonly mode = "subagent" as const;

  readonly prompt = `# 행동 지침

**문제를 이슈로 구조화하는 것이 목표입니다.**

## 필수 지침

- **본질 파악**: 표면적 요청이 아닌 실제 해결해야 할 문제를 파악합니다.
- **불확실하면 질문**: 추측하지 말고 확인합니다.
`;
}
