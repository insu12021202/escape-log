import { delay } from "../_shared/html-parser.ts"
import { normalizeRegion } from "../_shared/region-normalizer.ts"
import { upsertRooms } from "../_shared/upsert-rooms.ts"
import type { CrawledRoom, CrawlResult } from "../_shared/types.ts"

/** 키이스케이프 지점 목록 (zizum_num → 지점명) */
const BRANCHES: Array<{ num: number; name: string; region: string }> = [
  { num: 3, name: "강남점", region: "강남" },
  { num: 14, name: "강남 더오름", region: "강남" },
  { num: 10, name: "홍대점", region: "홍대" },
  { num: 9, name: "부산점", region: "부산" },
  { num: 7, name: "전주점", region: "전주" },
  { num: 16, name: "우주라이크", region: "강남" },
  { num: 18, name: "메모리컴퍼니", region: "강남" },
  { num: 19, name: "LOG_IN 1", region: "강남" },
  { num: 20, name: "LOG_IN 2", region: "강남" },
  { num: 22, name: "STATION", region: "강남" },
  { num: 23, name: "후즈데어", region: "강남" },
  { num: 25, name: "무비무드", region: "홍대" },
  { num: 26, name: "에버랜드", region: "용인" },
  { num: 29, name: "무비무드 전주", region: "전주" },
]

async function crawlBranch(
  branch: (typeof BRANCHES)[0],
): Promise<CrawledRoom[]> {
  const form = new URLSearchParams()
  form.set("t", "get_theme_info_list")
  form.set("zizum_num", String(branch.num))

  const res = await fetch("https://www.keyescape.com/controller/run_proc.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (compatible; EscapeLog-Crawler/1.0)",
      "Referer": "https://www.keyescape.com/reservation.php",
    },
    body: form.toString(),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const rooms: CrawledRoom[] = []

  // API 응답: { status: true, data: [...] }
  const list = Array.isArray(json) ? json : json.data
  if (Array.isArray(list)) {
    for (const item of list) {
      const themeName = (item.info_name ?? item.theme_name ?? "").trim()
      if (themeName) {
        rooms.push({
          vendor_name: "키이스케이프",
          theme_name: themeName,
          region: normalizeRegion(branch.region),
        })
      }
    }
  }

  return rooms
}

Deno.serve(async (_req) => {
  const allRooms: CrawledRoom[] = []
  const errors: string[] = []

  for (const branch of BRANCHES) {
    try {
      const rooms = await crawlBranch(branch)
      allRooms.push(...rooms)
    } catch (e) {
      errors.push(`${branch.name}: ${(e as Error).message}`)
    }
    await delay(500)
  }

  const result = await upsertRooms(allRooms)

  const response: CrawlResult = {
    source: "keyescape",
    total_crawled: allRooms.length,
    inserted: result.inserted,
    skipped: result.skipped,
    posters_uploaded: result.posters_uploaded,
    errors: [...errors, ...result.errors],
    crawled_at: new Date().toISOString(),
  }

  return new Response(JSON.stringify(response, null, 2), {
    headers: { "Content-Type": "application/json" },
  })
})
