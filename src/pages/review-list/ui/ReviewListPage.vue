<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchReviews } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewCard from '@/features/review-list/ui/ReviewCard.vue'

const reviews = ref<Review[]>([])
const rooms = ref<Record<string, Room>>({})
const loading = ref(true)
const error = ref<string | null>(null)

const regionFilter = ref('')
const ratingFilter = ref(0)

const regions = computed(() => [...new Set(Object.values(rooms.value).map((r) => r.region))])

const filteredReviews = computed(() => {
  return reviews.value.filter((review) => {
    const room = rooms.value[review.roomId]
    if (!room) return false
    if (regionFilter.value && room.region !== regionFilter.value) return false
    if (ratingFilter.value && review.rating < ratingFilter.value) return false
    return true
  })
})

onMounted(async () => {
  try {
    const [data, allRooms] = await Promise.all([fetchReviews(), searchRooms('')])
    reviews.value = data
    rooms.value = Object.fromEntries(allRooms.map((r) => [r.id, r]))
  } catch (e) {
    error.value = '리뷰를 불러오는 데 실패했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="review-list">
    <h2 class="review-list__title">리뷰 목록</h2>

    <div v-if="loading" class="review-list__status">불러오는 중...</div>

    <template v-else-if="error">
      <p class="review-list__status review-list__status--error">{{ error }}</p>
    </template>

    <template v-else>
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
          :author-name="review.authorName"
        />
      </div>
      <p v-else class="review-list__status">조건에 맞는 리뷰가 없습니다.</p>
    </template>
  </div>
</template>

<style scoped>
.review-list__title {
  margin-bottom: 16px;
}

.review-list__status {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.review-list__status--error {
  color: #e53935;
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
</style>
