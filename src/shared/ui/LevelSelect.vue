<script setup lang="ts">
defineProps<{
  modelValue: number
  /** radiogroup 라벨 */
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()
</script>

<template>
  <span class="level-select" role="radiogroup" :aria-label="label">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      role="radio"
      :aria-checked="modelValue === i"
      :aria-label="`${i}점`"
      class="level-select__seg"
      :class="{ 'level-select__seg--filled': i <= modelValue }"
      @click="emit('update:modelValue', i)"
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
