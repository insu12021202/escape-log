/** 업체(방탈출 카페) 엔티티. 업체+지역 = 하나의 매장 */
export interface Vendor {
  id: string
  name: string
  region: string
  createdAt: string
}
