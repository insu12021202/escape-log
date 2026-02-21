<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchReviewById } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'

const route = useRoute()

const review = ref<Review | null>(null)
const room = ref<Room | null>(null)
const loading = ref(true)
const fetchError = ref(false)

onMounted(async () => {
  try {
    const id = route.params.id as string
    const data = await fetchReviewById(id)
    if (!data) return
    review.value = data

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
    <RouterLink to="/" class="review-detail-page__back">&larr; 목록으로</RouterLink>
    <div v-if="loading" class="review-detail-page__status">불러오는 중...</div>
    <p v-else-if="fetchError" class="review-detail-page__status review-detail-page__status--error">
      리뷰를 불러오는 데 실패했습니다.
    </p>
    <ReviewDetail v-else-if="review && room" :review="review" :room="room" />
    <p v-else class="review-detail-page__status">리뷰를 찾을 수 없습니다.</p>
  </div>
</template>

<style scoped>
.review-detail-page__back {
  display: inline-block;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #4a90d9;
  text-decoration: none;
}

.review-detail-page__back:hover {
  text-decoration: underline;
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
