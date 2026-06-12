/**
 * 재미 등급("길") — 방탈출 업계 은어를 서비스 표시 체계로 채택.
 * 별점(rating 1~5)을 꽃길/풀길/흙길 3단계로 번역한다.
 * 신규 DB 컬럼 없이 rating에서 파생하는 순수 로직. Spec: §3 (재미 등급 결정 로그)
 */
export type TrailGrade = 'flower' | 'grass' | 'dirt'

export interface TrailGradeMeta {
  grade: TrailGrade
  /** 표시 라벨 — 꽃길 / 풀길 / 흙길 */
  label: string
  /** 용어를 모르는 사용자를 위한 쉬운 말 (필터·온보딩 병기) */
  hint: string
  /** 색 토큰 (중간 톤) — 타임라인 노드·요약 바 */
  token: string
  /** 색 토큰 (진한 톤) — 칩 텍스트 가독성 */
  strongToken: string
  /** 색 토큰 (연한 톤) — 칩 배경 */
  softToken: string
}

export const TRAIL_META: Record<TrailGrade, TrailGradeMeta> = {
  flower: {
    grade: 'flower',
    label: '꽃길',
    hint: '재밌었어요',
    token: 'var(--trail-flower)',
    strongToken: 'var(--trail-flower-strong)',
    softToken: 'var(--trail-flower-soft)',
  },
  grass: {
    grade: 'grass',
    label: '풀길',
    hint: '무난했어요',
    token: 'var(--trail-grass)',
    strongToken: 'var(--trail-grass-strong)',
    softToken: 'var(--trail-grass-soft)',
  },
  dirt: {
    grade: 'dirt',
    label: '흙길',
    hint: '아쉬웠어요',
    token: 'var(--trail-dirt)',
    strongToken: 'var(--trail-dirt-strong)',
    softToken: 'var(--trail-dirt-soft)',
  },
}

/** 최고 평가 + 재방문 의사 → 인생테마 (꽃길의 특별형) */
export const LIFE_THEME_LABEL = '인생테마'

/**
 * 5단계 사다리 — rating(1~5)과 1:1. 별점을 대체하는 표시·입력 체계.
 * 흙길 < 흙풀길 < 풀길 < 풀꽃길 < 꽃길 (커뮤니티 용례 기반)
 */
export interface TrailStep {
  /** rating 값 (1~5) */
  value: number
  /** 단계 라벨 */
  label: string
  /** 용어를 모르는 사용자를 위한 쉬운 말 */
  hint: string
  /** 색 버킷 (타임라인·요약과 동일 축) */
  grade: TrailGrade
}

export const TRAIL_STEPS: TrailStep[] = [
  { value: 1, label: '흙길', hint: '많이 아쉬웠어요', grade: 'dirt' },
  { value: 2, label: '흙풀길', hint: '조금 아쉬웠어요', grade: 'dirt' },
  { value: 3, label: '풀길', hint: '무난했어요', grade: 'grass' },
  { value: 4, label: '풀꽃길', hint: '재밌었어요', grade: 'flower' },
  { value: 5, label: '꽃길', hint: '최고였어요', grade: 'flower' },
]

/** rating → 5단계 라벨 (흙길/흙풀길/풀길/풀꽃길/꽃길) */
export function getTrailStepLabel(rating: number): string {
  const r = normalizeRating(rating)
  return TRAIL_STEPS.find((s) => s.value === r)?.label ?? TRAIL_STEPS[0]!.label
}

/**
 * 단계 색 (CSS background 값) — 경계 단계는 두 버킷의 그라데이션.
 * 흙풀길(2)=갈색→초록, 풀꽃길(4)=초록→핑크. 나머지는 단색.
 */
export function getTrailStepColor(rating: number): string {
  switch (normalizeRating(rating)) {
    case 1:
      return 'var(--trail-dirt)'
    case 2:
      return 'linear-gradient(135deg, var(--trail-dirt) 20%, var(--trail-grass) 80%)'
    case 3:
      return 'var(--trail-grass)'
    case 4:
      return 'linear-gradient(135deg, var(--trail-grass) 20%, var(--trail-flower) 80%)'
    default:
      return 'var(--trail-flower)'
  }
}

/** 단계 연한 색 (칩 배경용) — 경계 단계는 soft 톤 그라데이션 */
export function getTrailStepSoftColor(rating: number): string {
  switch (normalizeRating(rating)) {
    case 1:
      return 'var(--trail-dirt-soft)'
    case 2:
      return 'linear-gradient(135deg, var(--trail-dirt-soft) 20%, var(--trail-grass-soft) 80%)'
    case 3:
      return 'var(--trail-grass-soft)'
    case 4:
      return 'linear-gradient(135deg, var(--trail-grass-soft) 20%, var(--trail-flower-soft) 80%)'
    default:
      return 'var(--trail-flower-soft)'
  }
}

/**
 * rating 정규화 — 1~5 정수로 보정.
 * 과거 별점 입력의 소수(4.5)·DB numeric의 문자열 표현이 들어와도
 * 라벨/색 판정이 갈라지지 않도록 모든 파생 함수의 입구에서 거친다.
 */
export function normalizeRating(rating: number): number {
  const n = Math.round(Number(rating))
  if (!Number.isFinite(n)) return 1
  return Math.min(5, Math.max(1, n))
}

/** rating(1~5) → 길 등급. 4~5 꽃길 / 3 풀길 / 1~2 흙길 */
export function getTrailGrade(rating: number): TrailGrade {
  const r = normalizeRating(rating)
  if (r >= 4) return 'flower'
  if (r === 3) return 'grass'
  return 'dirt'
}

/** rating → 등급 메타(라벨/색) */
export function getTrailMeta(rating: number): TrailGradeMeta {
  return TRAIL_META[getTrailGrade(rating)]
}

/** 인생테마 여부 — 5점이면서 재방문 의사가 있을 때 */
export function isLifeTheme(rating: number, wouldRevisit: boolean): boolean {
  return normalizeRating(rating) === 5 && wouldRevisit
}
