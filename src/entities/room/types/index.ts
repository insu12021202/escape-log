/** 방(테마) 엔티티. Spec: §4.1 */
export interface Room {
  id: string
  vendorId: string
  vendorName: string
  themeName: string
  region: string
  createdAt: string
}
