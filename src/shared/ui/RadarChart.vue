<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    values: Record<string, number>
    labels: Record<string, string>
    max?: number
  }>(),
  { max: 5 },
)

const keys = computed(() => Object.keys(props.labels))
const count = computed(() => keys.value.length)

const SIZE = 260
const CENTER = SIZE / 2
const RADIUS = 75
const LABEL_RADIUS = RADIUS + 28

function polarToXY(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)]
}

function axisAngle(i: number): number {
  return (360 / count.value) * i
}

/** 그리드 다각형 (1~max 단계) */
const gridPolygons = computed(() => {
  const steps = props.max
  return Array.from({ length: steps }, (_, si) => {
    const r = (RADIUS / steps) * (si + 1)
    return keys.value.map((_, i) => polarToXY(axisAngle(i), r).join(',')).join(' ')
  })
})

/** 축선 좌표 */
const axisLines = computed(() =>
  keys.value.map((_, i) => ({
    x2: polarToXY(axisAngle(i), RADIUS)[0],
    y2: polarToXY(axisAngle(i), RADIUS)[1],
  })),
)

/** 데이터 폴리곤 */
const dataPolygon = computed(() =>
  keys.value
    .map((key, i) => {
      const val = Math.min(props.values[key] ?? 0, props.max)
      const r = (val / props.max) * RADIUS
      return polarToXY(axisAngle(i), r).join(',')
    })
    .join(' '),
)

/** 라벨 위치 */
const labelPositions = computed(() =>
  keys.value.map((key, i) => {
    const [x, y] = polarToXY(axisAngle(i), LABEL_RADIUS)
    const angle = axisAngle(i)
    let anchor: 'middle' | 'start' | 'end' = 'middle'
    if (angle > 20 && angle < 160) anchor = 'start'
    else if (angle > 200 && angle < 340) anchor = 'end'
    return {
      key,
      label: props.labels[key] ?? key,
      value: props.values[key] ?? 0,
      x,
      y,
      anchor,
    }
  }),
)
</script>

<template>
  <div class="radar-chart">
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="radar-chart__svg">
      <!-- 그리드 -->
      <polygon
        v-for="(points, i) in gridPolygons"
        :key="'grid-' + i"
        :points="points"
        class="radar-chart__grid"
      />

      <!-- 축선 -->
      <line
        v-for="(line, i) in axisLines"
        :key="'axis-' + i"
        :x1="CENTER"
        :y1="CENTER"
        :x2="line.x2"
        :y2="line.y2"
        class="radar-chart__axis"
      />

      <!-- 데이터 영역 -->
      <polygon :points="dataPolygon" class="radar-chart__data" />

      <!-- 데이터 포인트 -->
      <circle
        v-for="(lp, i) in labelPositions"
        :key="'dot-' + i"
        :cx="
          polarToXY(axisAngle(i), (Math.min(lp.value, max) / max) * RADIUS)[0]
        "
        :cy="
          polarToXY(axisAngle(i), (Math.min(lp.value, max) / max) * RADIUS)[1]
        "
        r="3"
        class="radar-chart__dot"
      />

      <!-- 라벨 -->
      <text
        v-for="lp in labelPositions"
        :key="'label-' + lp.key"
        :x="lp.x"
        :y="lp.y"
        :text-anchor="lp.anchor"
        dominant-baseline="central"
        class="radar-chart__label"
      >
        {{ lp.label }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.radar-chart {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}

.radar-chart__svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.radar-chart__grid {
  fill: none;
  stroke: var(--color-border-light);
  stroke-width: 0.8;
}

.radar-chart__axis {
  stroke: var(--color-border);
  stroke-width: 0.5;
}

.radar-chart__data {
  fill: rgba(74, 144, 217, 0.2);
  stroke: var(--color-primary);
  stroke-width: 1.5;
}

.radar-chart__dot {
  fill: var(--color-primary);
}

.radar-chart__label {
  font-size: 10px;
  fill: var(--color-text-sub);
  font-weight: 500;
}
</style>
