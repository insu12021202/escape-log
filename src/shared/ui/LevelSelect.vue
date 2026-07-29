<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  modelValue: number
  /** radiogroup 라벨 */
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// ── 키보드 접근성 (radiogroup 표준 패턴) ──
const rootRef = ref<HTMLElement | null>(null)

/** roving tabindex: 선택값(없으면 1)만 Tab 도달 가능 */
function tabindexFor(i: number) {
  const active = props.modelValue >= 1 && props.modelValue <= 5 ? props.modelValue : 1
  return i === active ? 0 : -1
}

function onKey(e: KeyboardEvent) {
  const cur = props.modelValue || 0
  let next: number
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, cur + 1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, (cur || 1) - 1)
  else if (e.key === 'Home') next = 1
  else if (e.key === 'End') next = 5
  else return
  e.preventDefault()
  emit('update:modelValue', next)
  nextTick(() => {
    const segs = rootRef.value?.querySelectorAll<HTMLElement>('.level-select__seg')
    segs?.[next - 1]?.focus()
  })
}
</script>

<template>
  <span ref="rootRef" class="level-select" role="radiogroup" :aria-label="label">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      role="radio"
      :aria-checked="modelValue === i"
      :aria-label="`${i}점`"
      :tabindex="tabindexFor(i)"
      class="level-select__seg"
      :class="{ 'level-select__seg--filled': i <= modelValue }"
      @click="emit('update:modelValue', i)"
      @keydown="onKey"
    />
    <span class="level-select__num mono tnum">{{ modelValue || '-' }}</span>
  </span>
</template>

<style scoped>
.level-select {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.level-select__seg {
  width: 26px;
  height: 14px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: var(--ink-150);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.level-select__seg--filled {
  background: var(--brand-500);
}

.level-select__seg:hover {
  background: var(--ink-300);
}

.level-select__seg--filled:hover {
  background: var(--brand-600);
}

.level-select__num {
  margin-left: 7px;
  min-width: 14px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-900);
  text-align: right;
}
</style>
