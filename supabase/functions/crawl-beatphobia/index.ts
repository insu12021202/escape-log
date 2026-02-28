import { fetchAndParse } from "../_shared/html-parser.ts"
import { normalizeRegion } from "../_shared/region-normalizer.ts"
import { upsertRooms } from "../_shared/upsert-rooms.ts"
import type { CrawledRoom, CrawlResult } from "../_shared/types.ts"

/** 비트포비아(xphobia) + 미션브레이크 CGV 지점 매핑 */
const BRANCH_MAP: Record<string, string> = {
  "Phobia 대학로": "대학로",
  "Phobia 명동": "명동",
  "Phobia 동성로": "대구",
  "미션 브레이크 CGV": "용산",
  "미션브레이크 CGV": "용산",
  "Mission Break CGV": "용산",
}

function resolveBranch(raw: string): string {
  const trimmed = raw.trim()
  if (BRANCH_MAP[trimmed]) return BRANCH_MAP[trimmed]
  for (const [key, val] of Object.entries(BRANCH_MAP)) {
    if (trimmed.includes(key)) return val
  }
  return normalizeRegion(trimmed)
}

async function crawl(): Promise<CrawledRoom[]> {
  const doc = await fetchAndParse(
    "https://www.xphobia.net/quest/quest_list.php",
  )
  if (!doc) throw new Error("HTML 파싱 실패")

  const rooms: CrawledRoom[] = []

  // 테마 카드: <h5><a>테마명</a></h5> 구조
  const themeCards = doc.querySelectorAll("h5")
  for (const h5 of themeCards) {
    const a = h5.querySelector("a")
    if (!a) continue

    const themeName = (a.textContent ?? "").trim()
    if (!themeName) continue

    // 지점명: h5의 부모 컨테이너 내 <ul><li> 중 지점 정보
    let branchRegion = ""
    const parent = h5.parentElement
    if (parent) {
      const lis = parent.querySelectorAll("li")
      for (const li of lis) {
        const text = (li.textContent ?? "").trim()
        // 지점명 패턴: "Phobia XXX" 또는 "미션 브레이크"
        if (text.includes("Phobia") || text.includes("미션") || text.includes("Mission")) {
          branchRegion = resolveBranch(text)
          break
        }
      }
    }

    if (!branchRegion) branchRegion = "서울"

    rooms.push({
      vendor_name: "비트포비아",
      theme_name: themeName,
      region: branchRegion,
    })
  }

  return rooms
}

Deno.serve(async (_req) => {
  const errors: string[] = []
  let allRooms: CrawledRoom[] = []

  try {
    allRooms = await crawl()
  } catch (e) {
    errors.push((e as Error).message)
  }

  const result = allRooms.length > 0
    ? await upsertRooms(allRooms)
    : { inserted: 0, skipped: 0, errors: [] }

  const response: CrawlResult = {
    source: "beatphobia",
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
