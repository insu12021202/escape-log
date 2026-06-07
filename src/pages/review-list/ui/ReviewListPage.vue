<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { fetchReviews } from "@/entities/review/api";
import { fetchAllRooms } from "@/entities/room/api";
import type { Review } from "@/entities/review/types";
import type { Room } from "@/entities/room/types";
import ReviewCard from "@/features/review-list/ui/ReviewCard.vue";
import ReviewCardSkeleton from "@/features/review-list/ui/ReviewCardSkeleton.vue";
import BaseSelect from "@/shared/ui/BaseSelect.vue";
import AppChip from "@/shared/ui/AppChip.vue";
import { getRoomPosterUrl } from "@/shared/api/storage";
import { useSessionStore } from "@/app/stores/session";

const session = useSessionStore();

const reviews = ref<Review[]>([]);
const rooms = ref<Record<string, Room>>({});
const loading = ref(true);
const error = ref<string | null>(null);

type Tab = "mine" | "all";
const activeTab = ref<Tab>("mine");

const searchQuery = ref("");
const regionFilter = ref("");
const ratingFilter = ref(0);
const sortOrder = ref<"" | "asc" | "desc">("");

const sortOptions: Array<{ value: "" | "asc" | "desc"; label: string }> = [
  { value: "", label: "최신순" },
  { value: "desc", label: "평점 높은순" },
  { value: "asc", label: "평점 낮은순" },
];

const myUserId = computed(() => session.user?.id ?? null);

const baseReviews = computed(() =>
  activeTab.value === "mine"
    ? reviews.value.filter((r) => r.userId === myUserId.value)
    : reviews.value,
);

const regions = computed(() => [
  ...new Set(
    baseReviews.value
      .map((r) => rooms.value[r.roomId]?.region)
      .filter((r): r is string => !!r),
  ),
]);

const regionOptions = computed(() => [
  { value: "", label: "전체 지역" },
  ...regions.value.map((r) => ({ value: r, label: r })),
]);

const ratingOptions = [
  { value: 0, label: "전체 평점" },
  { value: 1, label: "1점 이상" },
  { value: 2, label: "2점 이상" },
  { value: 3, label: "3점 이상" },
  { value: 4, label: "4점 이상" },
  { value: 5, label: "5점 이상" },
];

const totalCount = computed(() => baseReviews.value.length);
const successRate = computed(() => {
  if (!totalCount.value) return null;
  const succeeded = baseReviews.value.filter(
    (r) => r.visitMeta.isSuccess,
  ).length;
  return Math.round((succeeded / totalCount.value) * 100);
});

const hasActiveFilter = computed(
  () =>
    !!searchQuery.value.trim() ||
    !!regionFilter.value ||
    ratingFilter.value > 0 ||
    !!sortOrder.value,
);

const filteredReviews = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const filtered = baseReviews.value.filter((review) => {
    const room = rooms.value[review.roomId];
    if (!room) return false;
    if (q && !`${room.vendorName} ${room.themeName}`.toLowerCase().includes(q))
      return false;
    if (regionFilter.value && room.region !== regionFilter.value) return false;
    if (ratingFilter.value && review.rating < ratingFilter.value) return false;
    return true;
  });
  if (sortOrder.value === "desc")
    return [...filtered].sort((a, b) => b.rating - a.rating);
  if (sortOrder.value === "asc")
    return [...filtered].sort((a, b) => a.rating - b.rating);
  return filtered;
});

function clearFilters() {
  searchQuery.value = "";
  regionFilter.value = "";
  ratingFilter.value = 0;
  sortOrder.value = "";
}

function switchTab(tab: Tab) {
  activeTab.value = tab;
  searchQuery.value = "";
  regionFilter.value = "";
  ratingFilter.value = 0;
  sortOrder.value = "";
}

// 페이지네이션 — 초기 50건 fetch, '더 보기'로 50건씩 추가.
const PAGE_SIZE = 50;
const loadingMore = ref(false);
const hasMore = ref(true);

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  try {
    const next = await fetchReviews({
      limit: PAGE_SIZE,
      offset: reviews.value.length,
    });
    if (next.length < PAGE_SIZE) hasMore.value = false;
    reviews.value = [...reviews.value, ...next];
  } catch (e) {
    console.error(e);
    error.value = "더 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
  } finally {
    loadingMore.value = false;
  }
}

