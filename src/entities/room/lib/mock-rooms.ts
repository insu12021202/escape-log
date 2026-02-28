import type { Room } from '../types'

export const MOCK_ROOMS: Room[] = [
  {
    id: 'room-1',
    vendorId: 'vendor-1',
    vendorName: '넥스트에디션',
    themeName: '셜록홈즈: 마지막 사건',
    region: '강남',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'room-2',
    vendorId: 'vendor-2',
    vendorName: '비트포비아',
    themeName: '어둠 속의 비밀',
    region: '홍대',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'room-3',
    vendorId: 'vendor-3',
    vendorName: '시크릿가든',
    themeName: '별빛이 내리는 밤',
    region: '건대',
    createdAt: '2026-01-01T00:00:00Z',
  },
]
