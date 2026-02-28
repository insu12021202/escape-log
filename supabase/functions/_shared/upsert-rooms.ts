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

/** 외부 이미지 URL → Supabase Storage 업로드 → poster_path 반환 */
async function uploadPosterFromUrl(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  roomId: string,
  posterUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(posterUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EscapeLog-Crawler/1.0)" },
    })
    if (!res.ok) return null

    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
    const blob = await res.blob()

    const path = `${roomId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from("room-posters")
      .upload(path, blob, { contentType })

    if (error) {
      console.error(`포스터 업로드 실패 (${roomId}):`, error.message)
      return null
    }
    return path
  } catch (e) {
    console.error(`포스터 다운로드 실패 (${posterUrl}):`, (e as Error).message)
    return null
  }
}

export async function upsertRooms(
  rooms: CrawledRoom[],
): Promise<{ inserted: number; skipped: number; posters_uploaded: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()

  const vendorMap = await resolveVendorIds(supabase, rooms)

  const BATCH_SIZE = 100
  let inserted = 0
  let skipped = 0
  let postersUploaded = 0
  const errors: string[] = []

  // poster_url이 있는 방 목록 (upsert 후 처리)
  const roomsWithPoster: Array<{ vendor_id: string; theme_name: string; poster_url: string }> = []

  for (let i = 0; i < rooms.length; i += BATCH_SIZE) {
    const batch = rooms.slice(i, i + BATCH_SIZE)
    const rows = batch
      .map((r) => {
        const key = `${r.vendor_name}||${r.region}`
        const vendorId = vendorMap.get(key)
        if (!vendorId) return null

        if (r.poster_url) {
          roomsWithPoster.push({ vendor_id: vendorId, theme_name: r.theme_name, poster_url: r.poster_url })
        }

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

  // 포스터가 없는 방에 포스터 업로드
  for (const rp of roomsWithPoster) {
    // 해당 방 조회 (poster_path 없는 경우만 업로드)
    const { data: roomRow } = await supabase
      .from("rooms")
      .select("id, poster_path")
      .eq("vendor_id", rp.vendor_id)
      .eq("theme_name", rp.theme_name)
      .maybeSingle()

    if (!roomRow || roomRow.poster_path) continue

    const posterPath = await uploadPosterFromUrl(supabase, roomRow.id, rp.poster_url)
    if (posterPath) {
      const { error: updateErr } = await supabase
        .from("rooms")
        .update({ poster_path: posterPath })
        .eq("id", roomRow.id)

      if (!updateErr) postersUploaded++
      else errors.push(`포스터 DB 업데이트 실패 (${rp.theme_name}): ${updateErr.message}`)
    }
  }

  return { inserted, skipped, posters_uploaded: postersUploaded, errors }
}
