import { supabase } from '@/shared/api/supabase'
import type { Room } from '../types'

const ROOM_SELECT = 'id, vendor_id, theme_name, region, created_at, vendors(id, name)'

/** DB 행 → Room 엔티티 변환 (vendors JOIN 포함) */
function toRoom(row: Record<string, unknown>): Room {
  const vendor = row.vendors as { id: string; name: string } | null
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    vendorName: vendor?.name ?? '',
    themeName: row.theme_name as string,
    region: row.region as string,
    createdAt: row.created_at as string,
  }
}

/** 키워드로 방 검색 (업체명·테마명·지역). Spec: §4.2 */
export async function searchRooms(keyword: string): Promise<Room[]> {
  const q = keyword.trim()

  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error

  const allRooms = (data ?? []).map(toRoom)
  if (!q) return allRooms.slice(0, 50)

  const lowerQ = q.toLowerCase()
  return allRooms
    .filter(
      (r) =>
        r.vendorName.toLowerCase().includes(lowerQ) ||
        r.themeName.toLowerCase().includes(lowerQ) ||
        r.region.toLowerCase().includes(lowerQ),
    )
    .slice(0, 50)
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

/** 새 방 등록. Spec: §4.2 */
export async function createRoom(params: {
  vendorId: string
  themeName: string
  region: string
}): Promise<Room> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      vendor_id: params.vendorId,
      theme_name: params.themeName,
      region: params.region,
      created_by: user?.id,
    })
    .select(ROOM_SELECT)
    .single()
  if (error) throw error
  return toRoom(data)
}
