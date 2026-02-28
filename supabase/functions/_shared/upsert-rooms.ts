import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import type { CrawledRoom } from "./types.ts"

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
}

/** vendor_name 목록 → vendor_id Map 구축 (없으면 생성) */
async function resolveVendorIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  vendorNames: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(vendorNames)]
  const map = new Map<string, string>()

  const { data: existing } = await supabase
    .from("vendors")
    .select("id, name")
    .in("name", unique)

  for (const v of existing ?? []) {
    map.set(v.name, v.id)
  }

  const missing = unique.filter((n) => !map.has(n))
  if (missing.length > 0) {
    const { data: created } = await supabase
      .from("vendors")
      .upsert(
        missing.map((name) => ({ name })),
        { onConflict: "name", ignoreDuplicates: true },
      )
      .select("id, name")

    for (const v of created ?? []) {
      map.set(v.name, v.id)
    }
  }

  return map
}

export async function upsertRooms(
  rooms: CrawledRoom[],
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()

  const vendorNames = rooms.map((r) => r.vendor_name)
  const vendorMap = await resolveVendorIds(supabase, vendorNames)

  const BATCH_SIZE = 100
  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rooms.length; i += BATCH_SIZE) {
    const batch = rooms.slice(i, i + BATCH_SIZE)
    const rows = batch
      .map((r) => {
        const vendorId = vendorMap.get(r.vendor_name)
        if (!vendorId) return null
        return {
          vendor_id: vendorId,
          theme_name: r.theme_name,
          region: r.region,
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (rows.length === 0) continue

    const { data, error } = await supabase
      .from("rooms")
      .upsert(rows, {
        onConflict: "vendor_id,theme_name,region",
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
