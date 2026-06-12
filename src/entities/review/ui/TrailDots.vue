<script setup lang="ts">
import { computed } from 'vue'
import {
  getTrailStepColor,
  getTrailStepLabel,
  getTrailMeta,
  normalizeRating,
} from '../lib/trail-grade'

const props = withDefaults(
  defineProps<{
    rating: number
    /** 단계 라벨(흙길~꽃길) 함께 표시 */
    showLabel?: boolean
    size?: 'sm' | 'md'
  }>(),
  { showLabel: false, size: 'sm' },
)

const filled = computed(() => normalizeRating(props.rating))
const stepColor = computed(() => getTrailStepColor(props.rating))
const meta = computed(() => getTrailMeta(props.rating))
const label = computed(() => getTrailStepLabel(props.rating))
</script>

<template>
  <span
    class="trail-dots"
    :class="`trail-dots--${size}`"
    role="img"
    :aria-label="`재미 등급 ${label} (5단계 중 ${filled}단계)`"
  >
    <span class="trail-dots__track" aria-hidden="true">
      <span
        v-for="i in 5"
        :key="i"
        class="trail-dots__dot"
        :style="i <= filled ? { background: stepColor } : {}"
      />
    </span>
    <span
      v-if="showLabel"
      class="trail-dots__label"
      :style="{ color: meta.strongToken }"
    >{{ label }}</span>
  </span>
</template>

<style scoped>
.trail-dots {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.trail-dots__track {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.trail-dots__dot {
  border-radius: 999px;
  background: var(--ink-200);
}

.trail-dots--sm .trail-dots__dot {
  width: 7px;
  height: 7px;
}

.trail-dots--md .trail-dots__dot {
  width: 9px;
  height: 9px;
}

.trail-dots__label {
  font-size: 12px;
  font-weight: 700;
}

.trail-dots--md .trail-dots__label {
  font-size: 13.5px;
}
</style>
