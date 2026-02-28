<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchReviewById, enableSharing, deleteReview } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import { supabase } from '@/shared/api/supabase'
import { shareReviewViaKakao } from '@/shared/lib/kakao'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import { ArrowLeftIcon, PencilSquareIcon, ShareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import { useToastStore } from '@/shared/model/toast'

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

    const result = await shareReviewViaKakao({
      token,
      vendorName: room.value.vendorName,
      themeName: room.value.themeName,
      rating: review.value.rating,
      summary: review.value.summary,
      isSuccess: review.value.visitMeta.isSuccess,
    })

    if (result === 'copied') toast.info('링크가 복사되었습니다.')
    else if (result === 'failed') toast.error('공유에 실패했습니다.')
  } catch {
    toast.error('공유에 실패했습니다.')
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
    toast.error('삭제에 실패했습니다.')
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
        <ArrowLeftIcon class="review-detail-page__back-icon" /> 목록으로
      </RouterLink>
      <div class="review-detail-page__actions">
        <button
          v-if="isOwner()"
          class="review-detail-page__action-btn"
          :disabled="sharing"
          title="공유"
          @click="handleShare"
        >
          <ShareIcon class="review-detail-page__action-icon" />
        </button>
        <RouterLink
          v-if="isOwner()"
          :to="`/review/${review!.id}/edit`"
          class="review-detail-page__action-btn"
          title="수정"
        >
          <PencilSquareIcon class="review-detail-page__action-icon" />
        </RouterLink>
        <button
          v-if="isOwner()"
          class="review-detail-page__action-btn review-detail-page__action-btn--danger"
          title="삭제"
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
      리뷰를 불러오는 데 실패했습니다.
    </p>
    <ReviewDetail v-else-if="review && room" :review="review" :room="room" />
    <p v-else class="review-detail-page__status">리뷰를 찾을 수 없습니다.</p>

    <!-- 삭제 확인 다이얼로그 -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="리뷰를 삭제할까요?"
      message="삭제된 리뷰는 복구할 수 없습니다."
      confirm-label="삭제"
      cancel-label="취소"
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

.review-detail-page__back {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--color-primary);
  text-decoration: none;
}

.review-detail-page__back:hover {
  text-decoration: underline;
}

.review-detail-page__back-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.review-detail-page__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-detail-page__action-btn {
  color: var(--color-primary);
  text-decoration: none;
  padding: 6px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: background var(--transition-fast), color var(--transition-fast);
  background: none;
  cursor: pointer;
}

.review-detail-page__action-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.review-detail-page__action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-detail-page__action-btn--danger {
  color: var(--color-error);
  border-color: var(--color-error);
}

.review-detail-page__action-btn--danger:hover {
  background: var(--color-error);
  color: #fff;
}

.review-detail-page__action-icon {
  width: 18px;
  height: 18px;
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
