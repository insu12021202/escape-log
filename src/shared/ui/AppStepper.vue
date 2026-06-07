<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    unit?: string
  }>(),
  { min: 0, max: 99 },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isMin = computed(() => props.modelValue <= props.min)
const isMax = computed(() => props.modelValue >= props.max)

function dec() {
  if (isMin.value) return
  emit('update:modelValue', props.modelValue - 1)
}

function inc() {
  if (isMax.value) return
  emit('update:modelValue', props.modelValue + 1)
}
</script>

<template>
  <div class="app-stepper">
    <button
      type="button"
      class="app-stepper__btn"
      :disabled="isMin"
      aria-label="감소"
      @click="dec"
    >
      −
    </button>
    <div class="app-stepper__value">
      <span class="app-stepper__num mono">{{ modelValue }}</span>
      <span v-if="unit" class="app-stepper__unit">{{ unit }}</span>
    </div>
    <button
      type="button"
      class="app-stepper__btn"
      :disabled="isMax"
      aria-label="증가"
      @click="inc"
    >
      +
    </button>
  </div>
</template>

<style scoped>
.app-stepper {
  display: inline-flex;
  align-items: stretch;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  overflow: hidden;
}

.app-stepper__btn {
  width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--ink-800);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.app-stepper__btn:hover:not(:disabled) {
  background: var(--ink-100);
}

.app-stepper__btn:disabled {
  color: var(--ink-300);
  cursor: not-allowed;
}

.app-stepper__value {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 12px;
  min-width: 64px;
  line-height: 1;
}

.app-stepper__num {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-1000);
}

.app-stepper__unit {
  font-size: 11px;
  color: var(--ink-500);
}
</style>
