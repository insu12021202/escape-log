import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import type { CrawledRoom } from "./types.ts"

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
}

/** (vendor_name, region) 조합 → vendor_id Map 구축 (없으면 생성) */
async function resolveVendorIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  rooms: CrawledRoom[],
): Promise<Map<string, string>> {
  // key = "name||region"
  const combos = new Map<string, { name: string; region: string }>()
  for (const r of rooms) {
    const key = `${r.vendor_name}||${r.region}`
    if (!combos.has(key)) combos.set(key, { name: r.vendor_name, region: r.region })
  }

  const map = new Map<string, string>() // key → vendor_id

  // 기존 vendors 조회
  const uniqueNames = [...new Set(rooms.map((r) => r.vendor_name))]
  const { data: existing } = await supabase
    .from("vendors")
    .select("id, name, region")
    .in("name", uniqueNames)

  for (const v of existing ?? []) {
    const key = `${v.name}||${v.region}`
    map.set(key, v.id)
  }

  // 없는 (name, region) 조합 생성
  const missing = [...combos.entries()]
    .filter(([key]) => !map.has(key))
    .map(([, val]) => val)

  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("vendors")
      .upsert(
        missing.map(({ name, region }) => ({ name, region })),
        { onConflict: "name,region", ignoreDuplicates: true },
      )
      .select("id, name, region")

    for (const v of created ?? []) {
      const key = `${v.name}||${v.region}`
      map.set(key, v.id)
    }
  }

  return map
}

export async function upsertRooms(
  rooms: CrawledRoom[],
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()

  const vendorMap = await resolveVendorIds(supabase, rooms)

  const BATCH_SIZE = 100
  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rooms.length; i += BATCH_SIZE) {
    const batch = rooms.slice(i, i + BATCH_SIZE)
    const rows = batch
      .map((r) => {
        const key = `${r.vendor_name}||${r.region}`
        const vendorId = vendorMap.get(key)
        if (!vendorId) return null
        return {
          vendor_id: vendorId,
          theme_name: r.theme_name,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (rows.length === 0) continue

    const { data, error } = await supabase
      .from("rooms")
      .upsert(rows, {
        onConflict: "vendor_id,theme_name",
        ignoreDuplicates: true,
      })
      .select("id")

    if (error) {
      errors.push(`Batch ${i}: ${error.message}`)
    } else {
      inserted += data?.length ?? 0
      skipped += batch.length - (data?.length ?? 0)
    }
  }

  return { inserted, skipped, errors }
}
