<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  sub?: string
  color?: string
}>()
</script>

<template>
  <div class="stat-card" :style="color ? { '--accent': color } : undefined">
    <span class="stat-card__value">{{ value }}</span>
    <span class="stat-card__label">{{ label }}</span>
    <span v-if="sub" class="stat-card__sub">{{ sub }}</span>
  </div>
</template>

<style scoped>
.stat-card {
  --accent: var(--color-primary);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 16px 14px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-top: 3px solid var(--accent);
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
}

.stat-card__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.stat-card__sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}
</style>
