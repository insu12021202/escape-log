<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchReviewById } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import { supabase } from '@/shared/api/supabase'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'

const route = useRoute()

const review = ref<Review | null>(null)
const room = ref<Room | null>(null)
const loading = ref(true)
const fetchError = ref(false)
const currentUserId = ref<string | null>(null)

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
      <RouterLink
        v-if="review && currentUserId && review.userId === currentUserId"
        :to="`/review/${review.id}/edit`"
        class="review-detail-page__edit-btn"
        title="수정"
      >
        <PencilSquareIcon class="review-detail-page__edit-icon" />
      </RouterLink>
    </div>
    <AppSpinner v-if="loading" />
    <p v-else-if="fetchError" class="review-detail-page__status review-detail-page__status--error">
      리뷰를 불러오는 데 실패했습니다.
    </p>
    <ReviewDetail v-else-if="review && room" :review="review" :room="room" />
    <p v-else class="review-detail-page__status">리뷰를 찾을 수 없습니다.</p>
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

.review-detail-page__edit-btn {
  color: #4a90d9;
  text-decoration: none;
  padding: 6px;
  border: 1px solid #4a90d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
}

.review-detail-page__edit-btn:hover {
  background: #4a90d9;
  color: #fff;
}

.review-detail-page__edit-icon {
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
</style>
