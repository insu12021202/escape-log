import { supabase } from '@/shared/api/supabase'
import type { Vendor } from '../types'

function toVendor(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    name: row.name as string,
    region: row.region as string,
    createdAt: row.created_at as string,
  }
}

/** 전체 업체 목록 조회 (이름 → 지역 정렬) */
export async function fetchVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, region, created_at')
    .order('name')
    .order('region')
  if (error) throw error
  return (data ?? []).map(toVendor)
}

/** 업체 삭제 (하위 방도 함께 삭제됨 — FK CASCADE) */
export async function deleteVendor(vendorId: string): Promise<void> {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', vendorId)
  if (error) throw error
}

/** 업체 조회 또는 생성 (이름+지역 기준) */
export async function findOrCreateVendor(name: string, region: string): Promise<Vendor> {
  const trimmedName = name.trim()
  const trimmedRegion = region.trim()

  const { data: existing, error: findErr } = await supabase
    .from('vendors')
    .select('id, name, region, created_at')
    .eq('name', trimmedName)
    .eq('region', trimmedRegion)
    .maybeSingle()
  if (findErr) throw findErr
  if (existing) return toVendor(existing)

  const { data, error } = await supabase
    .from('vendors')
    .insert({ name: trimmedName, region: trimmedRegion })
    .select('id, name, region, created_at')
    .single()
  if (error) throw error
  return toVendor(data)
}
