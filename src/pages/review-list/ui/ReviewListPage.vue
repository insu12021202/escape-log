<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { fetchReviews, fetchReviewsByUser } from "@/entities/review/api";
import { fetchAllRooms } from "@/entities/room/api";
import type { JourneyPoint, Review } from "@/entities/review/types";
import type { Room } from "@/entities/room/types";
import ReviewCard from "@/features/review-list/ui/ReviewCard.vue";
import ReviewTimeline from "@/features/review-list/ui/ReviewTimeline.vue";
import ReviewCardSkeleton from "@/features/review-list/ui/ReviewCardSkeleton.vue";
import BaseSelect from "@/shared/ui/BaseSelect.vue";
import AppChip from "@/shared/ui/AppChip.vue";
import { getRoomPosterUrl } from "@/shared/api/storage";
import { useSessionStore } from "@/app/stores/session";
import { ERRORS, EMPTY } from "@/shared/lib/messages";
import {
  TRAIL_META,
  getTrailGrade,
  type TrailGrade,
} from "@/entities/review/lib/trail-grade";

const session = useSessionStore();

const reviews = ref<Review[]>([]); // 전체 탭 (페이지네이션)
const myReviews = ref<Review[]>([]); // 내 기록 탭 (전부 로드 — 여정 선·월 점프 일관성)
const rooms = ref<Record<string, Room>>({});
const loading = ref(true);
const error = ref<string | null>(null);

type Tab = "mine" | "all";
const activeTab = ref<Tab>("mine");

const searchQuery = ref("");
const regionFilter = ref("");
const gradeFilter = ref<Set<TrailGrade>>(new Set());
const sortOrder = ref<"" | "asc" | "desc">("");

// 재미 등급 필터 — 색 도트 + 쉬운 말 병기 토글 칩 (다중 선택)
const gradeChips: TrailGrade[] = ["flower", "grass", "dirt"];

function toggleGrade(grade: TrailGrade) {
  const next = new Set(gradeFilter.value);
  if (next.has(grade)) next.delete(grade);
  else next.add(grade);
  gradeFilter.value = next;
}

const sortOptions: Array<{ value: "" | "asc" | "desc"; label: string }> = [
  { value: "", label: "최신순" },
  { value: "desc", label: "꽃길순" },
  { value: "asc", label: "흙길순" },
];

const myUserId = computed(() => session.user?.id ?? null);

const baseReviews = computed(() =>
  activeTab.value === "mine" ? myReviews.value : reviews.value,
);

// 여정 선 — 내 기록 전체에서 파생 (페이지네이션과 무관하게 항상 전체 여정)
const journey = computed<JourneyPoint[]>(() =>
  myReviews.value.map((r) => ({
    id: r.id,
    rating: r.rating,
    isSuccess: r.visitMeta.isSuccess,
    date: (r.visitedAt ?? r.createdAt).slice(0, 10),
  })),
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
    gradeFilter.value.size > 0 ||
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
    if (
      gradeFilter.value.size > 0 &&
      !gradeFilter.value.has(getTrailGrade(review.rating))
    )
      return false;
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
  gradeFilter.value = new Set();
  sortOrder.value = "";
}

function switchTab(tab: Tab) {
  activeTab.value = tab;
  searchQuery.value = "";
  regionFilter.value = "";
  gradeFilter.value = new Set();
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
    error.value = "더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
  } finally {
    loadingMore.value = false;
  }
}

