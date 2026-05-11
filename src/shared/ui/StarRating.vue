<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'

type SizeToken = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    modelValue: number
    readonly?: boolean
    size?: SizeToken | number
    mute?: boolean
    gap?: number
  }>(),
  { readonly: false, size: 'md', mute: false, gap: 2 },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverValue = ref(0)
const isDragging = ref(false)
const containerRef = ref<HTMLDivElement>()

const sizePx = computed(() => {
  if (typeof props.size === 'number') return props.size
  return props.size === 'sm' ? 20 : 28
})

const strokeColor = computed(() =>
  props.mute ? 'var(--ink-300)' : 'var(--ink-200)',
)

const STAR_PATH =
  'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z'

function fillRatio(index: number): number {
  const val = hoverValue.value || props.modelValue
  return Math.max(0, Math.min(1, val - (index - 1)))
}

function fillPct(index: number): number {
  return fillRatio(index) * 100
}

// ── 마우스 ──────────────────────────────────────────

function calcMouseVal(e: MouseEvent, index: number): number {
  const { left, width } = (e.currentTarget as Element).getBoundingClientRect()
  const val = e.clientX - left < width / 2 ? index - 0.5 : index
  return Math.max(1, val)
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

function calcTouchVal(clientX: number): number {
  if (!containerRef.value) return props.modelValue
  const wraps = containerRef.value.querySelectorAll<HTMLElement>('[data-n]')
  for (const wrap of wraps) {
    const { left, right, width } = wrap.getBoundingClientRect()
    if (clientX >= left && clientX <= right) {
      const n = parseInt(wrap.dataset.n!)
      return clientX - left < width / 2 ? n - 0.5 : n
    }
  }
  const first = wraps[0]?.getBoundingClientRect()
  const last = wraps[wraps.length - 1]?.getBoundingClientRect()
  if (first && clientX < first.left) return 1
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
  e.preventDefault()
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
    :class="{ 'star-rating--readonly': readonly }"
    :style="{ gap: `${gap}px` }"
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
      :style="{ width: `${sizePx}px`, height: `${sizePx}px` }"
      @mousedown="onMouseDown($event, n)"
      @mousemove="onMouseMove($event, n)"
    >
      <!-- 빈 별 (stroke only) -->
      <svg
        class="star star--bg"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          :d="STAR_PATH"
          fill="none"
          :stroke="strokeColor"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
      <!-- 가득찬 별 마스킹 (width = fill%) -->
      <span
        class="star-fill"
        :style="{ width: `${fillPct(n)}%` }"
        aria-hidden="true"
      >
        <svg
          class="star star--fg"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          :style="{ width: `${sizePx}px`, height: `${sizePx}px` }"
        >
          <path :d="STAR_PATH" fill="var(--color-star)" />
        </svg>
      </span>
    </span>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
}

.star-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.1s ease;
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

.star-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
}

.star-fill .star {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
