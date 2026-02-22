<script setup lang="ts">
defineProps<{ overlay?: boolean }>()
</script>

<template>
  <div :class="['spinner', { 'spinner--overlay': overlay }]" role="status" aria-label="불러오는 중">
    <div class="spinner__circle" />
  </div>
</template>

<style scoped>
.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.spinner--overlay {
  position: fixed;
  inset: 0;
  padding: 0;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(2px);
  z-index: 200;
}

.spinner__circle {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