onMounted(async () => {
  try {
    const [data, allRooms] = await Promise.all([
      fetchReviews({ limit: PAGE_SIZE }),
      fetchAllRooms(),
    ]);
    reviews.value = data;
    if (data.length < PAGE_SIZE) hasMore.value = false;
    rooms.value = Object.fromEntries(allRooms.map((r) => [r.id, r]));
  } catch (e) {
    error.value = "리뷰를 불러오는 데 실패했습니다.";
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="review-list">
    <!-- 다크 hero -->
    <section class="review-list__hero dot-bg-dark">
      <span class="review-list__hero-label label">LOG · INDEX</span>
      <h1 class="review-list__hero-title">방탈출 기록장</h1>
      <div class="review-list__hero-stats mono tnum">
        <span class="review-list__hero-stat">
          TOTAL <strong>{{ totalCount }}</strong>
        </span>
        <template v-if="successRate !== null">
          <span class="review-list__hero-sep">·</span>
          <span class="review-list__hero-stat">
            SUCCESS <strong>{{ successRate }}%</strong>
          </span>
        </template>
      </div>
    </section>

    <!-- 스켈레톤 로딩 -->
    <div v-if="loading" class="review-list__grid">
      <ReviewCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <template v-else-if="error">
      <p class="review-list__status review-list__status--error">{{ error }}</p>
    </template>

    <template v-else>
      <!-- 탭 -->
      <div class="review-list__tabs" role="tablist" aria-label="리뷰 범위">
        <AppChip
          role="tab"
          :aria-selected="activeTab === 'mine'"
          :active="activeTab === 'mine'"
          @click="switchTab('mine')"
        >
          내 기록
        </AppChip>
        <AppChip
          role="tab"
          :aria-selected="activeTab === 'all'"
          :active="activeTab === 'all'"
          @click="switchTab('all')"
        >
          전체
        </AppChip>
      </div>

      <!-- 검색 + 필터 (sticky) -->
      <div class="review-list__sticky-bar">
        <div class="review-list__search">
          <svg
            class="review-list__search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            class="review-list__search-input"
            type="search"
            placeholder="지점명 · 테마명 검색"
          />
        </div>
        <div class="review-list__filters">
          <BaseSelect v-model="regionFilter" :options="regionOptions" />
          <BaseSelect v-model="ratingFilter" :options="ratingOptions" />
          <BaseSelect v-model="sortOrder" :options="sortOptions" />
        </div>
      </div>

      <!-- 리뷰 그리드 -->
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
          :poster-url="
            rooms[review.roomId]?.posterPath
              ? getRoomPosterUrl(rooms[review.roomId]!.posterPath!)
              : null
          "
        />

        <button
          v-if="hasMore && !hasActiveFilter"
          type="button"
          class="review-list__load-more"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '불러오는 중...' : '더 보기' }}
        </button>
      </div>
      <div v-else class="review-list__empty">
        <pre class="review-list__empty-art mono">┌──────────────┐
│   ESC LOG    │
└──────────────┘</pre>
        <template v-if="hasActiveFilter">
          <p class="review-list__empty-title">검색 결과가 없어요</p>
          <p class="review-list__empty-desc">다른 조건으로 검색해보세요.</p>
          <button class="review-list__empty-btn" @click="clearFilters">
            필터 초기화
          </button>
        </template>
        <template v-else-if="activeTab === 'mine'">
          <p class="review-list__empty-title">아직 기록이 없어요</p>
          <p class="review-list__empty-desc">
            방탈출 다녀오셨나요? 첫 리뷰를 남겨보세요.
          </p>
          <RouterLink to="/review/new" class="review-list__empty-cta">
            + 첫 리뷰 작성하기
          </RouterLink>
        </template>
        <template v-else>
          <p class="review-list__empty-title">리뷰가 없어요</p>
          <p class="review-list__empty-desc">아직 작성된 리뷰가 없습니다.</p>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.review-list {
  position: relative;
}

/* ── 다크 hero ── */
.review-list__hero {
  margin: -20px -16px 0;
  padding: 24px 20px 20px;
  background-color: var(--ink-1000);
  color: var(--paper);
}

.review-list__hero-label {
  color: rgba(244, 237, 224, 0.55);
}

.review-list__hero-title {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--paper);
}

.review-list__hero-stats {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: rgba(244, 237, 224, 0.7);
}

.review-list__hero-stat strong {
  color: var(--paper);
  font-weight: 600;
}

.review-list__hero-sep {
  opacity: 0.4;
}

/* ── 탭 ── */
.review-list__tabs {
  display: flex;
  gap: 8px;
  padding: 16px 0 12px;
}

/* ── 검색 + 필터 sticky ── */
.review-list__sticky-bar {
  position: sticky;
  top: 52px;
  z-index: 10;
  margin: 0 -16px;
  padding: 12px 16px;
  background: rgba(244, 245, 247, 0.94);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.review-list__search {
  position: relative;
}

.review-list__search-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: var(--ink-500);
  pointer-events: none;
}

.review-list__search-input {
  width: 100%;
  height: 44px;
  padding: 0 12px 0 38px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  font-size: 14px;
  color: var(--ink-1000);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.review-list__search-input::placeholder {
  color: var(--ink-400);
}

.review-list__search-input:focus {
  outline: none;
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-50);
}

.review-list__filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

/* ── 그리드 ── */
.review-list__grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
}

/* ── 상태 ── */
.review-list__status {
  color: var(--color-text-muted);
  text-align: center;
  padding: 40px 0;
}

.review-list__status--error {
  color: var(--color-error);
}

/* ── 빈 상태 ── */
.review-list__empty {
  text-align: center;
  padding: 60px 0;
}

.review-list__empty-art {
  margin: 0 auto 16px;
  font-size: 11.5px;
  color: var(--ink-300);
  line-height: 1.4;
  white-space: pre;
  text-align: center;
}

.review-list__empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 6px;
}

.review-list__empty-desc {
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 16px;
}

.review-list__empty-cta {
  display: inline-flex;
  align-items: center;
  padding: 12px 22px;
  background: var(--ink-1000);
  color: var(--paper);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--transition-fast);
}

.review-list__empty-cta:hover {
  background: var(--ink-900);
}

.review-list__empty-btn {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--ink-700);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.review-list__empty-btn:hover {
  background: var(--ink-100);
}

.review-list__load-more {
  margin-top: 8px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--ink-700);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.review-list__load-more:hover:not(:disabled) {
  background: var(--ink-100);
}

.review-list__load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 640px) {
  .review-list__hero {
    margin: -28px -24px 0;
    padding: 32px 28px 24px;
  }

  .review-list__sticky-bar {
    margin: 0 -24px;
    padding: 12px 24px;
  }
}
</style>
