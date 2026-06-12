<script setup lang="ts">
type IconKind = 'check' | 'cross'

interface ToggleOption {
  value: string
  label: string
  icon?: IconKind
  accent?: string
}

defineProps<{
  modelValue: string
  options: ToggleOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="big-toggle">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="big-toggle__opt"
      :class="{ 'big-toggle__opt--active': modelValue === opt.value }"
      :style="
        modelValue === opt.value
          ? { '--accent': opt.accent || 'var(--brand-500)' }
          : undefined
      "
      @click="select(opt.value)"
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
