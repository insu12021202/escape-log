const REGION_MAP: Record<string, string> = {
  // 서울
  "강남": "강남",
  "강남구": "강남",
  "강남점": "강남",
  "강남역": "강남",
  "강남 더오름": "강남",
  "신논현": "강남",
  "서초": "강남",
  "홍대": "홍대",
  "홍대입구": "홍대",
  "홍대점": "홍대",
  "합정": "홍대",
  "건대": "건대",
  "건대입구": "건대",
  "건대점": "건대",
  "잠실": "잠실",
  "잠실점": "잠실",
  "신림": "신림",
  "신림점": "신림",
  "대학로": "대학로",
  "혜화": "대학로",
  "혜화점": "대학로",
  "명동": "명동",
  "명동점": "명동",
  // 수도권
  "서현": "분당",
  "분당": "분당",
  "안양": "안양",
  "수원": "수원",
  "김포": "김포",
  "부천": "부천",
  "안산": "안산",
  "과천": "과천",
  // 지방
  "부산": "부산",
  "부산점": "부산",
  "부산 서면": "부산",
  "서면": "부산",
  "대구": "대구",
  "동성로": "대구",
  "대전": "대전",
  "광주": "광주",
  "전주": "전주",
  "전주점": "전주",
  "제주": "제주",
  "원주": "원주",
  "천안": "천안",
  "용인": "용인",
  "에버랜드": "용인",
}

export function normalizeRegion(raw: string): string {
  const trimmed = raw.trim()
  if (REGION_MAP[trimmed]) return REGION_MAP[trimmed]

  const stripped = trimmed.replace(/점$/, "")
  if (REGION_MAP[stripped]) return REGION_MAP[stripped]

  for (const [key, value] of Object.entries(REGION_MAP)) {
    if (trimmed.includes(key)) return value
  }

  return trimmed
}
