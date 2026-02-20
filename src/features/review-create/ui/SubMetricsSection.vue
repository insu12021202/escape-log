<script setup lang="ts">
import { ref } from 'vue'
import type { SubMetrics } from '@/entities/review/types'
import StarRating from '@/shared/ui/StarRating.vue'

const props = defineProps<{
  modelValue: SubMetrics
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SubMetrics]
}>()

const isOpen = ref(false)

const labels: { key: keyof SubMetrics; label: string }[] = [
  { key: 'puzzleQuality', label: '퍼즐 퀄리티' },
  { key: 'storyDirection', label: '스토리/연출' },
  { key: 'setQuality', label: '장치/세트 퀄리티' },
  { key: 'horror', label: '공포도' },
  { key: 'puzzleDifficulty', label: '퍼즐 난이도' },
  { key: 'clearDifficulty', label: '클리어 난이도' },
]

function update(key: keyof SubMetrics, value: number) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="sub-metrics">
    <button type="button" class="sub-metrics__toggle" @click="isOpen = !isOpen">
      보조 지표 (1~5)
      <span class="sub-metrics__arrow" :class="{ 'sub-metrics__arrow--open': isOpen }">▸</span>
    </button>
    <div v-if="isOpen" class="sub-metrics__body">
      <div v-for="item in labels" :key="item.key" class="sub-metrics__row">
        <span class="sub-metrics__label">{{ item.label }}</span>
        <StarRating :model-value="modelValue[item.key]" @update:model-value="update(item.key, $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sub-metrics__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 0;
  background: none;
  border: none;
  border-top: 1px solid #eee;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.sub-metrics__arrow {
  font-size: 0.75rem;
  transition: transform 0.15s;
}

.sub-metrics__arrow--open {
  transform: rotate(90deg);
}

.sub-metrics__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0 12px;
}

.sub-metrics__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-metrics__label {
  font-size: 0.875rem;
  color: #555;
}
</style>
