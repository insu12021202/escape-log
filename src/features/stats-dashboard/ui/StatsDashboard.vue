<script setup lang="ts">
import { computed } from 'vue'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import StatCard from '@/shared/ui/StatCard.vue'
import RadarChart from '@/shared/ui/RadarChart.vue'
import HorizontalBarChart from './HorizontalBarChart.vue'

const props = defineProps<{
  reviews: Review[]
  rooms: Record<string, Room>
}>()

/* ── Summary ── */

const totalCount = computed(() => props.reviews.length)

const successRate = computed(() => {
  if (!totalCount.value) return 0
  const ok = props.reviews.filter((r) => r.visitMeta.isSuccess).length
  return Math.round((ok / totalCount.value) * 100)
})

const avgRating = computed(() => {
  if (!totalCount.value) return 0
  const sum = props.reviews.reduce((s, r) => s + r.rating, 0)
  return +(sum / totalCount.value).toFixed(1)
})

const avgHeadcount = computed(() => {
  if (!totalCount.value) return 0
  const sum = props.reviews.reduce((s, r) => s + r.visitMeta.headcount, 0)
  return +(sum / totalCount.value).toFixed(1)
})

/* ── Radar: 세부 지표 평균 ── */

const subMetricKeys: Array<keyof Review['subMetrics']> = [
  'puzzleQuality',
  'storyDirection',
  'setQuality',
  'horror',
  'puzzleDifficulty',
  'clearDifficulty',
]

const subMetricLabels: Record<string, string> = {
  puzzleQuality: '퍼즐 퀄리티',
  storyDirection: '스토리',
  setQuality: '세트 퀄리티',
  horror: '공포도',
  puzzleDifficulty: '퍼즐 난이도',
  clearDifficulty: '클리어 난이도',
}

const subMetricAverages = computed(() => {
  if (!totalCount.value) return Object.fromEntries(subMetricKeys.map((k) => [k, 0]))
  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}
  for (const key of subMetricKeys) {
    sums[key] = 0
    counts[key] = 0
  }
  for (const r of props.reviews) {
    for (const key of subMetricKeys) {
      const v = r.subMetrics[key]
      if (v > 0) {
        sums[key] = (sums[key] ?? 0) + v
        counts[key] = (counts[key] ?? 0) + 1
      }
    }
  }
  return Object.fromEntries(
    subMetricKeys.map((k) => {
      const c = counts[k] ?? 0
      const s = sums[k] ?? 0
      return [k, c ? +(s / c).toFixed(1) : 0]
    }),
  )
})

/* ── 장르 분포 ── */

const genreDistribution = computed(() => {
  const freq: Record<string, number> = {}
  for (const r of props.reviews) {
    for (const tag of r.visitMeta.genreTags) {
      freq[tag] = (freq[tag] || 0) + 1
    }
    if (r.visitMeta.customGenre) {
      freq[r.visitMeta.customGenre] = (freq[r.visitMeta.customGenre] || 0) + 1
    }
  }
  return Object.entries(freq)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
})

/* ── 월별 플레이 추이 (최근 6개월) ── */

const monthlyTrend = computed(() => {
  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const counts: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]))
  for (const r of props.reviews) {
    if (!r.visitedAt) continue
    const ym = r.visitedAt.slice(0, 7)
    if (ym in counts) counts[ym] = (counts[ym] ?? 0) + 1
  }
  return months.map((m) => ({
    label: m.slice(5) + '월',
    value: counts[m] ?? 0,
  }))
})

const monthlyMax = computed(() => Math.max(...monthlyTrend.value.map((m) => m.value), 1))

/* ── 평점 분포 ── */

const ratingDistribution = computed(() => {
  const counts: number[] = [0, 0, 0, 0, 0]
  for (const r of props.reviews) {
    const idx = Math.round(r.rating) - 1
    if (idx >= 0 && idx < 5) counts[idx] = (counts[idx] ?? 0) + 1
  }
  return counts.map((value, i) => ({ label: `${i + 1}점`, value: value ?? 0 }))
})
</script>

<template>
  <section v-if="totalCount > 0" class="dashboard">
    <h2 class="dashboard__title">나의 방탈출 통계</h2>

    <!-- Summary Cards -->
    <div class="dashboard__cards">
      <StatCard label="총 플레이" :value="totalCount" sub="개" color="var(--color-primary)" />
      <StatCard label="탈출 성공률" :value="`${successRate}%`" color="var(--color-success)" />
      <StatCard label="평균 평점" :value="avgRating" sub="/ 5" color="var(--color-star)" />
      <StatCard label="평균 인원" :value="avgHeadcount" sub="명" color="#8b5cf6" />
    </div>

    <!-- 세부 지표 레이더 -->
    <div class="dashboard__section">
      <h3 class="dashboard__section-title">세부 지표 평균</h3>
      <RadarChart :values="subMetricAverages" :labels="subMetricLabels" :max="5" />
    </div>

    <!-- 장르 분포 -->
    <div v-if="genreDistribution.length" class="dashboard__section">
      <h3 class="dashboard__section-title">장르 분포</h3>
      <HorizontalBarChart :items="genreDistribution" color="var(--color-primary)" />
    </div>

    <!-- 월별 추이 -->
    <div class="dashboard__section">
      <h3 class="dashboard__section-title">월별 플레이 추이</h3>
      <div class="monthly-chart">
        <div
          v-for="m in monthlyTrend"
          :key="m.label"
          class="monthly-chart__col"
        >
          <span class="monthly-chart__value">{{ m.value || '' }}</span>
          <div
            class="monthly-chart__bar"
            :style="{ height: `${(m.value / monthlyMax) * 100}%` }"
          />
          <span class="monthly-chart__label">{{ m.label }}</span>
        </div>
      </div>
    </div>

    <!-- 평점 분포 -->
    <div class="dashboard__section">
      <h3 class="dashboard__section-title">평점 분포</h3>
      <HorizontalBarChart :items="ratingDistribution" color="var(--color-star)" />
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid var(--color-border);
}

.dashboard__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 16px;
}

.dashboard__cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}

.dashboard__section {
  margin-bottom: 24px;
}

.dashboard__section:last-child {
  margin-bottom: 0;
}

.dashboard__section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

/* 월별 수직 바 차트 */
.monthly-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 120px;
  padding-top: 20px;
}

.monthly-chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.monthly-chart__value {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-sub);
  margin-bottom: 4px;
  min-height: 16px;
}

.monthly-chart__bar {
  width: 100%;
  max-width: 36px;
  background: var(--color-primary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: height 0.4s ease;
  min-height: 2px;
}

.monthly-chart__label {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin-top: 6px;
  white-space: nowrap;
}
</style>
