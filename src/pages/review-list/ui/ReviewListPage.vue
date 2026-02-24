<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchReviews } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewCard from '@/features/review-list/ui/ReviewCard.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()

const reviews = ref<Review[]>([])
const rooms = ref<Record<string, Room>>({})
const loading = ref(true)
const error = ref<string | null>(null)

type Tab = 'mine' | 'all'
const activeTab = ref<Tab>('mine')

const regionFilter = ref('')
const ratingFilter = ref(0)

const myUserId = computed(() => session.user?.id ?? null)

/** 현재 탭의 기본 리뷰 목록 (필터 적용 전) */
const baseReviews = computed(() =>
  activeTab.value === 'mine'
    ? reviews.value.filter((r) => r.userId === myUserId.value)
    : reviews.value,
)

const regions = computed(() => [
  ...new Set(
    baseReviews.value
      .map((r) => rooms.value[r.roomId]?.region)
      .filter((r): r is string => !!r),
  ),
])

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

const totalCount = computed(() => baseReviews.value.length)
const successRate = computed(() => {
  if (!totalCount.value) return null
  const succeeded = baseReviews.value.filter((r) => r.visitMeta.isSuccess).length
  return Math.round((succeeded / totalCount.value) * 100)
})

const filteredReviews = computed(() => {
  return baseReviews.value.filter((review) => {
    const room = rooms.value[review.roomId]
    if (!room) return false
    if (regionFilter.value && room.region !== regionFilter.value) return false
    if (ratingFilter.value && review.rating < ratingFilter.value) return false
    return true
  })
})

function switchTab(tab: Tab) {
  activeTab.value = tab
  regionFilter.value = ''
  ratingFilter.value = 0
}

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
      <!-- 탭 -->
      <div class="review-list__tabs">
        <button
          class="review-list__tab"
          :class="{ 'review-list__tab--active': activeTab === 'mine' }"
          @click="switchTab('mine')"
        >내 기록</button>
        <button
          class="review-list__tab"
          :class="{ 'review-list__tab--active': activeTab === 'all' }"
          @click="switchTab('all')"
        >전체</button>
      </div>

      <!-- 통계 + CTA -->
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

      <!-- 필터 -->
      <div class="review-list__filters">
        <BaseSelect v-model="regionFilter" :options="regionOptions" />
        <BaseSelect v-model="ratingFilter" :options="ratingOptions" />
      </div>

      <!-- 리뷰 목록 -->
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
        <template v-if="activeTab === 'mine'">
          <p class="review-list__empty-title">아직 기록이 없어요</p>
          <p class="review-list__empty-desc">방탈출 다녀오셨나요? 첫 리뷰를 남겨보세요.</p>
        </template>
        <template v-else>
          <p class="review-list__empty-title">리뷰가 없어요</p>
          <p class="review-list__empty-desc">조건을 바꾸거나 새 리뷰를 작성해보세요.</p>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 탭 */
.review-list__tabs {
  display: flex;
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: 16px;
}

.review-list__tab {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1.5px;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.review-list__tab--active {
  color: var(--color-primary);
  font-weight: 700;
  border-bottom-color: var(--color-primary);
}

/* 통계 + CTA */
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
  padding: 6px 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--transition-fast);
}

.review-list__cta:hover {
  background: var(--color-primary-dark);
}

/* 상태 */
.review-list__status {
  color: var(--color-text-muted);
  text-align: center;
  padding: 40px 0;
}

.review-list__status--error {
  color: var(--color-error);
}

/* 필터 */
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

/* 그리드 */
.review-list__grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 빈 상태 */
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
