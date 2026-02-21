<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    readonly?: boolean
    size?: 'sm' | 'md'
  }>(),
  { readonly: false, size: 'md' },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverValue = ref(0)

const STAR_PATH =
  'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z'

/** 해당 별의 채우기 비율 (0~100) */
function fillPct(index: number): number {
  const val = hoverValue.value || props.modelValue
  if (val >= index) return 100
  if (val >= index - 0.5) return 50
  return 0
}

function onMove(e: MouseEvent, index: number) {
  if (props.readonly) return
  const { left, width } = (e.currentTarget as Element).getBoundingClientRect()
  hoverValue.value = e.clientX - left < width / 2 ? index - 0.5 : index
}

function onClick(e: MouseEvent, index: number) {
  if (props.readonly) return
  const { left, width } = (e.currentTarget as Element).getBoundingClientRect()
  emit('update:modelValue', e.clientX - left < width / 2 ? index - 0.5 : index)
}
</script>

<template>
  <div
    class="star-rating"
    :class="[`star-rating--${size}`, { 'star-rating--readonly': readonly }]"
    @mouseleave="hoverValue = 0"
  >
    <span
      v-for="n in 5"
      :key="n"
      class="star-wrap"
      @mousemove="onMove($event, n)"
      @click="onClick($event, n)"
    >
      <!-- 배경별 (항상 회색) -->
      <svg class="star star--bg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path :d="STAR_PATH" fill="#D1D5DB" />
      </svg>
      <!-- 앞별 (노란색, clip-path로 채우기 비율만큼만 노출) -->
      <svg
        class="star star--fg"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        :style="{ clipPath: `inset(0 ${100 - fillPct(n)}% 0 0)` }"
      >
        <path :d="STAR_PATH" fill="#FBBF24" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

/* 인터랙티브 md */
.star-rating--md .star-wrap {
  width: 22px;
  height: 22px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.star-rating--md:not(.star-rating--readonly) .star-wrap:hover {
  transform: scale(1.2);
}

/* 작은 사이즈 sm */
.star-rating--sm .star-wrap {
  width: 16px;
  height: 16px;
}

.star-rating--readonly .star-wrap {
  cursor: default;
  pointer-events: none;
}

.star {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
