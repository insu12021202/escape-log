import { supabase } from '@/shared/api/supabase'
import type { Vendor } from '../types'

function toVendor(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  }
}

/** 전체 업체 목록 조회 (이름 정렬) */
export async function fetchVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, created_at')
    .order('name')
  if (error) throw error
  return (data ?? []).map(toVendor)
}

/** 업체 조회 또는 생성 (이름 기준) */
export async function findOrCreateVendor(name: string): Promise<Vendor> {
  const trimmed = name.trim()

  const { data: existing, error: findErr } = await supabase
    .from('vendors')
    .select('id, name, created_at')
    .eq('name', trimmed)
    .maybeSingle()
  if (findErr) throw findErr
  if (existing) return toVendor(existing)

  const { data, error } = await supabase
    .from('vendors')
    .insert({ name: trimmed })
    .select('id, name, created_at')
    .single()
  if (error) throw error
  return toVendor(data)
}
