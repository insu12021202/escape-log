<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    percent?: number
    accent?: string
    /** 숫자 통계는 mono. 한글 텍스트 값(예: 평균 길)은 false로 sans 사용 */
    mono?: boolean
  }>(),
  { accent: 'var(--brand-500)', mono: true },
)

const clampedPercent = computed(() => {
  if (props.percent == null) return null
  return Math.max(0, Math.min(100, props.percent))
})
</script>

<template>
  <div class="stat-card" :style="{ '--accent': accent }">
    <span class="stat-card__label">{{ label }}</span>
    <div class="stat-card__row">
      <span class="stat-card__value" :class="{ mono, 'stat-card__value--text': !mono }">{{ value }}</span>
      <span v-if="unit" class="stat-card__unit">{{ unit }}</span>
    </div>
    <div v-if="clampedPercent !== null" class="stat-card__bar">
      <div class="stat-card__bar-fill" :style="{ width: `${clampedPercent}%` }" />
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}

.stat-card__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-500);
}

.stat-card__row {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.stat-card__value {
  font-size: 26px;
  font-weight: 700;
  color: var(--ink-1000);
  line-height: 1.1;
  white-space: nowrap;
}

/* 한글 텍스트 값 — 좁은 카드에서 안 깨지게 sans + 살짝 작게 */
.stat-card__value--text {
  font-size: 22px;
  letter-spacing: -0.02em;
}

.stat-card__unit {
  font-size: 12px;
  color: var(--ink-500);
}

.stat-card__bar {
  margin-top: 10px;
  height: 3px;
  background: var(--ink-150);
  border-radius: 999px;
  overflow: hidden;
}

.stat-card__bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
  transition: width var(--transition-base);
}
</style>
