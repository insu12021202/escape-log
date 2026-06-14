/**
 * "YYYY-MM-DD" 또는 ISO 문자열을 "YY.MM"으로.
 * 리뷰 카드 푸터 메타용 (짧은 형식).
 */
export function formatYearMonth(dateStr: string): string {
  return dateStr.slice(2, 7).replace(/-/g, '.')
}

/**
 * "YYYY-MM-DD" 또는 ISO 문자열을 "YY.MM.DD"으로.
 * 리뷰 상세 메타 그리드 셀용.
 */
export function formatVisitedDate(dateStr: string): string {
  return dateStr.slice(2, 10).replace(/-/g, '.')
}

/**
 * ISO 문자열을 "YYYY.MM.DD"으로.
 * 리뷰 상세 푸터 작성일용 (긴 형식).
 */
export function formatFullDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10).replace(/-/g, '.')
}

/**
 * "YYYY-MM-DD" 또는 ISO 문자열을 "YYYY.MM"으로.
 * 타임라인 월 구분 헤더·여정 선 월 라벨용.
 */
export function formatMonth(dateStr: string): string {
  return dateStr.slice(0, 7).replace('-', '.')
}
