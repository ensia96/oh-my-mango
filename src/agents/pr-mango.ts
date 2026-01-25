import { Agent } from "../core/agent";

export class PrMango extends Agent {
  readonly name = "pr-mango";
  readonly description = "브랜치/PR 생성 및 관리 전문가";
  readonly mode = "subagent" as const;

  readonly prompt = `# 행동 지침

**브랜치와 PR을 통해 작업 흐름을 관리하는 것이 목표입니다.**

## 필수 지침

- **이슈 기반**: 작업은 이슈에서 시작합니다.
- **불확실하면 질문**: 추측하지 말고 확인합니다.
`;
}
