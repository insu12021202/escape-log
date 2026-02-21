<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchReviews } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
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
        <div class="review-list__select-wrapper">
          <select v-model="regionFilter" class="review-list__select">
            <option value="">전체 지역</option>
            <option v-for="region in regions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
          <ChevronDownIcon class="review-list__select-icon" />
        </div>

        <div class="review-list__select-wrapper">
          <select v-model.number="ratingFilter" class="review-list__select">
            <option :value="0">전체 평점</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }}점 이상</option>
          </select>
          <ChevronDownIcon class="review-list__select-icon" />
        </div>
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

.review-list__select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.review-list__select {
  appearance: none;
  padding: 7px 34px 7px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: #fafafa;
  color: #444;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  outline: none;
}

.review-list__select:hover {
  border-color: #4a90d9;
  background: #f0f6ff;
}

.review-list__select:focus {
  border-color: #4a90d9;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

.review-list__select-icon {
  position: absolute;
  right: 10px;
  width: 14px;
  height: 14px;
  color: #999;
  pointer-events: none;
  transition: color 0.15s;
}

.review-list__select-wrapper:has(.review-list__select:hover) .review-list__select-icon,
.review-list__select-wrapper:has(.review-list__select:focus) .review-list__select-icon {
  color: #4a90d9;
}

.review-list__grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
