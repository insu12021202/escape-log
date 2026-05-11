<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    borderRadius?: string
  }>(),
  {
    width: '100%',
    height: '16px',
    borderRadius: '4px',
  },
)
</script>

<template>
  <div
    class="skeleton-block"
    :style="{ width, height, borderRadius }"
  />
</template>

<style scoped>
.skeleton-block {
  background: linear-gradient(
    90deg,
    var(--ink-100) 25%,
    var(--ink-150) 50%,
    var(--ink-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
