import { fetchAndParse, delay } from "../_shared/html-parser.ts"
import { normalizeRegion } from "../_shared/region-normalizer.ts"
import { upsertRooms } from "../_shared/upsert-rooms.ts"
import type { CrawledRoom, CrawlResult } from "../_shared/types.ts"

/** 셜록홈즈 지점 목록 (sido, bno → 지점명) */
const BRANCHES: Array<{ sido: number; bno: number; name: string; region: string }> = [
  { sido: 1, bno: 107, name: "잠실새내점", region: "잠실" },
  { sido: 4, bno: 105, name: "송도트리플점", region: "송도" },
  { sido: 4, bno: 101, name: "부평2호점", region: "부평" },
  { sido: 9, bno: 108, name: "수원인계점", region: "수원" },
  { sido: 9, bno: 106, name: "수지구청점", region: "용인" },
  { sido: 9, bno: 109, name: "안양범계점", region: "안양" },
  { sido: 13, bno: 110, name: "군산수송점", region: "군산" },
]

async function crawlBranch(
  branch: (typeof BRANCHES)[0],
): Promise<CrawledRoom[]> {
  const url = `https://sherlock-holmes.co.kr/reservation/index.php?sido=${branch.sido}&bno=${branch.bno}`
  const doc = await fetchAndParse(url)
  if (!doc) return []

  const rooms: CrawledRoom[] = []

  // 테마 카드에서 테마명 추출 — <h4>, <h3> 또는 테마 제목 요소
  const candidates = doc.querySelectorAll(
    ".theme_tit, .theme-name, h4, h3, .tit",
  )
  for (const el of candidates) {
    const text = (el.textContent ?? "").trim()
    // 필터: 빈 문자열, 메뉴 항목 등 제외
    if (
      text &&
      text.length > 1 &&
      text.length < 50 &&
      !text.includes("예약") &&
      !text.includes("안내") &&
      !text.includes("셜록홈즈")
    ) {
      rooms.push({
        vendor_name: "셜록홈즈",
        theme_name: text,
        region: normalizeRegion(branch.region),
      })
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
    await delay(800)
  }

  const result = allRooms.length > 0
    ? await upsertRooms(allRooms)
    : { inserted: 0, skipped: 0, errors: [] }

  const response: CrawlResult = {
    source: "sherlock",
    total_crawled: allRooms.length,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: [...errors, ...result.errors],
    crawled_at: new Date().toISOString(),
  }

  return new Response(JSON.stringify(response, null, 2), {
    headers: { "Content-Type": "application/json" },
  })
})
