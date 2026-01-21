# 코치 망고 추가 (Phase 2)

## 배경

- **문제**: 현재 메인 망고가 마이크로매니징 → 검증 누락 발생
- **실제 사례**: PR #23 머지 시 버전 업데이트 누락 → npm 배포 실패
- **목표**: 코치 망고가 plan.md 기반으로 실행 오케스트레이션 담당
- **관련 이슈**: #27 (https://github.com/ensia96/oh-my-mango/issues/27)
- **관련 문서**: ~/projects/memo/oh-my-mango/index.md

## 작업

### 단계 1: 코치 망고 시스템 프롬프트 작성

**담당**: 빌드 망고  
**선행 조건**: 없음

- [ ] `src/index.ts`에 `COACH_MANGO_PROMPT` 상수 추가
- [ ] 프롬프트 내용:
  - 역할: plan.md를 받아 3계층 망고에 순차 위임, 검증, 보고
  - 호출 가능 도구: `call_build_mango`, `call_issue_mango`, `call_pr_mango`, `call_research_mango`
  - 워크플로우: plan.md 파싱 → 작업별 담당자 호출 → 결과 취합 → 검증 → 보고
  - 검증 체크리스트 처리 방법 명시

**프롬프트 초안**:
```markdown
# 코치 망고

plan.md 기반 실행 오케스트레이션을 담당하는 서브에이전트입니다.

## 역할

메인 망고로부터 plan.md를 전달받아:
1. plan.md 파싱 및 작업 목록 추출
2. 작업별 담당 망고에게 순차 위임
3. 각 작업 완료 후 검증 체크리스트 확인
4. 모든 작업 완료 후 최종 검증
5. 결과를 메인 망고에게 보고

## 사용 가능 도구

### 3계층 망고 호출
- call_build_mango: 코드 작업 (구현, 수정, 리팩토링)
- call_issue_mango: 이슈 생성/수정
- call_pr_mango: PR 생성/머지

### 공통 망고 호출
- call_research_mango: 정보 조사/탐색

## 워크플로우

### 1. plan.md 파싱
- 작업 섹션에서 체크리스트 추출
- 검증 섹션에서 자동/수동 검증 항목 추출

### 2. 순차 위임
- 작업 순서대로 담당 망고 호출
- 이전 작업 완료 확인 후 다음 작업 진행
- 실패 시 롤백 후 메인 망고에게 보고

### 3. 검증 처리
- 자동 검증: 빌드 망고에게 위임 (빌드, 린트, 테스트)
- 수동 검증: 체크리스트 항목을 메인 망고에게 확인 요청
  - 예: 버전 업데이트 여부, 머지 방식 등

### 4. 최종 보고
- 완료된 작업 목록
- 검증 결과 (자동/수동 구분)
- 발생한 이슈 및 해결 방법

## 주의 사항

- **버전 업데이트 필수**: npm 프로젝트의 경우 package.json 버전 확인
- **머지 방식 확인**: squash/rebase 금지, merge commit만 사용
- **수동 검증 미완료 시 진행 중단**: 사용자 확인 필수
```

---

### 단계 2: coach-mango 에이전트 등록

**담당**: 빌드 망고  
**선행 조건**: 단계 1 완료

- [ ] `src/index.ts`의 `plugin.config` 함수 내 `config.agent`에 추가:
```typescript
"coach-mango": {
  prompt: COACH_MANGO_PROMPT,
  description: "plan.md 기반 실행 오케스트레이션 서브에이전트",
  mode: "subagent",
},
```

---

### 단계 3: 호출 도구 구현

**담당**: 빌드 망고  
**선행 조건**: 단계 2 완료

#### 3-1. call_build_mango 도구

- [ ] `src/tools/call-build-mango.ts` 생성
- [ ] `createCallResearchMango` 패턴 참고하여 구현
```typescript
export function createCallBuildMango(ctx: PluginInput) {
  return tool({
    description: "빌드 망고에게 코드 작업 요청",
    args: {
      prompt: tool.schema.string().describe("작업 요청 내용"),
    },
    execute: async ({ prompt }, toolContext) => {
      return await callAgent(
        ctx,
        { sessionID: toolContext.sessionID },
        "build-mango",
        prompt
      )
    },
  })
}
```

#### 3-2. call_issue_mango 도구

- [ ] `src/tools/call-issue-mango.ts` 생성
- [ ] 동일 패턴으로 구현 (agentName: "issue-mango")

#### 3-3. call_pr_mango 도구

- [ ] `src/tools/call-pr-mango.ts` 생성
- [ ] 동일 패턴으로 구현 (agentName: "pr-mango")

#### 3-4. src/index.ts에 도구 등록

