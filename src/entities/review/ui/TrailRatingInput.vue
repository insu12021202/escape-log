<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import {
  TRAIL_STEPS,
  TRAIL_META,
  getTrailGrade,
  getTrailStepColor,
  getTrailStepSoftColor,
  normalizeRating,
} from '../lib/trail-grade'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

/** 0 = 미선택, 1~5 = 선택 단계 (소수·문자열 방어) */
const selected = computed(() =>
  props.modelValue >= 1 ? normalizeRating(props.modelValue) : 0,
)

const meta = computed(() =>
  selected.value >= 1 ? TRAIL_META[getTrailGrade(selected.value)] : null,
)

const currentStep = computed(
  () => TRAIL_STEPS.find((s) => s.value === selected.value) ?? null,
)

// ── 키보드 접근성 (radiogroup 표준 패턴) ──
const trackRef = ref<HTMLElement | null>(null)

/** roving tabindex: 선택된 디딤돌(없으면 1번)만 Tab 도달 가능 */
function tabindexForStep(value: number) {
  const active = selected.value >= 1 ? selected.value : 1
  return value === active ? 0 : -1
}

function onStoneKey(e: KeyboardEvent) {
  const cur = selected.value
  let next: number
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, (cur || 0) + 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, (cur || 1) - 1)
  else if (e.key === 'Home') next = 1
  else if (e.key === 'End') next = 5
  else return
  e.preventDefault()
  emit('update:modelValue', next)
  nextTick(() => {
    const stones = trackRef.value?.querySelectorAll<HTMLElement>('.trail-rating__stone')
    stones?.[next - 1]?.focus()
  })
}
</script>

<template>
  <div class="trail-rating">
    <div class="trail-rating__track" ref="trackRef" role="radiogroup" aria-label="재미 등급">
      <button
        v-for="step in TRAIL_STEPS"
        :key="step.value"
        type="button"
        role="radio"
        :aria-checked="selected === step.value"
        :aria-label="`${step.label} · ${step.hint}`"
        :tabindex="tabindexForStep(step.value)"
        class="trail-rating__stone"
        :class="{
          'trail-rating__stone--walked': selected >= step.value,
          'trail-rating__stone--current': selected === step.value,
        }"
        :style="
          selected >= step.value
            ? {
                background: getTrailStepColor(step.value),
                backgroundOrigin: 'border-box',
                backgroundRepeat: 'no-repeat',
                borderColor: TRAIL_META[step.grade].token,
              }
            : {}
        "
        @click="emit('update:modelValue', step.value)"
        @keydown="onStoneKey"
      >
        <span class="trail-rating__stone-label" :class="{ mono: false }">
          {{ step.value }}
        </span>
      </button>
    </div>

    <p class="trail-rating__label" aria-live="polite">
      <template v-if="currentStep">
        <span
          class="trail-rating__label-chip"
          :style="
            meta
              ? { color: meta.strongToken, background: getTrailStepSoftColor(selected) }
              : {}
          "
        >{{ currentStep.label }}</span>
        <span class="trail-rating__label-desc">{{ currentStep.hint }}</span>
      </template>
      <span v-else class="trail-rating__label-hint">오늘 걸은 길을 골라 주세요</span>
    </p>
  </div>
</template>

<style scoped>
.trail-rating {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trail-rating__track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

/* 디딤돌 사이 연결선 */
.trail-rating__track::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: var(--ink-150);
}

.trail-rating__stone {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 2px solid var(--ink-200);
  background: var(--color-surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast),
    transform var(--transition-fast);
}

.trail-rating__stone:hover {
  transform: scale(1.08);
}

.trail-rating__stone--walked .trail-rating__stone-label {
  color: var(--paper);
}

.trail-rating__stone--current {
  transform: scale(1.12);
  box-shadow: 0 2px 10px rgba(35, 26, 30, 0.18);
}

.trail-rating__stone-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-400);
  line-height: 1;
}

.trail-rating__label {
  min-height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trail-rating__label-desc {
  font-size: 12px;
  color: var(--ink-500);
}

.trail-rating__label-chip {
  font-size: 12.5px;
  font-weight: 700;
  padding: 3px 11px;
  border-radius: 999px;
}

.trail-rating__label-hint {
  font-size: 12.5px;
  color: var(--ink-400);
}

@media (prefers-reduced-motion: reduce) {
  .trail-rating__stone {
    transition: none;
  }
}
</style>
