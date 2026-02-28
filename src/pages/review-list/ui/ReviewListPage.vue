<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchReviews } from '@/entities/review/api'
import { fetchAllRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewCard from '@/features/review-list/ui/ReviewCard.vue'
import ReviewCardSkeleton from '@/features/review-list/ui/ReviewCardSkeleton.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import { getRoomPosterUrl } from '@/shared/api/storage'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()

const reviews = ref<Review[]>([])
const rooms = ref<Record<string, Room>>({})
const loading = ref(true)
const error = ref<string | null>(null)

type Tab = 'mine' | 'all'
const activeTab = ref<Tab>('mine')

const searchQuery = ref('')
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

const hasActiveFilter = computed(() =>
  !!searchQuery.value.trim() || !!regionFilter.value || ratingFilter.value > 0,
)

const filteredReviews = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return baseReviews.value.filter((review) => {
    const room = rooms.value[review.roomId]
    if (!room) return false
    if (q && !`${room.vendorName} ${room.themeName}`.toLowerCase().includes(q)) return false
    if (regionFilter.value && room.region !== regionFilter.value) return false
    if (ratingFilter.value && review.rating < ratingFilter.value) return false
    return true
  })
})

function clearFilters() {
  searchQuery.value = ''
  regionFilter.value = ''
  ratingFilter.value = 0
}

function switchTab(tab: Tab) {
  activeTab.value = tab
  searchQuery.value = ''
  regionFilter.value = ''
  ratingFilter.value = 0
}

onMounted(async () => {
  try {
    const [data, allRooms] = await Promise.all([fetchReviews(), fetchAllRooms()])
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
    <!-- 스켈레톤 로딩 -->
    <div v-if="loading" class="review-list__grid">
      <ReviewCardSkeleton v-for="i in 3" :key="i" />
    </div>

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

      <!-- 검색 + 필터 -->
      <div class="review-list__search-bar">
        <input
          v-model="searchQuery"
          class="review-list__search-input"
          type="search"
          placeholder="업체명 · 테마명 검색"
        />
      </div>
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
          :visited-at="review.visitedAt"
          :remaining-minutes="review.visitMeta.remainingMinutes"
          :has-spoiler="review.hasSpoiler"
          :poster-url="rooms[review.roomId]?.posterPath ? getRoomPosterUrl(rooms[review.roomId]!.posterPath!) : null"
        />
      </div>
      <div v-else class="review-list__empty">
        <!-- 필터/검색 적용 중인데 결과 없음 -->
        <template v-if="hasActiveFilter">
          <p class="review-list__empty-title">검색 결과가 없어요</p>
          <p class="review-list__empty-desc">다른 조건으로 검색해보세요.</p>
          <button class="review-list__empty-btn" @click="clearFilters">필터 초기화</button>
        </template>
        <!-- 내 기록 탭 비어있음 -->
        <template v-else-if="activeTab === 'mine'">
          <p class="review-list__empty-title">아직 기록이 없어요</p>
          <p class="review-list__empty-desc">방탈출 다녀오셨나요? 첫 리뷰를 남겨보세요.</p>
          <RouterLink to="/review/new" class="review-list__empty-cta">+ 첫 리뷰 작성하기</RouterLink>
        </template>
        <!-- 전체 탭 비어있음 -->
        <template v-else>
          <p class="review-list__empty-title">리뷰가 없어요</p>
          <p class="review-list__empty-desc">아직 작성된 리뷰가 없습니다.</p>
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

/* 검색 */
.review-list__search-bar {
  margin-bottom: 8px;
  position: sticky;
  top: 52px;
  background: var(--color-bg);
  padding-top: 12px;
  z-index: 10;
}

.review-list__search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color var(--transition-fast);
}

.review-list__search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.review-list__search-input::placeholder {
  color: var(--color-text-muted);
}

/* 필터 */
.review-list__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  position: sticky;
  top: 104px; /* 헤더 52px + 검색바 ~52px */
  background: var(--color-bg);
  padding: 0 0 12px;
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
  margin-bottom: 16px;
}

.review-list__empty-cta {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--transition-fast);
}

.review-list__empty-cta:hover {
  background: var(--color-primary-dark);
}

.review-list__empty-btn {
  padding: 8px 16px;
  background: var(--color-bg-subtle);
  color: var(--color-text-sub);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.review-list__empty-btn:hover {
  background: var(--color-border);
}
</style>
