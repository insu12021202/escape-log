import { supabase } from './supabase'

export const PHOTO_BUCKET = 'review-photos'

/**
 * Supabase Storage에 사진 파일 업로드. Spec: §3.4
 * @returns 저장된 파일 경로 (review_photos.path에 저장되는 값)
 */
export async function uploadPhoto(reviewId: string, file: File, sortOrder: number): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${reviewId}/${sortOrder}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error

  return path
}

/** Storage 경로 → 공개 URL */
export function getPhotoPublicUrl(path: string): string {
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