onMounted(async () => {
  try {
    // 라우터 가드가 navigation 전에 session.init()을 await → 여기서 myUserId 보장됨
    const uid = myUserId.value;
    const [data, allRooms, mine] = await Promise.all([
      fetchReviews({ limit: PAGE_SIZE }),
      fetchAllRooms(),
      uid ? fetchReviewsByUser(uid) : Promise.resolve([]),
    ]);
    reviews.value = data;
    myReviews.value = mine;
    if (data.length < PAGE_SIZE) hasMore.value = false;
    rooms.value = Object.fromEntries(allRooms.map((r) => [r.id, r]));
  } catch (e) {
    error.value = ERRORS.loadReviews;
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="review-list">
    <!-- 밝은 hero -->
    <section class="review-list__hero dot-bg">
      <h1 class="review-list__hero-title">방탈출 일지</h1>
      <div class="review-list__hero-stats tnum">
        <span class="review-list__hero-stat">
          총 <strong>{{ totalCount }}</strong>개
        </span>
        <template v-if="successRate !== null">
          <span class="review-list__hero-sep">·</span>
          <span class="review-list__hero-stat">
            성공률 <strong>{{ successRate }}%</strong>
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
            placeholder="지점명, 테마명으로 검색"
          />
        </div>
        <div class="review-list__filters">
          <BaseSelect v-model="regionFilter" :options="regionOptions" />
          <BaseSelect v-model="sortOrder" :options="sortOptions" />
        </div>

        <!-- 재미 등급 토글 칩 — 색 도트 + 쉬운 말 병기 (다중 선택) -->
        <div
          class="review-list__grades scroll-x-hidden"
          role="group"
          aria-label="재미 등급 필터"
        >
          <button
            type="button"
            class="review-list__grade-chip"
            :class="{ 'review-list__grade-chip--active': gradeFilter.size === 0 }"
            :aria-pressed="gradeFilter.size === 0"
            @click="gradeFilter = new Set()"
          >
            전체
          </button>
          <button
            v-for="grade in gradeChips"
            :key="grade"
            type="button"
            class="review-list__grade-chip"
            :class="{ 'review-list__grade-chip--active': gradeFilter.has(grade) }"
            :aria-pressed="gradeFilter.has(grade)"
            :style="
              gradeFilter.has(grade)
                ? {
                    background: TRAIL_META[grade].softToken,
                    borderColor: TRAIL_META[grade].token,
                    color: TRAIL_META[grade].strongToken,
                  }
                : {}
            "
            @click="toggleGrade(grade)"
          >
            <span
              class="review-list__grade-dot"
              :style="{ background: TRAIL_META[grade].token }"
            />
            <strong>{{ TRAIL_META[grade].label }}</strong>
            <span class="review-list__grade-hint">{{ TRAIL_META[grade].hint }}</span>
          </button>
        </div>
      </div>

      <!-- 리뷰 목록: 내 기록 = 여정 타임라인 / 전체 = 카드 그리드 -->
      <template v-if="filteredReviews.length">
        <ReviewTimeline
          v-if="activeTab === 'mine'"
          :reviews="filteredReviews"
          :rooms="rooms"
          :journey="journey"
          :group-by-month="!sortOrder"
        />
        <div v-else class="review-list__grid">
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
            :would-revisit="review.visitMeta.wouldRevisit"
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
        </div>

        <button
          v-if="activeTab === 'all' && hasMore && !hasActiveFilter"
          type="button"
          class="review-list__load-more"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '불러오는 중...' : '더 보기' }}
        </button>
      </template>
      <div v-else class="review-list__empty">
        <pre class="review-list__empty-art mono">┌──────────────┐
│   ESC LOG    │
└──────────────┘</pre>
        <template v-if="hasActiveFilter">
          <p class="review-list__empty-title">{{ EMPTY.noSearchTitle }}</p>
          <p class="review-list__empty-desc">{{ EMPTY.noSearchMessage }}</p>
          <button class="review-list__empty-btn" @click="clearFilters">
            필터 초기화
          </button>
        </template>
        <template v-else-if="activeTab === 'mine'">
          <p class="review-list__empty-title">{{ EMPTY.noReviewsTitle }}</p>
          <p class="review-list__empty-desc">{{ EMPTY.noReviewsMessage }}</p>
          <RouterLink to="/review/new" class="review-list__empty-cta">
            첫 리뷰 작성하기
          </RouterLink>
        </template>
        <template v-else>
          <p class="review-list__empty-title">아직 리뷰가 없어요</p>
          <p class="review-list__empty-desc">가장 먼저 기록을 남겨보세요</p>
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
  background-color: var(--hero-bg);
  color: var(--hero-text);
  border-bottom: 1px solid var(--hero-line);
}

.review-list__hero-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--hero-text);
}

.review-list__hero-stats {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--hero-text-dim);
}

.review-list__hero-stat strong {
  color: var(--hero-text);
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
  background: rgba(250, 248, 248, 0.94);
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

/* ── 재미 등급 토글 칩 ── */
.review-list__grades {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  overflow-x: auto;
}

.review-list__grade-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 7px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  font-size: 12.5px;
  color: var(--ink-600);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast),
    color var(--transition-fast);
}

.review-list__grade-chip strong {
  font-weight: 700;
}

.review-list__grade-chip--active {
  border-color: var(--ink-700);
  color: var(--ink-1000);
}

.review-list__grade-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.review-list__grade-hint {
  font-size: 11px;
  opacity: 0.75;
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
  background: var(--brand-500);
  color: var(--paper);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--transition-fast);
}

.review-list__empty-cta:hover {
  background: var(--brand-600);
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
  display: block;
  width: 100%;
  margin-top: 12px;
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
