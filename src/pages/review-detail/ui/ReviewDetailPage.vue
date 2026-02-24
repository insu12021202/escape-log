<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchReviewById, enableSharing } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import { supabase } from '@/shared/api/supabase'
import { shareReviewViaKakao } from '@/shared/lib/kakao'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import { ArrowLeftIcon, PencilSquareIcon, ShareIcon } from '@heroicons/vue/24/outline'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'

const route = useRoute()

const review = ref<Review | null>(null)
const room = ref<Room | null>(null)
const loading = ref(true)
const fetchError = ref(false)
const currentUserId = ref<string | null>(null)

const sharing = ref(false)
const toastMsg = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = null }, 2500)
}

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

    if (result === 'copied') showToast('링크가 복사되었습니다.')
    else if (result === 'failed') showToast('공유에 실패했습니다.')
  } catch {
    showToast('공유에 실패했습니다.')
  } finally {
    sharing.value = false
  }
}

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
          v-if="review && currentUserId && review.userId === currentUserId"
          class="review-detail-page__action-btn"
          :disabled="sharing"
          title="공유"
          @click="handleShare"
        >
          <ShareIcon class="review-detail-page__action-icon" />
        </button>
        <RouterLink
          v-if="review && currentUserId && review.userId === currentUserId"
          :to="`/review/${review.id}/edit`"
          class="review-detail-page__action-btn"
          title="수정"
        >
          <PencilSquareIcon class="review-detail-page__action-icon" />
        </RouterLink>
      </div>
    </div>
    <AppSpinner v-if="loading" />
    <p v-else-if="fetchError" class="review-detail-page__status review-detail-page__status--error">
      리뷰를 불러오는 데 실패했습니다.
    </p>
    <ReviewDetail v-else-if="review && room" :review="review" :room="room" />
    <p v-else class="review-detail-page__status">리뷰를 찾을 수 없습니다.</p>

    <!-- 토스트 -->
    <Transition name="toast">
      <div v-if="toastMsg" class="review-detail-page__toast">{{ toastMsg }}</div>
    </Transition>
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
  color: #4a90d9;
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
  color: #4a90d9;
  text-decoration: none;
  padding: 6px;
  border: 1px solid #4a90d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
  background: none;
  cursor: pointer;
}

.review-detail-page__action-btn:hover {
  background: #4a90d9;
  color: #fff;
}

.review-detail-page__action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-detail-page__action-icon {
  width: 18px;
  height: 18px;
}

.review-detail-page__status {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.review-detail-page__status--error {
  color: #e53935;
}

/* 토스트 */
.review-detail-page__toast {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 0.875rem;
  padding: 10px 20px;
  border-radius: 99px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
