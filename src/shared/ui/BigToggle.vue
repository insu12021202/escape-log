<script setup lang="ts">
import { ref, nextTick } from 'vue'

type IconKind = 'check' | 'cross'

interface ToggleOption {
  value: string
  label: string
  icon?: IconKind
  accent?: string
}

const props = defineProps<{
  modelValue: string
  options: ToggleOption[]
  /** radiogroup 라벨 (스크린리더용) */
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)

function select(value: string) {
  emit('update:modelValue', value)
}

/** roving tabindex: 선택 옵션(없으면 첫 옵션)만 Tab 도달 가능 */
function tabindexFor(value: string) {
  const idx = props.options.findIndex((o) => o.value === props.modelValue)
  const activeValue = idx >= 0 ? props.modelValue : props.options[0]?.value
  return value === activeValue ? 0 : -1
}

function onKey(e: KeyboardEvent) {
  const idx = props.options.findIndex((o) => o.value === props.modelValue)
  let nextIdx: number
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = idx < 0 ? 0 : Math.min(props.options.length - 1, idx + 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = idx < 0 ? 0 : Math.max(0, idx - 1)
  else return
  e.preventDefault()
  const next = props.options[nextIdx]
  if (!next) return
  emit('update:modelValue', next.value)
  nextTick(() => {
    const btns = rootRef.value?.querySelectorAll<HTMLElement>('.big-toggle__opt')
    btns?.[nextIdx]?.focus()
  })
}
</script>

<template>
  <div ref="rootRef" class="big-toggle" role="radiogroup" :aria-label="label">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :tabindex="tabindexFor(opt.value)"
      class="big-toggle__opt"
      :class="{ 'big-toggle__opt--active': modelValue === opt.value }"
      :style="
        modelValue === opt.value
          ? { '--accent': opt.accent || 'var(--brand-500)' }
          : undefined
      "
      @click="select(opt.value)"
      @keydown="onKey"
    >
      <span v-if="opt.icon" class="big-toggle__icon" aria-hidden="true">
        <svg
          v-if="opt.icon === 'check'"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
      <span class="big-toggle__label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.big-toggle {
  display: flex;
  gap: 10px;
  width: 100%;
}

.big-toggle__opt {
  flex: 1;
  position: relative;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--ink-500);
  cursor: pointer;
  overflow: hidden;
  transition: background var(--transition-fast), color var(--transition-fast),
    border-color var(--transition-fast);
}

.big-toggle__opt--active {
  background: var(--brand-500);
  color: var(--paper);
  border-color: var(--brand-500);
}

.big-toggle__opt--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
}

.big-toggle__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.big-toggle__label {
  font-size: 16px;
  font-weight: 700;
}
</style>
