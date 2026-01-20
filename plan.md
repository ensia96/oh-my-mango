# 리서치 망고(research-mango) 에이전트 추가

## 배경

- 정보 조사/탐색 작업을 전담할 서브에이전트 필요
- 기존 세션 조회(remind_*) 및 파일 탐색(find_*) 도구 정의 문서 존재
- oh-my-opencode의 callAgent 패턴 참조
- 관련 이슈: #22

## 참조 문서

| 문서 | 경로/URL |
|------|----------|
| 세션 조회 도구 | `~/projects/memo/oh-my-mango/legacy/tools/session-read.md` |
| 파일 탐색 도구 | `~/projects/memo/oh-my-mango/legacy/tools/file-search.md` |
| callAgent 참조 | https://github.com/code-yeongyu/oh-my-opencode/blob/dev/src/tools/call-omo-agent/tools.ts |

## 파일 구조

```
src/
├── index.ts              # 수정: tool 반환 추가, research-mango 에이전트 등록
├── utils/
│   └── call-agent.ts     # 신규: callAgent 유틸 함수
└── tools/
    ├── remind/
    │   ├── index.ts      # 배럴 파일
    │   ├── list.ts       # 세션 목록 조회
    │   ├── read.ts       # 세션 메시지 읽기
    │   ├── search.ts     # 세션 메시지 검색
    │   ├── info.ts       # 세션 메타데이터 조회
    │   └── find.ts       # 세션 이름 검색
    ├── find/
    │   ├── index.ts      # 배럴 파일
    │   ├── file.ts       # 파일명 패턴 검색
    │   ├── content.ts    # 내용 검색
    │   └── recent.ts     # 최근 수정 파일
    └── call-research-mango.ts  # callAgent 래핑, tools 파라미터로 도구 제한
```

## 작업

### 1단계: 플러그인 구조 변경

- [ ] `src/index.ts` 수정: tool 반환 추가

**변경 전:**
```typescript
return { config: async (config) => { ... } }
```

**변경 후:**
```typescript
return {
  config: async (config) => { ... },
  tool: { remind_list, remind_read, ... }
}
```

**검증:**
```bash
bun run build
```
- 예상 결과: 빌드 성공, 에러 없음

### 2단계: callAgent 유틸 구현

- [ ] `src/utils/call-agent.ts` 생성
- [ ] `callAgent(ctx, toolContext, agentName, prompt)` 함수 구현

**핵심 로직:**
```typescript
export async function callAgent(
  ctx: PluginInput,
  toolContext: ToolContext,
  agentName: string,
  prompt: string
) {
  // 1. 세션 생성: ctx.client.session.create()
  // 2. 프롬프트 전송: ctx.client.session.prompt()
  //    - tools: { task: false } 로 재귀 방지
  // 3. 응답 폴링 및 반환
}
```

**검증:**
```bash
bun run build
```
- 예상 결과: 빌드 성공, 타입 에러 없음

### 3단계: 리서치 망고 에이전트 등록

- [ ] research-mango 시스템 프롬프트 작성
- [ ] `src/index.ts`에 에이전트 등록

**프롬프트 내용:**
- 역할: 정보 조사/탐색 전담
- 사용 가능 도구: remind_*, find_*
- 제한: 파일 수정/생성 불가

**검증:**
```bash
bun run build
```
- 예상 결과: 빌드 성공
- opencode 실행 후 에이전트 목록에서 `research-mango` 확인

### 4단계: remind_* 도구 구현 (5개)

- [ ] `src/tools/remind/index.ts` (배럴 파일)
- [ ] `src/tools/remind/list.ts` (세션 목록 조회)
- [ ] `src/tools/remind/read.ts` (세션 메시지 읽기)
- [ ] `src/tools/remind/search.ts` (세션 메시지 검색)
- [ ] `src/tools/remind/info.ts` (세션 메타데이터 조회)
- [ ] `src/tools/remind/find.ts` (세션 이름 검색)

**각 도구 스펙 (session-read.md 참조):**

| 도구 | 필수 인자 | 선택 인자 | 기능 |
|------|-----------|-----------|------|
| remind_list | - | limit, project_path | 세션 목록 조회 |
| remind_read | session_id | limit | 세션 메시지 읽기 |
| remind_search | query | session_id, limit | 세션 메시지 검색 |
| remind_info | session_id | - | 세션 메타데이터 조회 |
| remind_find | query | - | 세션 이름 검색 |

**검증:**
```bash
bun run build
```
- 예상 결과: 빌드 성공

**동작 테스트:**
```bash
# opencode 실행 후 research-mango 에이전트에서
# remind_list 호출하여 세션 목록 반환 확인
```

### 5단계: find_* 도구 구현 (3개)

- [ ] `src/tools/find/index.ts` (배럴 파일)
- [ ] `src/tools/find/file.ts` (파일명 패턴 검색)
- [ ] `src/tools/find/content.ts` (내용 검색)
- [ ] `src/tools/find/recent.ts` (최근 수정 파일)

**각 도구 스펙 (file-search.md 참조):**

| 도구 | 필수 인자 | 선택 인자 | 기능 |
|------|-----------|-----------|------|
| find_file | pattern | path | 파일명 패턴 검색 (find 사용) |
| find_content | query | path, include | 내용 검색 (grep 사용) |
| find_recent | - | path, days, pattern | 최근 수정 파일 (find -mtime 사용) |

**검증:**
```bash
bun run build
```
- 예상 결과: 빌드 성공

**동작 테스트:**
```bash
# opencode 실행 후 research-mango 에이전트에서
# find_file 호출하여 파일 목록 반환 확인
```

### 6단계: call_research_mango 도구 추가

- [ ] `src/tools/call-research-mango.ts` 구현

**핵심 로직:**
- callAgent 유틸 래핑
- session.prompt 호출 시 tools 파라미터로 도구 제한
  - 허용: remind_*, find_*
  - 차단: task, call_research_mango (재귀 방지)

**검증:**
```bash
bun run build
```
- 예상 결과: 빌드 성공

**동작 테스트:**
```bash
# opencode 실행 후 mango 에이전트에서
# call_research_mango 호출하여 research-mango 서브에이전트 실행 확인
```

### 7단계: 통합 테스트

- [ ] 메인 → 리서치 → 도구 전체 흐름 확인

**테스트 시나리오:**
1. mango 에이전트에서 `call_research_mango` 호출
2. research-mango가 `remind_list`로 세션 조회
3. research-mango가 결과를 mango에게 반환
4. mango가 결과를 사용자에게 전달

**검증:**
```bash
# opencode 실행 후
# "최근 세션에서 'test' 관련 내용을 찾아줘" 같은 요청으로 전체 흐름 테스트
```
- 예상 결과: mango → research-mango → remind_search → 결과 반환 성공

## 검증 체크리스트

| 단계 | 빌드 명령 | 예상 결과 | 동작 확인 |
|------|-----------|-----------|-----------|
| 1 | `bun run build` | 성공 | 플러그인 로드 확인 |
| 2 | `bun run build` | 성공 | - |
| 3 | `bun run build` | 성공 | 에이전트 목록에서 research-mango 확인 |
| 4 | `bun run build` | 성공 | remind_list 세션 조회 동작 |
| 5 | `bun run build` | 성공 | find_file 파일 탐색 동작 |
| 6 | `bun run build` | 성공 | call_research_mango 호출 동작 |
| 7 | - | - | 메인→리서치→도구 전체 흐름 |
