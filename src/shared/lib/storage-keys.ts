/**
 * localStorage 키 상수.
 * 로그아웃 시 일괄 정리 또는 키 변경 시 한 곳에서 관리.
 */
export const REVIEW_DRAFT_KEY = 'escape-log:review-draft'

/**
 * 사용자별로 한 번 펼친 스포일러는 다시 가리지 않도록 기억.
 * 키: `${REVEALED_SPOILER_PREFIX}${reviewId}`
 */
export const REVEALED_SPOILER_PREFIX = 'escape-log:revealed:'

/** 로그아웃 시 정리할 키들 */
export function clearUserScopedStorage() {
  localStorage.removeItem(REVIEW_DRAFT_KEY)
  // revealed:* 패턴 일괄 삭제
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(REVEALED_SPOILER_PREFIX)) toRemove.push(k)
  }
  toRemove.forEach((k) => localStorage.removeItem(k))
}
