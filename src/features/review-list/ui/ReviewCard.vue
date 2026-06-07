<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import StarRating from '@/shared/ui/StarRating.vue'
import AppBadge from '@/shared/ui/AppBadge.vue'
import { makeSerial } from '@/shared/lib/serial'
import { formatYearMonth } from '@/shared/lib/date'
import { hasRevealedSpoiler, markSpoilerRevealed } from '@/shared/lib/spoiler'

const props = defineProps<{
  rating: number
  summary: string
  vendorName: string
  themeName: string
  region: string
  isSuccess: boolean
  genreTags: string[]
  authorName?: string | null
  visitedAt?: string | null
  remainingMinutes?: number | null
  hasSpoiler?: boolean
  posterUrl?: string | null
}>()

const attrs = useAttrs()
const reviewId = computed(() => (attrs['data-id'] as string | undefined) ?? '')
const revealed = ref(hasRevealedSpoiler(reviewId.value))

function reveal() {
  revealed.value = true
  markSpoilerRevealed(reviewId.value)
}

const serial = computed(() => makeSerial(reviewId.value))

const metaParts = computed(() => {
  const parts: string[] = []
  if (props.visitedAt) parts.push(formatYearMonth(props.visitedAt))
  if (props.region) parts.push(props.region)
  if (props.remainingMinutes != null) parts.push(`${props.remainingMinutes}m`)
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
    :class="{ 'review-card--fail': !isSuccess }"
  >
    <div v-if="posterUrl" class="review-card__poster">
      <img :src="posterUrl" :alt="`${themeName} 포스터`" />
    </div>
    <div v-else class="review-card__poster review-card__poster--empty">
      <span class="label">NO IMG</span>
    </div>

    <div class="review-card__body">
      <div class="review-card__head">
        <div class="review-card__title">
          <span class="review-card__vendor">{{ vendorName }}</span>
          <span class="review-card__theme">{{ themeName }}</span>
        </div>
        <div class="review-card__head-right">
          <span class="review-card__serial label">{{ serial }}</span>
          <AppBadge :kind="isSuccess ? 'success' : 'error'" mono size="sm">
            {{ isSuccess ? 'CLEAR' : 'FAIL' }}
          </AppBadge>
        </div>
      </div>

      <div
        v-if="hasSpoiler && !revealed"
        class="review-card__spoiler scratch"
      >
        스포일러 —
        <button
          type="button"
          class="review-card__spoiler-btn"
          @click.prevent.stop="reveal"
        >탭하여 보기</button>
      </div>
      <p v-else class="review-card__summary">{{ summary }}</p>

      <div v-if="visibleTags.length" class="review-card__tags">
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
          <StarRating :model-value="rating" readonly size="sm" mute />
          <span class="review-card__rating-num mono tnum">{{ rating }}</span>
        </div>
        <div v-if="metaParts.length" class="review-card__meta mono tnum">
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

.review-card::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 3px;
  background: var(--color-success);
  border-radius: 0 2px 2px 0;
}

.review-card--fail::before {
  background: var(--color-error);
}

.review-card__serial {
  font-size: 9.5px;
  color: var(--ink-400);
  letter-spacing: 0.08em;
  line-height: 1;
}

.review-card__head-right {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

/* 포스터 */
.review-card__poster {
  flex-shrink: 0;
  width: 72px;
  height: 96px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--ink-100);
}

.review-card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.review-card__poster--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
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

.review-card__rating-num {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-900);
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
