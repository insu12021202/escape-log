import { supabase } from '@/shared/api/supabase'
import type { Review, Visibility } from '../types'
import type { Room } from '@/entities/room/types'

const REVIEW_SELECT = `
  id, user_id, room_id, group_id,
  overall_rating, one_liner,
  puzzle_quality, story_direction, set_device_quality, fear, puzzle_difficulty, clear_difficulty,
  visited_at, success, time_left_min, party_size, revisit_intent, custom_genre,
  content, visibility, share_token,
  created_at, updated_at,
  review_tags ( tags ( name ) ),
  review_photos ( path, sort_order ),
  profiles ( display_name )
`.trim()

/** DB 행 → Review 엔티티 변환 */
function toReview(row: Record<string, unknown>): Review {
  const tagRows = (row.review_tags as Array<{ tags: { name: string } }>) ?? []
  const genreTags = tagRows.map((rt) => rt.tags.name)

  const photoRows = (row.review_photos as Array<{ path: string; sort_order: number }>) ?? []
  const photos = photoRows
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.path)

  const profileRow = row.profiles as { display_name: string } | null
  return {
    id: row.id as string,
    userId: row.user_id as string,
    authorName: profileRow?.display_name ?? null,
    roomId: row.room_id as string,
    rating: row.overall_rating as number,
    summary: row.one_liner as string,
    subMetrics: {
      puzzleQuality: row.puzzle_quality as number,
      storyDirection: row.story_direction as number,
      setQuality: row.set_device_quality as number,
      horror: row.fear as number,
      puzzleDifficulty: row.puzzle_difficulty as number,
      clearDifficulty: row.clear_difficulty as number,
    },
    visitMeta: {
      isSuccess: row.success as boolean,
      remainingMinutes: row.time_left_min as number | null,
      headcount: row.party_size as number,
      genreTags,
      customGenre: row.custom_genre as string | null,
      wouldRevisit: row.revisit_intent as boolean,
    },
    visitedAt: row.visited_at as string,
    body: (row.content as string) ?? '',
    photos,
    visibility: row.visibility as Visibility,
    shareToken: row.share_token as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/** 내 그룹의 리뷰 목록 조회. Spec: §5 */
export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(toReview)
}

/** 리뷰 단건 조회. Spec: §5 */
export async function fetchReviewById(id: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return toReview(data as unknown as Record<string, unknown>)
}

/** 리뷰 생성. Spec: §3 */
export async function createReview(params: {
  roomId: string
  groupId: string
  visitedAt: string
  rating: number
  summary: string
  subMetrics: Review['subMetrics']
  visitMeta: Omit<Review['visitMeta'], 'genreTags' | 'customGenre'>
  genreTagIds: string[]
  customGenre: string | null
  body: string
  visibility: Visibility
}): Promise<Review> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: reviewRow, error: insertError } = await supabase
    .from('reviews')
    .insert({
      user_id: user?.id,
      room_id: params.roomId,
      group_id: params.groupId,
      visited_at: params.visitedAt,
      overall_rating: params.rating,
      one_liner: params.summary,
      puzzle_quality: params.subMetrics.puzzleQuality,
      story_direction: params.subMetrics.storyDirection,
      set_device_quality: params.subMetrics.setQuality,
      fear: params.subMetrics.horror,
      puzzle_difficulty: params.subMetrics.puzzleDifficulty,
      clear_difficulty: params.subMetrics.clearDifficulty,
      success: params.visitMeta.isSuccess,
      time_left_min: params.visitMeta.remainingMinutes,
      party_size: params.visitMeta.headcount,
      revisit_intent: params.visitMeta.wouldRevisit,
      custom_genre: params.customGenre,
      content: params.body,
      visibility: params.visibility,
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  const reviewId = (reviewRow as { id: string }).id

  // 태그 연결
  if (params.genreTagIds.length > 0) {
    const { error: tagError } = await supabase.from('review_tags').insert(
      params.genreTagIds.map((tagId) => ({ review_id: reviewId, tag_id: tagId })),
    )
    if (tagError) throw tagError
  }

  const created = await fetchReviewById(reviewId)
  if (!created) throw new Error('리뷰 조회 실패')
  return created
}

/** 리뷰 수정. Spec: §5 (작성자만 가능) */
export async function updateReview(
  id: string,
  params: {
    visitedAt: string
    rating: number
    summary: string
    subMetrics: Review['subMetrics']
    visitMeta: Omit<Review['visitMeta'], 'genreTags' | 'customGenre'>
    genreTagIds: string[]
    customGenre: string | null
    body: string
    visibility: Visibility
  },
): Promise<Review> {
  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      visited_at: params.visitedAt,
      overall_rating: params.rating,
      one_liner: params.summary,
      puzzle_quality: params.subMetrics.puzzleQuality,
      story_direction: params.subMetrics.storyDirection,
      set_device_quality: params.subMetrics.setQuality,
      fear: params.subMetrics.horror,
      puzzle_difficulty: params.subMetrics.puzzleDifficulty,
      clear_difficulty: params.subMetrics.clearDifficulty,
      success: params.visitMeta.isSuccess,
      time_left_min: params.visitMeta.remainingMinutes,
      party_size: params.visitMeta.headcount,
      revisit_intent: params.visitMeta.wouldRevisit,
      custom_genre: params.customGenre,
      content: params.body,
      visibility: params.visibility,
    })
    .eq('id', id)

  if (updateError) throw updateError

  // 태그 재설정: 기존 삭제 후 재삽입
  const { error: deleteTagError } = await supabase
    .from('review_tags')
    .delete()
    .eq('review_id', id)
  if (deleteTagError) throw deleteTagError

  if (params.genreTagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('review_tags')
      .insert(params.genreTagIds.map((tagId) => ({ review_id: id, tag_id: tagId })))
    if (tagError) throw tagError
  }

  const updated = await fetchReviewById(id)
  if (!updated) throw new Error('리뷰 조회 실패')
  return updated
}

