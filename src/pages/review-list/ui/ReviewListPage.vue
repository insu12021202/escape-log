<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchReviews } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewCard from '@/features/review-list/ui/ReviewCard.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'

const reviews = ref<Review[]>([])
const rooms = ref<Record<string, Room>>({})
const loading = ref(true)
const error = ref<string | null>(null)

const regionFilter = ref('')
const ratingFilter = ref(0)

const regions = computed(() => [...new Set(Object.values(rooms.value).map((r) => r.region))])

const regionOptions = computed(() => [
  { value: '', label: '전체 지역' },
  ...regions.value.map((r) => ({ value: r, label: r })),
])

const ratingOptions = [
  { value: 0, label: '전체 평점' },
  { value: 1, label: '1점 이상' },
  { value: 2, label: '2점 이상' },
  { value: 3, label: '3점 이상' },
  { value: 4, label: '4점 이상' },
  { value: 5, label: '5점 이상' },
]

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

    <AppSpinner v-if="loading" />

    <template v-else-if="error">
      <p class="review-list__status review-list__status--error">{{ error }}</p>
    </template>

    <template v-else>
      <div class="review-list__filters">
        <BaseSelect v-model="regionFilter" :options="regionOptions" />
        <BaseSelect v-model="ratingFilter" :options="ratingOptions" />
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
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}


.review-list__grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
