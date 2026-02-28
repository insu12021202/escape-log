<script setup lang="ts">
import { ref } from 'vue'
import StarRating from '@/shared/ui/StarRating.vue'

defineProps<{
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
}>()

const revealed = ref(false)

function formatVisitedAt(dateStr: string) {
  return dateStr.slice(0, 7).replace('-', '.')
}
</script>

<template>
  <RouterLink :to="`/review/${$attrs['data-id']}`" class="review-card">
    <div class="review-card__top">
      <div class="review-card__title-row">
        <span class="review-card__vendor">{{ vendorName }}</span>
        <span class="review-card__theme">{{ themeName }}</span>
      </div>
      <span class="review-card__result" :class="{ 'review-card__result--fail': !isSuccess }">
        {{ isSuccess ? '성공' : '실패' }}
      </span>
    </div>

    <div class="review-card__rating-row">
      <StarRating :model-value="rating" readonly size="sm" />
      <span class="review-card__rating-num">{{ rating }}</span>
    </div>

    <p
      class="review-card__summary"
      :class="{ 'review-card__summary--blurred': hasSpoiler && !revealed }"
    >{{ summary }}</p>
    <span
      v-if="hasSpoiler && !revealed"
      class="review-card__spoiler-badge"
      @click.prevent.stop="revealed = true"
    >스포일러 포함 — 탭하여 보기</span>

    <div v-if="genreTags.length" class="review-card__tags">
      <span v-for="tag in genreTags.slice(0, 3)" :key="tag" class="review-card__tag">{{ tag }}</span>
      <span v-if="genreTags.length > 3" class="review-card__tag review-card__tag--more">+{{ genreTags.length - 3 }}</span>
    </div>

    <div class="review-card__footer">
      <span class="review-card__region">{{ region }}</span>
      <div class="review-card__meta">
        <span v-if="visitedAt" class="review-card__date">{{ formatVisitedAt(visitedAt) }}</span>
        <span v-if="visitedAt && remainingMinutes != null" class="review-card__meta-sep">·</span>
        <span v-if="remainingMinutes != null" class="review-card__escape-time">탈출 {{ remainingMinutes }}m</span>
        <span v-if="authorName && (visitedAt || remainingMinutes != null)" class="review-card__meta-sep">·</span>
        <span v-if="authorName" class="review-card__author">{{ authorName }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.review-card {
  display: block;
  padding: 18px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}

.review-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

.review-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.review-card__title-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.review-card__vendor {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-card__theme {
  font-size: 0.875rem;
  color: var(--color-text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-card__result {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--color-success-bg);
  color: var(--color-success);
}

.review-card__result--fail {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.review-card__rating-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.review-card__rating-num {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-star);
}

.review-card__summary {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text);
  margin-bottom: 12px;
}

.review-card__summary--blurred {
  filter: blur(6px);
  user-select: none;
  transition: filter 0.2s ease;
}

.review-card__spoiler-badge {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 12px;
}

.review-card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  margin-bottom: 12px;
}

.review-card__tag {
  font-size: 0.75rem;
  padding: 3px 9px;
  background: var(--color-bg);
  border-radius: 99px;
  color: var(--color-text-sub);
  white-space: nowrap;
}

.review-card__tag--more {
  color: var(--color-text-muted);
}

.review-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.review-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.review-card__date,
.review-card__escape-time,
.review-card__author {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.review-card__author {
  font-weight: 500;
  color: var(--color-text-sub);
}

.review-card__meta-sep {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.6;
}
</style>