- [ ] import 추가
- [ ] `plugin.tool` 객체에 도구들 추가
```typescript
import { createCallBuildMango } from "./tools/call-build-mango"
import { createCallIssueMango } from "./tools/call-issue-mango"
import { createCallPrMango } from "./tools/call-pr-mango"

// plugin 함수 내
const call_build_mango = createCallBuildMango(ctx)
const call_issue_mango = createCallIssueMango(ctx)
const call_pr_mango = createCallPrMango(ctx)

// tool 객체에 추가
tool: {
  // ... 기존 도구들
  call_research_mango,
  call_build_mango,
  call_issue_mango,
  call_pr_mango,
},
```

---

### 단계 4: 빌드 및 로컬 테스트

**담당**: 빌드 망고  
**선행 조건**: 단계 3 완료

- [ ] TypeScript 빌드: `bun run build`
- [ ] 빌드 오류 수정 (있는 경우)
- [ ] 로컬 테스트 환경 구성
  - `.config/opencode/opencode.json` 파일의 경로를 로컬 dist로 수정
- [ ] 에이전트 로드 확인
  - opencode 실행 → coach-mango 에이전트 표시 확인
- [ ] 도구 동작 확인
  - `call_build_mango`, `call_issue_mango`, `call_pr_mango` 호출 테스트

---

### 단계 5: 버전 업데이트

**담당**: 빌드 망고  
**선행 조건**: 단계 4 완료 (테스트 통과)

- [ ] `package.json` 버전 수정: `0.0.12` → `0.0.13`

---

### 단계 6: PR 생성 및 머지

**담당**: PR 망고  
**선행 조건**: 단계 5 완료

- [ ] 브랜치 생성: `27/ensia96/2026-01-21`
- [ ] PR 생성
  - 제목: `[#27] ensia96 (2026-01-21)`
  - 본문: `Closes #27` 포함
- [ ] **머지 방식 확인**: `--merge` 옵션 명시 (squash/rebase 금지)
  - 명령: `gh pr merge {PR번호} --merge`

---

### 단계 7: npm 배포 확인

**담당**: 코치 망고 (최종 검증)  
**선행 조건**: 단계 6 완료 (머지 완료)

- [ ] GitHub Actions 배포 워크플로우 확인
- [ ] npm 패키지 버전 확인: `npm view oh-my-mango version`
- [ ] 예상 결과: `0.0.13`

---

## 검증 체크리스트

### 자동 검증 (CI/빌드 망고)

- [ ] TypeScript 빌드 성공 (`bun run build`)
- [ ] 타입 오류 없음
- [ ] 린트 통과 (있는 경우)

### 수동 검증 (사용자/코치 망고)

| 항목 | 확인 방법 | 확인자 |
|------|----------|--------|
| coach-mango 에이전트 등록 | opencode 에이전트 목록 확인 | 사용자 |
| 3개 호출 도구 등록 | 도구 목록에서 call_*_mango 확인 | 사용자 |
| package.json 버전 업데이트 | `0.0.12` → `0.0.13` 확인 | 코치 망고 |
| 머지 방식 | `--merge` 옵션 사용 여부 | 코치 망고 |
| npm 배포 버전 | `npm view oh-my-mango version` | 코치 망고 |

---

## 주의 사항

### 이전 실패 사례 반영

1. **버전 업데이트 누락 (PR #23)**
   - 원인: 머지 전 버전 체크 없이 진행
   - 대책: 단계 5에서 버전 업데이트를 명시적 작업으로 분리
   - 검증: 머지 전 package.json 버전 diff 확인

2. **스쿼시 머지 사용**
   - 원인: 기본 머지 옵션이 squash
   - 대책: `gh pr merge --merge` 명시
   - 검증: 머지 커밋 메시지에 "Merge pull request" 포함 확인

### 기타 주의 사항

- **callAgent 유틸 재사용**: 새 호출 도구는 기존 `src/utils/call-agent.ts` 활용
- **에이전트 이름 일치**: 등록된 에이전트 이름과 호출 시 사용하는 이름 일치 확인
- **로컬 테스트 필수**: npm 배포 전 반드시 로컬에서 동작 확인

---

## 예상 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/index.ts` | 수정 | COACH_MANGO_PROMPT 추가, 에이전트 등록, 도구 등록 |
| `src/tools/call-build-mango.ts` | 신규 | 빌드 망고 호출 도구 |
| `src/tools/call-issue-mango.ts` | 신규 | 이슈 망고 호출 도구 |
| `src/tools/call-pr-mango.ts` | 신규 | PR 망고 호출 도구 |
| `package.json` | 수정 | 버전 `0.0.12` → `0.0.13` |
