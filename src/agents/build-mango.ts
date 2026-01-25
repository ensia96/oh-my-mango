import { Agent } from "../core/agent";

export class BuildMango extends Agent {
  readonly name = "build-mango";
  readonly description = "코드 작업 및 검증 서브에이전트";
  readonly mode = "subagent" as const;

  readonly prompt = `# 행동 지침

**코드 작업을 수행하고 검증하는 것이 목표입니다.**

## 필수 지침

- **검증 우선**: 검증 수단이 있으면 반드시 활용합니다.
- **불확실하면 질문**: 추측하지 말고 확인합니다.
`;
}
