/**
 * 에이전트 호출 권한 시스템
 * 
 * - 망고(1계층): opencode의 Task 도구로 서브에이전트(plan-mango, coach-mango 등) 호출
 * - 관리 계층(plan-mango, coach-mango): call_mango 도구로 실행/어댑터 계층 호출 
 * - 실행/어댑터 계층: 다른 에이전트 호출 불가
 */

// 에이전트 식별자 타입
export type AgentId = 
  | 'mango'
  | 'plan-mango'
  | 'coach-mango'
  | 'research-mango'
  | 'build-mango'
  | 'issue-mango'
  | 'pr-mango';

// 호출 가능 대상 정의
// key: 호출하는 에이전트, value: 호출 가능한 대상 에이전트 목록
export const CALL_PERMISSIONS: Record<AgentId, AgentId[]> = {
  'mango': [], // opencode Task 도구로 서브에이전트 호출, call_mango 사용 안함
  'plan-mango': ['research-mango', 'build-mango', 'issue-mango', 'pr-mango'],
  'coach-mango': ['research-mango', 'build-mango', 'issue-mango', 'pr-mango'],
  'research-mango': [], // 실행 계층, 호출 불가
  'build-mango': [], // 실행 계층, 호출 불가
  'issue-mango': [], // 어댑터 계층, 호출 불가
  'pr-mango': [], // 어댑터 계층, 호출 불가
};

/**
 * 호출 권한 검증
 * @param caller 호출하는 에이전트
 * @param target 호출 대상 에이전트
 * @returns 호출 가능 여부
 */
export function canCall(caller: AgentId, target: AgentId): boolean {
  const allowedTargets = CALL_PERMISSIONS[caller];
  return allowedTargets?.includes(target) ?? false;
}

/**
 * 호출 가능한 대상 목록 반환
 * @param caller 호출하는 에이전트
 * @returns 호출 가능한 에이전트 목록
 */
export function getCallableTargets(caller: AgentId): AgentId[] {
  return CALL_PERMISSIONS[caller] ?? [];
}