<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean
    disabled?: boolean
  }>(),
  { active: false, disabled: false },
)

const emit = defineEmits<{
  click: []
}>()

function onClick() {
  emit('click')
}
</script>

<template>
  <button
    type="button"
    class="app-chip"
    :class="{ 'app-chip--active': active }"
    :disabled="disabled"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 11px;
  border-radius: 999px;
  border: none;
  background: var(--color-surface);
  color: var(--ink-800);
  box-shadow: inset 0 0 0 1px var(--color-border);
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.app-chip:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-chip--active {
  background: var(--ink-1000);
  color: var(--paper);
  box-shadow: inset 0 0 0 1px var(--ink-1000);
}
</style>
