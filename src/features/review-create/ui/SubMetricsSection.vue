<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
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
      <ChevronRightIcon class="sub-metrics__arrow" :class="{ 'sub-metrics__arrow--open': isOpen }" />
    </button>
    <Transition name="expand">
    <div v-if="isOpen" class="sub-metrics__body">
      <div v-for="item in labels" :key="item.key" class="sub-metrics__row">
        <span class="sub-metrics__label">{{ item.label }}</span>
        <StarRating :model-value="modelValue[item.key]" @update:model-value="update(item.key, $event)" />
      </div>
    </div>
    </Transition>
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
  border-top: 1px solid var(--color-border-light);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
}

.sub-metrics__arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform 0.22s ease;
}

.sub-metrics__arrow--open {
  transform: rotate(90deg);
}

.sub-metrics__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0 12px;
  overflow: hidden;
}

.sub-metrics__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-metrics__label {
  font-size: 0.875rem;
  color: var(--color-text-sub);
}

/* 펼치기/접기 애니메이션 */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.28s ease, opacity 0.22s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 400px;
  opacity: 1;
}
</style>
