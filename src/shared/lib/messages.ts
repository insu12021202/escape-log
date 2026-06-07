/**
 * UX 라이팅 문구 SSOT (횡단 공통 문구).
 *
 * 톤 원칙 (토스 보이스&톤):
 * - 해요체로 통일 (~합니다/~하십시오 금지)
 * - 에러는 사용자 탓 X + 다음 행동 안내
 * - 버튼은 결과가 보이게 ("확인" → "삭제하기")
 * - 토스트는 "~했어요"
 *
 * 용어: 다녀온 공간 = "테마", 업체·매장 = "지점", 작성물 = "리뷰".
 * 화면 전용 문구는 각 슬라이스에 colocated. 여기엔 여러 화면이 공유하는 것만 둔다.
 * 자세한 가이드: docs/ux-writing-guide.md
 */

/** 공통 버튼·라벨 */
export const COMMON = {
  confirm: '확인',
  cancel: '취소',
  close: '닫기',
  save: '저장하기',
  delete: '삭제하기',
  edit: '수정하기',
  next: '다음',
  retry: '다시 시도',
  loading: '잠시만요…',
  saving: '저장 중…',
  uploading: '올리는 중…',
} as const

/** 에러 — 사용자 탓 X, 다음 행동 안내 */
export const ERRORS = {
  loadReview: '리뷰를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  loadReviews: '리뷰 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  loadRooms: '테마 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  reviewNotFound: '리뷰를 찾을 수 없어요',
  uploadPhoto: '사진을 올리지 못했어요. 다시 시도해 주세요.',
  photoTooLarge: '사진은 한 장당 5MB까지 올릴 수 있어요',
  share: '공유하지 못했어요. 다시 시도해 주세요.',
  generic: '문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
} as const

/** 토스트 — "~했어요" */
export const TOAST = {
  reviewSaved: '리뷰를 저장했어요',
  reviewUpdated: '리뷰를 수정했어요',
  reviewDeleteFailed: '리뷰를 삭제하지 못했어요',
  photoDeleted: '사진을 삭제했어요',
  photoDeleteFailed: '사진을 삭제하지 못했어요',
  linkCopied: '링크를 복사했어요',
  roomAdded: '테마를 추가했어요',
  roomDeleted: '테마를 삭제했어요',
  roomDeleteFailed: '테마를 삭제하지 못했어요',
  storeDeleted: '지점을 삭제했어요',
  storeDeleteFailed: '지점을 삭제하지 못했어요',
  posterSaved: '포스터를 등록했어요',
  posterUploadFailed: '포스터를 올리지 못했어요',
} as const

/** 확인 다이얼로그 */
export const CONFIRM = {
  deleteReviewTitle: '이 리뷰를 삭제할까요?',
  deleteReviewMessage: '한 번 지우면 되돌릴 수 없어요',
  logoutTitle: '로그아웃할까요?',
} as const

/** 빈 상태 */
export const EMPTY = {
  noSearchTitle: '검색 결과가 없어요',
  noSearchMessage: '다른 조건으로 찾아보세요',
  noReviewsTitle: '아직 기록이 없어요',
  noReviewsMessage: '방탈출 다녀오셨어요? 첫 리뷰를 남겨보세요',
} as const
