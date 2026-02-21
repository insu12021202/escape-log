<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

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
const isDragging = ref(false)
const containerRef = ref<HTMLDivElement>()

const STAR_PATH =
  'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z'

function fillPct(index: number): number {
  const val = hoverValue.value || props.modelValue
  if (val >= index) return 100
  if (val >= index - 0.5) return 50
  return 0
}

// ── 마우스 ──────────────────────────────────────────

function calcMouseVal(e: MouseEvent, index: number): number {
  const { left, width } = (e.currentTarget as Element).getBoundingClientRect()
  return e.clientX - left < width / 2 ? index - 0.5 : index
}

function onMouseDown(e: MouseEvent, index: number) {
  if (props.readonly) return
  isDragging.value = true
  const val = calcMouseVal(e, index)
  hoverValue.value = val
  emit('update:modelValue', val)
  document.addEventListener('mouseup', endDrag, { once: true })
}

function onMouseMove(e: MouseEvent, index: number) {
  if (props.readonly) return
  const val = calcMouseVal(e, index)
  hoverValue.value = val
  if (isDragging.value) emit('update:modelValue', val)
}

function onContainerLeave() {
  if (!isDragging.value) hoverValue.value = 0
}

function endDrag() {
  isDragging.value = false
  hoverValue.value = 0
}

// ── 터치 ──────────────────────────────────────────

/** 터치 좌표에서 어느 별 몇 번째인지 계산 */
function calcTouchVal(clientX: number): number {
  if (!containerRef.value) return props.modelValue
  // data-n 속성이 붙은 star-wrap span들을 순회해서 어느 별 위인지 찾음
  const wraps = containerRef.value.querySelectorAll<HTMLElement>('[data-n]')
  for (const wrap of wraps) {
    const { left, right, width } = wrap.getBoundingClientRect()
    if (clientX >= left && clientX <= right) {
      const n = parseInt(wrap.dataset.n!)
      return clientX - left < width / 2 ? n - 0.5 : n
    }
  }
  // 범위 밖이면 가장 가까운 끝값 반환
  const first = wraps[0]?.getBoundingClientRect()
  const last = wraps[wraps.length - 1]?.getBoundingClientRect()
  if (first && clientX < first.left) return 0.5
  if (last && clientX > last.right) return 5
  return props.modelValue
}

function onTouchStart(e: TouchEvent) {
  if (props.readonly || !e.touches[0]) return
  isDragging.value = true
  const val = calcTouchVal(e.touches[0].clientX)
  hoverValue.value = val
  emit('update:modelValue', val)
}

function onTouchMove(e: TouchEvent) {
  if (props.readonly || !isDragging.value || !e.touches[0]) return
  e.preventDefault() // 스크롤 방지
  const val = calcTouchVal(e.touches[0].clientX)
  hoverValue.value = val
  emit('update:modelValue', val)
}

function onTouchEnd() {
  isDragging.value = false
  hoverValue.value = 0
}

onUnmounted(() => {
  document.removeEventListener('mouseup', endDrag)
})
</script>

<template>
  <div
    ref="containerRef"
    class="star-rating"
    :class="[`star-rating--${size}`, { 'star-rating--readonly': readonly }]"
    @mouseleave="onContainerLeave"
    @touchstart.prevent="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
  >
    <span
      v-for="n in 5"
      :key="n"
      :data-n="n"
      class="star-wrap"
      @mousedown="onMouseDown($event, n)"
      @mousemove="onMouseMove($event, n)"
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
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y; /* 수직 스크롤은 허용, 수평 터치는 컴포넌트가 처리 */
}

.star-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

/* 인터랙티브 md */
.star-rating--md .star-wrap {
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.star-rating--md:not(.star-rating--readonly) .star-wrap:hover {
  transform: scale(1.2);
}

/* 작은 사이즈 sm */
.star-rating--sm .star-wrap {
  width: 20px;
  height: 20px;
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
