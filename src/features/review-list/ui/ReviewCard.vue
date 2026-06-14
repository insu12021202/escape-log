<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import AppBadge from '@/shared/ui/AppBadge.vue'
import TrailDots from '@/entities/review/ui/TrailDots.vue'
import SpeedBadge from '@/entities/review/ui/SpeedBadge.vue'
import { formatYearMonth } from '@/shared/lib/date'
import { hasRevealedSpoiler, markSpoilerRevealed } from '@/shared/lib/spoiler'
import {
  getTrailMeta,
  getTrailStepColor,
  getTrailStepSoftColor,
  getTrailStepLabel,
  isLifeTheme,
  LIFE_THEME_LABEL,
} from '@/entities/review/lib/trail-grade'

const props = defineProps<{
  rating: number
  summary: string
  vendorName: string
  themeName: string
  region: string
  isSuccess: boolean
  wouldRevisit: boolean
  genreTags: string[]
  authorName?: string | null
  visitedAt?: string | null
  remainingMinutes?: number | null
  hasSpoiler?: boolean
  posterUrl?: string | null
}>()

const trailMeta = computed(() => getTrailMeta(props.rating))
const lifeTheme = computed(() => isLifeTheme(props.rating, props.wouldRevisit))
// 왼쪽 스파인 — 성공/실패가 아니라 '길' 등급 색 (제품 정체성)
const spineColor = computed(() => getTrailStepColor(props.rating))

const attrs = useAttrs()
const reviewId = computed(() => (attrs['data-id'] as string | undefined) ?? '')
const revealed = ref(hasRevealedSpoiler(reviewId.value))

function reveal() {
  revealed.value = true
  markSpoilerRevealed(reviewId.value)
}

const metaParts = computed(() => {
  const parts: string[] = []
  if (props.visitedAt) parts.push(formatYearMonth(props.visitedAt))
  if (props.region) parts.push(props.region)
  if (props.remainingMinutes != null) parts.push(`${props.remainingMinutes}분`)
  if (props.authorName) parts.push(props.authorName)
  return parts
})

const visibleTags = computed(() => props.genreTags.slice(0, 3))
const extraTagCount = computed(() => Math.max(0, props.genreTags.length - 3))
</script>

<template>
  <RouterLink
    :to="`/review/${$attrs['data-id']}`"
    class="review-card"
    :style="{ '--spine': spineColor }"
  >
    <div v-if="posterUrl" class="review-card__poster">
      <img :src="posterUrl" :alt="`${themeName} 포스터`" />
    </div>

    <div class="review-card__body">
      <div class="review-card__head">
        <div class="review-card__title">
          <span class="review-card__vendor">{{ vendorName }}</span>
          <span class="review-card__theme">{{ themeName }}</span>
        </div>
        <AppBadge :kind="isSuccess ? 'success' : 'error'" size="sm">
          {{ isSuccess ? '성공' : '실패' }}
        </AppBadge>
      </div>

      <div
        v-if="hasSpoiler && !revealed"
        class="review-card__spoiler scratch"
      >
        스포일러 ·
        <button
          type="button"
          class="review-card__spoiler-btn"
          @click.prevent.stop="reveal"
        >탭해서 보기</button>
      </div>
      <p v-else class="review-card__summary">{{ summary }}</p>

      <div class="review-card__tags">
        <span
          class="review-card__grade"
          :class="{ 'review-card__grade--life': lifeTheme }"
          :style="{
            color: lifeTheme ? 'var(--paper)' : trailMeta.strongToken,
            background: lifeTheme ? trailMeta.strongToken : getTrailStepSoftColor(rating),
          }"
        >{{ lifeTheme ? LIFE_THEME_LABEL : getTrailStepLabel(rating) }}</span>
        <span v-for="tag in visibleTags" :key="tag" class="review-card__tag">
          {{ tag }}
        </span>
        <span
          v-if="extraTagCount > 0"
          class="review-card__tag review-card__tag--more"
        >+{{ extraTagCount }}</span>
      </div>

      <div class="review-card__footer">
        <div class="review-card__rating">
          <TrailDots :rating="rating" size="sm" />
          <SpeedBadge :remaining-minutes="remainingMinutes" :is-success="isSuccess" />
        </div>
        <div v-if="metaParts.length" class="review-card__meta tnum">
          {{ metaParts.join(' · ') }}
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.review-card {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}

.review-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

/* 왼쪽 스파인 — '길' 등급 색 (경계 단계는 그라데이션) */
.review-card::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 4px;
  background: var(--spine);
  border-radius: 0 3px 3px 0;
}

/* 포스터 — 있을 때만 렌더 (없으면 본문 풀폭) */
.review-card__poster {
  flex-shrink: 0;
  width: 64px;
  height: 86px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--ink-100);
}

.review-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 컨텐츠 */
.review-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.review-card__title {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.review-card__head :deep(.app-badge) {
  flex-shrink: 0;
}

.review-card__vendor {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-card__theme {
  margin-top: 1px;
  font-size: 15.5px;
  font-weight: 700;
  color: var(--ink-1000);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-card__summary {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink-700);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-card__spoiler {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  color: var(--paper);
}

.review-card__spoiler-btn {
  display: inline;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  letter-spacing: inherit;
  text-decoration: underline;
  color: inherit;
  opacity: 0.85;
  cursor: pointer;
}

/* 태그 */
.review-card__tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.review-card__tag {
  font-size: 11.5px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--ink-700);
  white-space: nowrap;
}

.review-card__tag--more {
  border-style: dashed;
  color: var(--ink-500);
}

/* 재미 등급 칩 — 꽃길/풀길/흙길 (전체 탭 공통 언어) */
.review-card__grade {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.review-card__grade--life {
  box-shadow: 0 1px 6px color-mix(in srgb, var(--trail-flower) 35%, transparent);
}

/* 푸터 */
.review-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.review-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.review-card__meta {
  font-size: 11px;
  color: var(--ink-500);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
