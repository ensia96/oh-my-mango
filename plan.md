# remind 도구 검색/읽기 버그 수정

## 기본 정보

| 항목 | 내용 |
|------|------|
| 이슈 | [#25](https://github.com/ensia96/oh-my-mango/issues/25) |
| 브랜치 | `25/ensia96/2026-01-21` |
| 담당자 | ensia96 |
| 현재 버전 | 0.0.11 |
| 배포 버전 | 0.0.12 |

## 배경

- remind_read: limit 지정 시 최신 N개가 아닌 알파벳순 처음 N개 반환
- remind_search: session_id 지정 시 part/(실제 내용)가 아닌 message/(메타데이터)에서 검색

### 저장 구조
```
message/{session_id}/msg_xxx.json  → 메타데이터 (id, role, time.created 등)
part/{msg_id}/prt_xxx.json         → 실제 텍스트 내용 (type, text)
```

## 작업

### 1단계: remind_read.ts 수정 [@빌드망고]

**변경 사항**
- [ ] order 파라미터 추가 (asc/desc, 기본: desc)
- [ ] 메시지 파일의 time.created로 시간순 정렬
- [ ] 정렬 후 limit 적용

**수정 코드 방향**
```typescript
args: {
  session_id: tool.schema.string().describe("세션 ID"),
  limit: tool.schema.number().optional().describe("최대 메시지 개수"),
  order: tool.schema.enum(["asc", "desc"]).optional().describe("정렬 순서 (기본: desc)"),
},
execute: async ({ session_id, limit, order = "desc" }) => {
  // 1. message/*.json에서 time.created 추출하여 정렬
  // 2. order에 따라 asc/desc 정렬
  // 3. limit 적용
  // 4. part/에서 실제 내용 읽기
}
```

**검증**
- [ ] limit=3 지정 시 최신 3개 메시지 반환 확인
- [ ] order=asc 지정 시 오래된 순서로 반환 확인
- [ ] order 미지정 시 최신순(desc) 반환 확인

### 2단계: remind_search.ts 수정 [@빌드망고]

**변경 사항**
- [ ] session_id 유무와 관계없이 part/에서 검색
- [ ] session_id 지정 시: 해당 세션의 메시지 ID 목록 조회 → part/에서 해당 ID만 검색
- [ ] session_id 미지정 시: 전체 part/에서 검색 (기존 동작 유지)

**수정 코드 방향**
```typescript
execute: async ({ query, session_id, limit = 20 }) => {
  if (session_id) {
    // 1. message/{session_id}/*.json에서 msg_id 목록 추출
    // 2. part/{msg_id}/*.json에서 query 검색
    // 3. 결과 반환
  } else {
    // 기존: 전체 part/에서 검색
  }
}
```

**검증**
- [ ] session_id 지정 시 해당 세션 내용에서만 검색 결과 반환 확인
- [ ] session_id 미지정 시 전체 검색 동작 확인
- [ ] 검색어가 part/ 내용에서 찾아지는지 확인

### 3단계: 버전 업데이트 [@빌드망고]

- [ ] package.json version: 0.0.11 → 0.0.12

### 4단계: PR 생성 및 머지 [@플랜망고]

- [ ] PR 생성: `[#25] ensia96 (2026-01-21)`
- [ ] 코드 리뷰 요청
- [ ] 머지 후 배포 확인

## 검증 체크리스트

### 자동 검증
- [ ] `bun run build` 성공
- [ ] TypeScript 컴파일 에러 없음

### 수동 검증

#### remind_read 검증
```bash
# 최신 3개 메시지 확인 (기본 desc)
# 예상: 가장 최근 메시지 3개 출력

# 오래된 순 3개 메시지 확인
# order=asc, limit=3
# 예상: 가장 오래된 메시지 3개 출력
```

#### remind_search 검증
```bash
# session_id 지정하여 검색
# 예상: 해당 세션의 part/ 내용에서 검색 결과 반환

# session_id 없이 전체 검색
# 예상: 전체 part/에서 검색 결과 반환
```

### 자동화 제안
- 향후 통합 테스트 추가 고려 (remind 도구 E2E 테스트)

## 마무리 항목

- [ ] package.json 버전 0.0.12로 업데이트
- [ ] plan.md 삭제
- [ ] PR 머지
- [ ] npm 배포 확인 (`npm view oh-my-mango version`)
- [ ] 이슈 #25 자동 클로즈 확인

## 참고

- 저장소: https://github.com/ensia96/oh-my-mango
- 수정 대상 파일:
  - `src/tools/remind/read.ts`
  - `src/tools/remind/search.ts`
  - `package.json`
