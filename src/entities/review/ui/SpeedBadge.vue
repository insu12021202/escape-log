<script setup lang="ts">
import { computed } from 'vue'
import { getSpeedBadge } from '../lib/escape-badge'

const props = defineProps<{
  remainingMinutes?: number | null
  isSuccess: boolean
}>()

const label = computed(() => getSpeedBadge(props.remainingMinutes, props.isSuccess))
</script>

<template>
  <span v-if="label" class="speed-badge" :title="`${remainingMinutes}분 남기고 탈출`">
    {{ label }}
  </span>
</template>

<style scoped>
.speed-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  background: var(--brand-50);
  color: var(--brand-600);
  white-space: nowrap;
}
</style>