/** RPC를 통한 공유 리뷰 조회. Spec: §6 */
export async function getSharedReview(
  shareToken: string,
): Promise<{ review: Review; room: Room } | null> {
  const { data, error } = await supabase.rpc('get_shared_review', {
    p_share_token: shareToken,
  })
  if (error) throw error
  if (!data || data.length === 0) return null

  const row = data[0] as Record<string, unknown>
  const room: Room = {
    id: row.room_id as string,
    vendorName: row.vendor_name as string,
    themeName: row.theme_name as string,
    region: row.region as string,
    createdAt: '',
  }
  const review: Review = {
    id: row.review_id as string,
    userId: '',
    authorName: null,
    roomId: row.room_id as string,
    rating: row.overall_rating as number,
    summary: row.one_liner as string,
    subMetrics: {
      puzzleQuality: row.puzzle_quality as number,
      storyDirection: row.story_direction as number,
      setQuality: row.set_device_quality as number,
      horror: row.fear as number,
      puzzleDifficulty: row.puzzle_difficulty as number,
      clearDifficulty: row.clear_difficulty as number,
    },
    visitMeta: {
      isSuccess: row.success as boolean,
      remainingMinutes: row.time_left_min as number | null,
      headcount: row.party_size as number,
      genreTags: (row.tags as string[]) ?? [],
      customGenre: row.custom_genre as string | null,
      wouldRevisit: row.revisit_intent as boolean,
    },
    visitedAt: row.visited_at as string,
    body: (row.content as string) ?? '',
    photos: (row.photo_paths as string[]) ?? [],
    visibility: 'link',
    shareToken,
    createdAt: '',
    updatedAt: '',
  }
  return { review, room }
}

/**
 * 공유 링크 활성화. visibility='link', share_token 발급. Spec: §6
 * 이미 token이 있으면 재사용.
 */
export async function enableSharing(id: string): Promise<string> {
  // 기존 토큰 확인
  const { data: existing, error: fetchErr } = await supabase
    .from('reviews')
    .select('share_token, visibility')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const row = existing as { share_token: string | null; visibility: string }
  if (row.share_token && row.visibility === 'link') return row.share_token

  const token = row.share_token ?? crypto.randomUUID()
  const { error: updateErr } = await supabase
    .from('reviews')
    .update({ visibility: 'link', share_token: token })
    .eq('id', id)
  if (updateErr) throw updateErr
  return token
}

/** 리뷰 사진 경로를 review_photos 테이블에 등록. Spec: §3.4 */
export async function attachReviewPhoto(
  reviewId: string,
  path: string,
  sortOrder: number,
): Promise<void> {
  const { error } = await supabase
    .from('review_photos')
    .insert({ review_id: reviewId, path, sort_order: sortOrder })
  if (error) throw error
}

/** 시스템 태그(장르) 목록 조회 */
export async function fetchGenreTags(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name')
    .eq('type', 'genre')
    .order('name')
  if (error) throw error
  return (data ?? []) as Array<{ id: string; name: string }>
}
