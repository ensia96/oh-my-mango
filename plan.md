# GitHub Actions 파이프라인 구축

## 배경
- PR 생성/업데이트 시 자동 build 검증 필요 (PR 망고/작업 망고가 파이프라인 결과만 확인하면 되도록)
- main 머지 시 자동 npm publish 필요 (버전 수정 및 plan.md 제거 후 머지하면 자동 배포)
- 관련 이슈: #15

## 작업
- [ ] `.github/workflows/ci.yml` 생성 (PR 검증용)
  - PR 생성/업데이트 시 트리거
  - bun install, build 실행
- [ ] `.github/workflows/publish.yml` 생성 (자동 배포용)
  - main 브랜치 push 시 트리거
  - bun install, build, npm publish 실행
  - NPM_TOKEN 시크릿 사용
- [ ] Repository Settings에 NPM_TOKEN 시크릿 등록 안내

## 검증
- PR 생성 시 CI 워크플로우가 자동 실행되는지 확인
- main 머지 후 npm publish가 자동 실행되는지 확인
