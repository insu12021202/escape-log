/** 고정 장르 태그 12개. Spec: §4.2 */
export const GENRE_TAGS = [
  '공포',
  '감성',
  '추리',
  '스릴러',
  '코믹',
  '액션',
  '잠입/미션',
  '판타지',
  '어드벤처',
  '미스터리',
  '드라마',
  'SF',
] as const

export type GenreTag = (typeof GENRE_TAGS)[number]
