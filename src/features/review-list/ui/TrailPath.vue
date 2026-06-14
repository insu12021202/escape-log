<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { JourneyPoint } from '@/entities/review/types'
import {
  getTrailMeta,
  getTrailStepColor,
  getTrailStepLabel,
  normalizeRating,
} from '@/entities/review/lib/trail-grade'
import { formatMonth } from '@/shared/lib/date'

const props = defineProps<{
  points: JourneyPoint[]
}>()

/** 이 개수를 넘으면 기록 점 → 월 점으로 줌아웃 */
const ZOOM_THRESHOLD = 30

/** 여정 순서 — 오래된 기록이 왼쪽(출발점) */
const journey = computed(() =>
  [...props.points].sort((a, b) => a.date.localeCompare(b.date)),
)

const zoomedOut = computed(() => journey.value.length > ZOOM_THRESHOLD)

/* ── 줌인: 기록 점, 월별 그룹 ── */
const monthGroups = computed(() => {
  const groups: Array<{ label: string; items: JourneyPoint[] }> = []
  for (const point of journey.value) {
    const label = formatMonth(point.date)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(point)
    else groups.push({ label, items: [point] })
  }
  return groups
})

/* ── 줌아웃: 월 점 (대표 등급 색 + 개수 비례 크기) ── */
const monthDots = computed(() => {
  const agg = new Map<string, { sum: number; count: number }>()
  for (const point of journey.value) {
    const label = formatMonth(point.date)
    const cur = agg.get(label) ?? { sum: 0, count: 0 }
    cur.sum += normalizeRating(point.rating)
    cur.count += 1
    agg.set(label, cur)
  }
  const entries = [...agg.entries()]
  const maxCount = Math.max(...entries.map(([, v]) => v.count), 1)
  return entries.map(([label, { sum, count }]) => {
    const avg = Math.round(sum / count)
    return {
      label,
      count,
      avgLabel: getTrailStepLabel(avg),
      color: getTrailStepColor(avg),
      // 12px ~ 22px, 개수 비례
      size: 12 + Math.round((count / maxCount) * 10),
    }
  })
})

// 처음엔 최신 구간(오른쪽 끝)이 보이게
const scrollEl = ref<HTMLElement>()
onMounted(() => {
  requestAnimationFrame(() => {
    if (scrollEl.value) scrollEl.value.scrollLeft = scrollEl.value.scrollWidth
  })
})

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>

<template>
  <section v-if="points.length" class="trail-path" aria-label="내가 걸어온 길">
    <div class="trail-path__head">
      <span class="trail-path__title">내가 걸어온 길</span>
      <span class="trail-path__total tnum">{{ points.length }}개</span>
    </div>

    <div ref="scrollEl" class="trail-path__scroll scroll-x-hidden">
      <!-- 줌아웃: 월 점 -->
      <div v-if="zoomedOut" class="trail-path__track">
        <div v-for="dot in monthDots" :key="dot.label" class="trail-path__month">
          <div class="trail-path__dots">
            <button
              type="button"
              class="trail-path__dot"
              :style="{
                background: dot.color,
                backgroundOrigin: 'border-box',
                backgroundRepeat: 'no-repeat',
                width: `${dot.size}px`,
                height: `${dot.size}px`,
              }"
              :aria-label="`${dot.label} 기록 ${dot.count}개 · 평균 ${dot.avgLabel} — 해당 월로 이동`"
              @click="scrollToId(`month-${dot.label}`)"
            />
          </div>
          <span class="trail-path__month-label mono">{{ dot.label }}</span>
        </div>
      </div>

      <!-- 줌인: 기록 점 -->
      <div v-else class="trail-path__track">
        <div
          v-for="group in monthGroups"
          :key="group.label"
          class="trail-path__month"
        >
          <div class="trail-path__dots">
            <button
              v-for="point in group.items"
              :key="point.id"
              type="button"
              class="trail-path__dot"
              :class="{ 'trail-path__dot--fail': !point.isSuccess }"
              :style="
                point.isSuccess
                  ? {
                      background: getTrailStepColor(point.rating),
                      backgroundOrigin: 'border-box',
                      backgroundRepeat: 'no-repeat',
                    }
                  : { borderColor: getTrailMeta(point.rating).token }
              "
              :aria-label="`${group.label} ${getTrailStepLabel(point.rating)} 기록으로 이동`"
              @click="scrollToId(`log-${point.id}`)"
            />
          </div>
          <span class="trail-path__month-label mono">{{ group.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.trail-path {
  padding: 16px 16px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-xs);
}

.trail-path__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.trail-path__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}

.trail-path__total {
  font-size: 12px;
  color: var(--ink-500);
}

.trail-path__scroll {
  overflow-x: auto;
  margin: 0 -4px;
  padding: 0 4px;
}

.trail-path__track {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: 22px;
  min-width: 100%;
  padding: 2px 6px 0;
}

/* 여정 선 — 점들 중앙을 가로지르는 길 */
.trail-path__track::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 12px;
  height: 2px;
  background: var(--ink-150);
}

.trail-path__month {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.trail-path__dots {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

.trail-path__dot {
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 999px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.trail-path__dot:hover {
  transform: scale(1.25);
  box-shadow: 0 2px 8px rgba(35, 26, 30, 0.2);
}

/* 실패 — 빈 링 (타임라인 노드와 동일 문법) */
.trail-path__dot--fail {
  background: var(--color-surface);
}

.trail-path__month-label {
  font-size: 10px;
  color: var(--ink-400);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .trail-path__dot {
    transition: none;
  }
}
</style>
