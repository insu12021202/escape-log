<script setup lang="ts">
import { ref, computed } from 'vue'
import { MOCK_REVIEWS } from '@/entities/review/lib/mock-reviews'
import { MOCK_ROOMS } from '@/entities/room/lib/mock-rooms'
import ReviewCard from '@/features/review-list/ui/ReviewCard.vue'

const rooms = Object.fromEntries(MOCK_ROOMS.map((r) => [r.id, r]))

const regionFilter = ref('')
const ratingFilter = ref(0)

const regions = [...new Set(MOCK_ROOMS.map((r) => r.region))]

const filteredReviews = computed(() => {
  return MOCK_REVIEWS.filter((review) => {
    const room = rooms[review.roomId]
    if (!room) return false
    if (regionFilter.value && room.region !== regionFilter.value) return false
    if (ratingFilter.value && review.rating < ratingFilter.value) return false
    return true
  })
})
</script>

<template>
  <div class="review-list">
    <h2 class="review-list__title">리뷰 목록</h2>

    <div class="review-list__filters">
      <select v-model="regionFilter" class="review-list__select">
        <option value="">전체 지역</option>
        <option v-for="region in regions" :key="region" :value="region">
          {{ region }}
        </option>
      </select>

      <select v-model.number="ratingFilter" class="review-list__select">
        <option :value="0">전체 평점</option>
        <option v-for="n in 5" :key="n" :value="n">{{ n }}점 이상</option>
      </select>
    </div>

    <div v-if="filteredReviews.length" class="review-list__grid">
      <ReviewCard
        v-for="review in filteredReviews"
        :key="review.id"
        :data-id="review.id"
        :rating="review.rating"
        :summary="review.summary"
        :vendor-name="rooms[review.roomId]?.vendorName ?? ''"
        :theme-name="rooms[review.roomId]?.themeName ?? ''"
        :region="rooms[review.roomId]?.region ?? ''"
        :is-success="review.visitMeta.isSuccess"
        :genre-tags="review.visitMeta.genreTags"
      />
    </div>
    <p v-else class="review-list__empty">조건에 맞는 리뷰가 없습니다.</p>
  </div>
</template>

<style scoped>
.review-list__title {
  margin-bottom: 16px;
}

.review-list__filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.review-list__select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #fff;
}

.review-list__grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-list__empty {
  color: #999;
  text-align: center;
  padding: 40px 0;
}
</style>
