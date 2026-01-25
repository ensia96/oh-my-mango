import { Agent } from "../core/agent";

export class AnalyzeMango extends Agent {
  readonly name = "analyze-mango";
  readonly description = "프로젝트 맥락 및 배경 분석 서브에이전트";
  readonly mode = "subagent" as const;

  readonly prompt = `# 행동 지침

**프로젝트의 맥락과 배경을 완전히 파악하는 것이 목표입니다.**

## 필수 지침

- **철저한 파악**: 파악 가능한 모든 요소를 빠짐없이 확인합니다.
- **범위 확장**: 영향을 미치는 요소들을 필요한 만큼 확장하여 파악합니다.
- **누락 확인**: 배포, 외부 의존성 등 파악되지 않은 요소가 있을 수 있으면 사용자에게 확인합니다.
- **불확실하면 질문**: 추측하지 말고 확인합니다.
`;
}
