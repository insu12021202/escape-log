<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchReviewById, enableSharing, deleteReview } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import { supabase } from '@/shared/api/supabase'
import { shareReviewViaKakao } from '@/shared/lib/kakao'
import {
  getTrailStepLabel,
  isLifeTheme,
  LIFE_THEME_LABEL,
} from '@/entities/review/lib/trail-grade'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import { ArrowLeftIcon, PencilSquareIcon, ShareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import { useToastStore } from '@/shared/model/toast'
import { COMMON, CONFIRM, ERRORS, TOAST } from '@/shared/lib/messages'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const review = ref<Review | null>(null)
const room = ref<Room | null>(null)
const loading = ref(true)
const fetchError = ref(false)
const currentUserId = ref<string | null>(null)

const sharing = ref(false)

const showDeleteDialog = ref(false)
const deleting = ref(false)

async function handleShare() {
  if (!review.value || !room.value || sharing.value) return
  sharing.value = true
  try {
    const token = await enableSharing(review.value.id)
    review.value = { ...review.value, shareToken: token, visibility: 'link' }

    const r = review.value
    const gradeLabel = isLifeTheme(r.rating, r.visitMeta.wouldRevisit)
      ? LIFE_THEME_LABEL
      : getTrailStepLabel(r.rating)

    const result = await shareReviewViaKakao({
      token,
      vendorName: room.value.vendorName,
      themeName: room.value.themeName,
      gradeLabel,
      summary: r.summary,
      isSuccess: r.visitMeta.isSuccess,
    })

    if (result === 'copied') toast.info(TOAST.linkCopied)
    else if (result === 'failed') toast.error(ERRORS.share)
  } catch {
    toast.error(ERRORS.share)
  } finally {
    sharing.value = false
  }
}

async function handleDelete() {
  if (!review.value || deleting.value) return
  deleting.value = true
  try {
    await deleteReview(review.value.id, review.value.photos)
    showDeleteDialog.value = false
    router.push('/')
  } catch {
    toast.error(TOAST.reviewDeleteFailed)
    deleting.value = false
  }
}

const isOwner = () =>
  review.value && currentUserId.value && review.value.userId === currentUserId.value

onMounted(async () => {
  try {
    const id = route.params.id as string
    const [data, { data: { user } }] = await Promise.all([
      fetchReviewById(id),
      supabase.auth.getUser(),
    ])
    if (!data) return
    review.value = data
    currentUserId.value = user?.id ?? null

    const allRooms = await searchRooms('')
    room.value = allRooms.find((r) => r.id === data.roomId) ?? null
  } catch (e) {
    fetchError.value = true
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="review-detail-page">
    <div class="review-detail-page__nav">
      <RouterLink to="/" class="review-detail-page__back">
        <ArrowLeftIcon class="review-detail-page__back-icon" /> 홈으로
      </RouterLink>
      <div class="review-detail-page__actions">
        <button
          v-if="isOwner()"
          class="review-detail-page__action-btn"
          :disabled="sharing"
          title="공유하기"
          aria-label="공유하기"
          @click="handleShare"
        >
          <ShareIcon class="review-detail-page__action-icon" />
        </button>
        <RouterLink
          v-if="isOwner()"
          :to="`/review/${review!.id}/edit`"
          class="review-detail-page__action-btn"
          title="수정하기"
          aria-label="수정하기"
        >
          <PencilSquareIcon class="review-detail-page__action-icon" />
        </RouterLink>
        <button
          v-if="isOwner()"
          class="review-detail-page__action-btn review-detail-page__action-btn--danger"
          title="삭제하기"
          aria-label="삭제하기"
          @click="showDeleteDialog = true"
        >
          <TrashIcon class="review-detail-page__action-icon" />
        </button>
      </div>
    </div>

    <!-- 스켈레톤 로딩 -->
    <div v-if="loading" class="review-detail-page__skeleton">
      <div class="review-detail-page__skeleton-room">
        <SkeletonBlock width="140px" height="18px" />
        <SkeletonBlock width="100px" height="16px" />
      </div>
      <div class="review-detail-page__skeleton-rating">
        <SkeletonBlock width="120px" height="20px" />
        <SkeletonBlock width="48px" height="24px" border-radius="99px" />
      </div>
      <SkeletonBlock width="90%" height="16px" />
      <div class="review-detail-page__skeleton-section">
        <SkeletonBlock width="80px" height="12px" />
        <SkeletonBlock height="14px" />
        <SkeletonBlock height="14px" />
        <SkeletonBlock height="14px" />
      </div>
      <div class="review-detail-page__skeleton-section">
        <SkeletonBlock width="80px" height="12px" />
        <SkeletonBlock height="14px" />
        <SkeletonBlock height="14px" />
      </div>
    </div>

    <p v-else-if="fetchError" class="review-detail-page__status review-detail-page__status--error">
      {{ ERRORS.loadReview }}
    </p>
    <ReviewDetail v-else-if="review && room" :review="review" :room="room" />
    <p v-else class="review-detail-page__status">{{ ERRORS.reviewNotFound }}</p>

    <!-- 삭제 확인 다이얼로그 -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      :title="CONFIRM.deleteReviewTitle"
      :message="CONFIRM.deleteReviewMessage"
      :confirm-label="COMMON.delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
.review-detail-page__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* 뒤로가기 — 밑줄 링크가 아니라 중립 고스트 칩 */
.review-detail-page__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: -6px;
  padding: 7px 13px 7px 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-600);
  text-decoration: none;
  border-radius: 999px;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.review-detail-page__back:hover {
  background: var(--ink-100);
  color: var(--ink-900);
}

.review-detail-page__back-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

.review-detail-page__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 액션 — 테두리 박스가 아니라 고스트 원형 아이콘 버튼 */
.review-detail-page__action-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-500);
  background: none;
  border: none;
  border-radius: 999px;
  text-decoration: none;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.review-detail-page__action-btn:hover {
  background: var(--ink-100);
  color: var(--ink-900);
}

.review-detail-page__action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.review-detail-page__action-btn:disabled:hover {
  background: none;
  color: var(--ink-500);
}

.review-detail-page__action-btn--danger:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.review-detail-page__action-icon {
  width: 19px;
  height: 19px;
}

.review-detail-page__status {
  color: var(--color-text-muted);
  text-align: center;
  padding: 40px 0;
}

.review-detail-page__status--error {
  color: var(--color-error);
}

/* 스켈레톤 */
.review-detail-page__skeleton {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-detail-page__skeleton-room {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-detail-page__skeleton-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-detail-page__skeleton-section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

</style>
