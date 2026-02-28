import { upsertRooms } from "../_shared/upsert-rooms.ts"
import type { CrawledRoom, CrawlResult } from "../_shared/types.ts"

/**
 * 넥스트에디션은 테마 정보를 이미지로만 제공하여 HTML 크롤링이 불가.
 * 공식 사이트 기반으로 수동 정리한 정적 데이터를 사용합니다.
 * 신규 테마 추가 시 이 목록을 업데이트해야 합니다.
 */
const ROOMS: CrawledRoom[] = [
  // 강남점
  { vendor_name: "넥스트에디션", theme_name: "셜록홈즈: 마지막 사건", region: "강남" },
  { vendor_name: "넥스트에디션", theme_name: "월야환담 : 어느 구미호 이야기", region: "강남" },
  { vendor_name: "넥스트에디션", theme_name: "뱀파이어 하우스", region: "강남" },
  // 건대점
  { vendor_name: "넥스트에디션", theme_name: "SERENDIPITY", region: "건대" },
  { vendor_name: "넥스트에디션", theme_name: "Tester", region: "건대" },
  { vendor_name: "넥스트에디션", theme_name: "In the Mist", region: "건대" },
  // 신림점
  { vendor_name: "넥스트에디션", theme_name: "괴담", region: "신림" },
  { vendor_name: "넥스트에디션", theme_name: "BACK TO THE SCENE", region: "신림" },
  // 과천 (오프라인 영화 제작소)
  { vendor_name: "넥스트에디션", theme_name: "Reel", region: "과천" },
  { vendor_name: "넥스트에디션", theme_name: "소환", region: "과천" },
]

Deno.serve(async (_req) => {
  const result = await upsertRooms(ROOMS)

  const response: CrawlResult = {
    source: "nextedition",
    total_crawled: ROOMS.length,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors,
    crawled_at: new Date().toISOString(),
  }

  return new Response(JSON.stringify(response, null, 2), {
    headers: { "Content-Type": "application/json" },
  })
})
