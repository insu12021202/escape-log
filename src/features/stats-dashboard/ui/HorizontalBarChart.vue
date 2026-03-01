<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    items: Array<{ label: string; value: number }>
    color?: string
    showCount?: boolean
  }>(),
  { color: 'var(--color-primary)', showCount: true },
)

const maxValue = computed(() => Math.max(...props.items.map((i) => i.value), 1))
</script>

<template>
  <div class="h-bar-chart">
    <div v-for="item in items" :key="item.label" class="h-bar-chart__row">
      <span class="h-bar-chart__label">{{ item.label }}</span>
      <div class="h-bar-chart__track">
        <div
          class="h-bar-chart__fill"
          :style="{
            width: `${(item.value / maxValue) * 100}%`,
            background: color,
          }"
        />
      </div>
      <span v-if="showCount" class="h-bar-chart__count">{{ item.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.h-bar-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h-bar-chart__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.h-bar-chart__label {
  flex-shrink: 0;
  width: 72px;
  font-size: 0.8125rem;
  color: var(--color-text-sub);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h-bar-chart__track {
  flex: 1;
  height: 18px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.h-bar-chart__fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.4s ease;
  min-width: 2px;
}

.h-bar-chart__count {
  flex-shrink: 0;
  width: 28px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: right;
}
</style>
