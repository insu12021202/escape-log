/**
 * id 문자열을 결정적 3자리 시리얼(#NNN)로 변환.
 * 카드/상세 헤더의 모노 시리얼 라벨 용도.
 */
export function makeSerial(id: string | null | undefined): string {
  if (!id) return '#000'
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return '#' + String(sum % 9999).padStart(3, '0')
}
