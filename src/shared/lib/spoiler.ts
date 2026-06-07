/**
 * 한 번 펼친 스포일러는 다시 가리지 않도록 localStorage에 기록.
 * 로그아웃 시 정리되도록 prefix 컨벤션 따름.
 */
const PREFIX = 'escape-log:revealed:'

export function hasRevealedSpoiler(reviewId: string): boolean {
  if (!reviewId) return false
  return localStorage.getItem(PREFIX + reviewId) === '1'
}

export function markSpoilerRevealed(reviewId: string) {
  if (!reviewId) return
  localStorage.setItem(PREFIX + reviewId, '1')
}
