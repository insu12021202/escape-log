import { supabase } from '@/shared/api/supabase'
import type { Room } from '../types'

/** DB 행 → Room 엔티티 변환 */
function toRoom(row: Record<string, unknown>): Room {
  return {
    id: row.id as string,
    vendorName: row.vendor_name as string,
    themeName: row.theme_name as string,
    region: row.region as string,
    createdAt: row.created_at as string,
  }
}

/** 키워드로 방 검색 (업체명·테마명·지역). Spec: §4.2 */
export async function searchRooms(keyword: string): Promise<Room[]> {
  const q = keyword.trim()
  if (!q) {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, vendor_name, theme_name, region, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []).map(toRoom)
  }

  const { data, error } = await supabase
    .from('rooms')
    .select('id, vendor_name, theme_name, region, created_at')
    .or(`vendor_name.ilike.%${q}%,theme_name.ilike.%${q}%,region.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map(toRoom)
}

/** 새 방 등록. Spec: §4.2 */
export async function createRoom(params: {
  vendorName: string
  themeName: string
  region: string
}): Promise<Room> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      vendor_name: params.vendorName,
      theme_name: params.themeName,
      region: params.region,
      created_by: user?.id,
    })
    .select('id, vendor_name, theme_name, region, created_at')
    .single()
  if (error) throw error
  return toRoom(data)
}
