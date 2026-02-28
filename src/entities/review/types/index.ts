/** 리뷰 공개 범위. Spec: §5, §7 DECISIONS */
export type Visibility = 'group' | 'private' | 'link'

/** 보조 지표 (1~5). Spec: §3.2 */
export interface SubMetrics {
  puzzleQuality: number
  storyDirection: number
  setQuality: number
  horror: number
  puzzleDifficulty: number
  clearDifficulty: number
}

/** 방문 메타. Spec: §3.3 */
export interface VisitMeta {
  isSuccess: boolean
  remainingMinutes: number | null
  headcount: number
  genreTags: string[]
  customGenre: string | null
  wouldRevisit: boolean
}

/** 리뷰 엔티티. Spec: §3, §4.1 */
export interface Review {
  id: string
  userId: string
  authorName: string | null
  roomId: string
  rating: number
  summary: string
  subMetrics: SubMetrics
  visitMeta: VisitMeta
  visitedAt: string | null
  body: string
  hasSpoiler: boolean
  photos: string[]
  visibility: Visibility
  shareToken: string | null
  createdAt: string
  updatedAt: string
}
