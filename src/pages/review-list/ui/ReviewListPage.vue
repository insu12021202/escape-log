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

const totalCount = computed(() => reviews.value.length)
const successRate = computed(() => {
  if (!totalCount.value) return null
  const succeeded = reviews.value.filter((r) => r.visitMeta.isSuccess).length
  return Math.round((succeeded / totalCount.value) * 100)
})

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
    <AppSpinner v-if="loading" />

    <template v-else-if="error">
      <p class="review-list__status review-list__status--error">{{ error }}</p>
    </template>

    <template v-else>
      <div class="review-list__hero">
        <div class="review-list__stats">
          <span class="review-list__stat">총 {{ totalCount }}개</span>
          <template v-if="successRate !== null">
            <span class="review-list__stat-sep">·</span>
            <span class="review-list__stat">성공률 {{ successRate }}%</span>
          </template>
        </div>
        <RouterLink to="/review/new" class="review-list__cta">+ 리뷰 등록</RouterLink>
      </div>

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
      <div v-else class="review-list__empty">
        <p class="review-list__empty-title">리뷰가 없어요</p>
        <p class="review-list__empty-desc">조건을 바꾸거나 새 리뷰를 작성해보세요.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.review-list__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 16px;
}

.review-list__stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-list__stat {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.review-list__stat-sep {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.review-list__cta {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.review-list__cta:hover {
  background: var(--color-primary-dark);
}

.review-list__status {
  color: var(--color-text-muted);
  text-align: center;
  padding: 40px 0;
}

.review-list__status--error {
  color: var(--color-error);
}

.review-list__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 52px;
  background: var(--color-bg);
  padding: 12px 0;
  z-index: 10;
}

.review-list__grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-list__empty {
  text-align: center;
  padding: 60px 0;
}

.review-list__empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-sub);
  margin-bottom: 6px;
}

.review-list__empty-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
