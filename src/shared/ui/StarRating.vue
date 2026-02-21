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

// 같은 페이지에 여러 인스턴스가 있을 때 linearGradient ID 충돌 방지
const uid = Math.random().toString(36).slice(2, 7)
const hoverValue = ref(0)

const STAR_PATH =
  'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z'

/** 해당 별이 채워져야 할 비율 (0 | 50 | 100) */
function fillPct(index: number): 0 | 50 | 100 {
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
    <svg
      v-for="n in 5"
      :key="n"
      class="star-rating__star"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      @mousemove="onMove($event, n)"
      @click="onClick($event, n)"
    >
      <defs>
        <linearGradient :id="`sr-${uid}-${n}`" x1="0" x2="1" y1="0" y2="0">
          <stop :offset="`${fillPct(n)}%`" stop-color="#FBBF24" />
          <stop :offset="`${fillPct(n)}%`" stop-color="#D1D5DB" />
        </linearGradient>
      </defs>
      <path :d="STAR_PATH" :fill="`url(#sr-${uid}-${n})`" />
    </svg>
    <span v-if="!readonly && modelValue > 0" class="star-rating__label">{{ modelValue }}</span>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 인터랙티브 md (기본) */
.star-rating--md .star-rating__star {
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.star-rating--md:not(.star-rating--readonly) .star-rating__star:hover {
  transform: scale(1.15);
}

/* 작은 사이즈 (보조 지표, 읽기 전용 표시) */
.star-rating--sm .star-rating__star {
  width: 18px;
  height: 18px;
}

.star-rating--readonly .star-rating__star {
  cursor: default;
  pointer-events: none;
}

.star-rating__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #D97706;
  margin-left: 6px;
  line-height: 1;
}
</style>
