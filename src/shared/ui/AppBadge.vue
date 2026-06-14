<script setup lang="ts">
import { computed } from 'vue'

type Kind = 'default' | 'success' | 'error' | 'primary' | 'soft' | 'outline' | 'ink'

const props = withDefaults(
  defineProps<{
    kind?: Kind
    size?: 'sm' | 'md'
    mono?: boolean
  }>(),
  { kind: 'default', size: 'md', mono: false },
)

const styles = computed(() => {
  switch (props.kind) {
    case 'success':
      return { background: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'transparent' }
    case 'error':
      return { background: 'var(--color-error-bg)', color: 'var(--color-error)', border: 'transparent' }
    case 'primary':
      return { background: 'var(--brand-500)', color: '#ffffff', border: 'transparent' }
    case 'outline':
      return { background: 'transparent', color: 'var(--ink-700)', border: 'var(--ink-200)' }
    case 'ink':
      return { background: 'var(--ink-1000)', color: 'var(--paper)', border: 'transparent' }
    case 'soft':
    case 'default':
    default:
      return { background: 'var(--ink-100)', color: 'var(--ink-800)', border: 'transparent' }
  }
})
</script>

<template>
  <span
    class="app-badge"
    :class="[`app-badge--${size}`, { 'app-badge--mono': mono }]"
    :style="{
      backgroundColor: styles.background,
      color: styles.color,
      borderColor: styles.border,
    }"
  >
    <slot />
  </span>
</template>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid transparent;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.app-badge--sm {
  padding: 2px 7px;
  font-size: 10.5px;
}

.app-badge--md {
  padding: 3px 9px;
  font-size: 11.5px;
}

.app-badge--mono {
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}
</style>
