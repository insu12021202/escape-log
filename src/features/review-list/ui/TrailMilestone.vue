<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue'
import SpeedBadge from '@/entities/review/ui/SpeedBadge.vue'
import { makeSerial } from '@/shared/lib/serial'
import { formatYearMonth } from '@/shared/lib/date'
import {
  getTrailMeta,
  getTrailStepColor,
  getTrailStepSoftColor,
  getTrailStepLabel,
  isLifeTheme,
  LIFE_THEME_LABEL,
} from '@/entities/review/lib/trail-grade'

const props = defineProps<{
  reviewId: string
  index: number
  rating: number
  summary: string
  vendorName: string
  themeName: string
  region: string
  isSuccess: boolean
  wouldRevisit: boolean
  visitedAt?: string | null
  remainingMinutes?: number | null
  hasSpoiler?: boolean
  posterUrl?: string | null
}>()

const meta = computed(() => getTrailMeta(props.rating))
const lifeTheme = computed(() => isLifeTheme(props.rating, props.wouldRevisit))
const serial = computed(() => makeSerial(props.reviewId))

const metaParts = computed(() => {
  const parts: string[] = []
  if (props.visitedAt) parts.push(formatYearMonth(props.visitedAt))
  if (props.region) parts.push(props.region)
  if (props.remainingMinutes != null) parts.push(`${props.remainingMinutes}분`)
  return parts
})

// 스크롤 진입 시 한 번만 나타난다 (reduce-motion이면 즉시 표시).
const root = ref<ComponentPublicInstance | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const el = root.value?.$el as HTMLElement | undefined
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce || !el || typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.value = true
          observer?.disconnect()
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  )
  observer.observe(el)
})

onBeforeUnmount(() => observer?.disconnect())

// 화면 진입 batch가 한꺼번에 안 뜨도록 짧게 계단식 지연.
const revealDelay = computed(() => `${(props.index % 6) * 45}ms`)
</script>

<template>
  <RouterLink
    ref="root"
    :id="`log-${reviewId}`"
    :to="`/review/${reviewId}`"
    class="trail-milestone"
    :class="{ 'trail-milestone--visible': visible }"
    :style="{ transitionDelay: visible ? revealDelay : '0ms' }"
  >
    <!-- 왼쪽 레일 + 등급 노드 -->
    <div class="trail-milestone__rail">
      <span
        class="trail-milestone__node"
        :class="{ 'trail-milestone__node--fail': !isSuccess }"
        :style="{
          '--node-color': meta.token,
          background: isSuccess ? getTrailStepColor(rating) : 'var(--color-surface)',
          borderColor: meta.token,
        }"
      />
    </div>

    <!-- 오른쪽 카드 -->
    <div class="trail-milestone__card">
      <div class="trail-milestone__content">
        <div class="trail-milestone__head">
          <span
            class="trail-milestone__grade"
            :class="{ 'trail-milestone__grade--life': lifeTheme }"
            :style="{
              color: lifeTheme ? 'var(--paper)' : meta.strongToken,
              background: lifeTheme ? meta.strongToken : getTrailStepSoftColor(rating),
            }"
          >
            {{ lifeTheme ? LIFE_THEME_LABEL : getTrailStepLabel(rating) }}
          </span>
          <span class="trail-milestone__serial label">{{ serial }}</span>
          <SpeedBadge :remaining-minutes="remainingMinutes" :is-success="isSuccess" />
          <span
            v-if="!isSuccess"
            class="trail-milestone__fail"
            aria-label="실패"
          >실패</span>
        </div>

        <div class="trail-milestone__title">
          <span class="trail-milestone__vendor">{{ vendorName }}</span>
          <span class="trail-milestone__theme">{{ themeName }}</span>
        </div>

        <p v-if="hasSpoiler" class="trail-milestone__spoiler">
          스포일러 · 상세에서 확인
        </p>
        <p v-else-if="summary" class="trail-milestone__summary">{{ summary }}</p>

        <div v-if="metaParts.length" class="trail-milestone__meta tnum">
          {{ metaParts.join(' · ') }}
        </div>
      </div>

      <!-- 포스터 — 이 길목의 기억 (있을 때만, 레일은 그대로 hero) -->
      <div v-if="posterUrl" class="trail-milestone__poster">
        <img :src="posterUrl" :alt="`${themeName} 포스터`" loading="lazy" />
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.trail-milestone {
  position: relative;
  display: flex;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  /* 진입 전 상태 */
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.trail-milestone--visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── 레일 + 노드 ── */
.trail-milestone__rail {
  position: relative;
  width: 18px;
  flex-shrink: 0;
}

/* 세로 연결선 */
.trail-milestone__rail::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: var(--ink-200);
}

/* 첫/마지막 항목은 선을 노드까지만 */
.trail-milestone:first-child .trail-milestone__rail::before {
  top: 9px;
}
.trail-milestone:last-child .trail-milestone__rail::before {
  bottom: calc(100% - 9px);
}

.trail-milestone__node {
  position: absolute;
  top: 2px;
  left: 50%;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid;
  transform: translateX(-50%) scale(0.4);
  opacity: 0;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s, opacity 0.3s ease 0.1s;
}

.trail-milestone--visible .trail-milestone__node {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}

/* 실패는 빈 링 + 점선 느낌의 약한 강조 */
.trail-milestone__node--fail {
  box-shadow: inset 0 0 0 2px var(--color-surface);
}

.trail-milestone:hover .trail-milestone__node {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--node-color) 20%, transparent);
}

/* ── 카드 ── */
.trail-milestone__card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 0 0 22px;
}

.trail-milestone__content {
  flex: 1;
  min-width: 0;
}

/* 포스터 — 카드 우측 썸네일. 글머리 행은 노드와 정렬되도록 content는 위 고정,
   포스터만 텍스트 블록 기준 세로 중앙으로 맞춰 빈 공간 없이 균형 잡음. */
.trail-milestone__poster {
  flex-shrink: 0;
  align-self: center;
  width: 56px;
  aspect-ratio: 2 / 3;
  border-radius: 7px;
  overflow: hidden;
  background: var(--ink-100);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.trail-milestone__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.trail-milestone__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.trail-milestone__grade {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  letter-spacing: -0.01em;
}

.trail-milestone__grade--life {
  box-shadow: 0 1px 6px color-mix(in srgb, var(--trail-flower) 35%, transparent);
}

.trail-milestone__serial {
  font-size: 9.5px;
  color: var(--ink-400);
}

.trail-milestone__fail {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-error);
}

.trail-milestone__title {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.trail-milestone__vendor {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trail-milestone__theme {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--ink-1000);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trail-milestone__summary {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-700);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trail-milestone__spoiler {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--ink-400);
}

.trail-milestone__meta {
  margin-top: 7px;
  font-size: 11px;
  color: var(--ink-500);
  letter-spacing: 0.02em;
}

@media (prefers-reduced-motion: reduce) {
  .trail-milestone,
  .trail-milestone__node {
    transition: none;
  }
}
</style>
