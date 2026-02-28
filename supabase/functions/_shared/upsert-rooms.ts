import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import type { CrawledRoom } from "./types.ts"

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
}

export async function upsertRooms(
  rooms: CrawledRoom[],
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()
  const BATCH_SIZE = 100
  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < rooms.length; i += BATCH_SIZE) {
    const batch = rooms.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from("rooms")
      .upsert(
        batch.map((r) => ({
          vendor_name: r.vendor_name,
          theme_name: r.theme_name,
          region: r.region,
        })),
        {
          onConflict: "vendor_name,theme_name,region",
          ignoreDuplicates: true,
        },
      )
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
