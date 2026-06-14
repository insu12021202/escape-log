/**
 * 탈출 속도 뱃지 — 빠른 탈출에 붙는 방탈출 은어.
 * 반갈죽 = 제한시간 절반 이상 남기고 탈출, 삼갈죽 = 2/3 이상 남기고 탈출.
 *
 * 한계: Room에 제한시간 컬럼이 없어 표준 60분을 가정한다.
 * 대부분의 테마가 60분이라 합리적이며, 정밀해지려면 후속으로
 * rooms.time_limit_min 컬럼을 추가해 ASSUMED_LIMIT_MIN을 대체한다.
 */
export const ASSUMED_LIMIT_MIN = 60

export type SpeedBadge = '삼갈죽' | '반갈죽'

/** 성공 + 남은 시간 기준 속도 뱃지. 해당 없으면 null */
export function getSpeedBadge(
  remainingMinutes: number | null | undefined,
  isSuccess: boolean,
): SpeedBadge | null {
  if (!isSuccess || remainingMinutes == null || remainingMinutes <= 0) return null
  const ratio = remainingMinutes / ASSUMED_LIMIT_MIN
  if (ratio >= 2 / 3) return '삼갈죽'
  if (ratio >= 1 / 2) return '반갈죽'
  return null
}
