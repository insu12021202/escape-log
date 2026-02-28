import { supabase } from '@/shared/api/supabase'
import type { Room } from '../types'

const ROOM_SELECT = 'id, vendor_id, theme_name, poster_path, created_at, vendors(id, name, region)'

/** DB 행 → Room 엔티티 변환 (vendors JOIN 포함) */
function toRoom(row: Record<string, unknown>): Room {
  const vendor = row.vendors as { id: string; name: string; region: string } | null
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    vendorName: vendor?.name ?? '',
    themeName: row.theme_name as string,
    region: vendor?.region ?? '',
    posterPath: (row.poster_path as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

/** 전체 방 목록 조회 (리뷰 목록 등에서 room map 구축용) */
export async function fetchAllRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toRoom)
}

/** 키워드로 방 검색 (업체명·테마명·지역). Spec: §4.2 */
export async function searchRooms(keyword: string): Promise<Room[]> {
  const q = keyword.trim()
  if (!q) return fetchAllRooms()

  const allRooms = await fetchAllRooms()
  const lowerQ = q.toLowerCase()
  return allRooms.filter(
    (r) =>
      r.vendorName.toLowerCase().includes(lowerQ) ||
      r.themeName.toLowerCase().includes(lowerQ) ||
      r.region.toLowerCase().includes(lowerQ),
  )
}

/** 업체별 방 목록 조회 (캐스케이딩 선택용) */
export async function fetchRoomsByVendor(vendorId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_SELECT)
    .eq('vendor_id', vendorId)
    .order('theme_name')
  if (error) throw error
  return (data ?? []).map(toRoom)
}

/** 새 방 등록 (지역은 vendor에 포함). Spec: §4.2 */
export async function createRoom(params: {
  vendorId: string
  themeName: string
}): Promise<Room> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      vendor_id: params.vendorId,
      theme_name: params.themeName,
      created_by: user?.id,
    })
    .select(ROOM_SELECT)
    .single()
  if (error) throw error
  return toRoom(data)
}

/** 방 포스터 경로 업데이트 */
export async function updateRoomPosterPath(roomId: string, posterPath: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ poster_path: posterPath })
    .eq('id', roomId)
  if (error) throw error
}
