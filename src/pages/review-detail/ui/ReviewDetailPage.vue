<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { MOCK_REVIEWS } from '@/entities/review/lib/mock-reviews'
import { MOCK_ROOMS } from '@/entities/room/lib/mock-rooms'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'

const route = useRoute()

const rooms = Object.fromEntries(MOCK_ROOMS.map((r) => [r.id, r]))

const review = computed(() => MOCK_REVIEWS.find((r) => r.id === route.params.id))
const room = computed(() => (review.value ? rooms[review.value.roomId] : undefined))
</script>

<template>
  <div class="review-detail-page">
    <RouterLink to="/" class="review-detail-page__back">&larr; 목록으로</RouterLink>
    <ReviewDetail v-if="review && room" :review="review" :room="room" />
    <p v-else class="review-detail-page__not-found">리뷰를 찾을 수 없습니다.</p>
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

.review-detail-page__not-found {
  color: #999;
  text-align: center;
  padding: 40px 0;
}
</style>
