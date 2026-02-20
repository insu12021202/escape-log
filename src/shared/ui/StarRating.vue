<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    readonly?: boolean
  }>(),
  { readonly: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hoverIndex = ref(0)

function select(star: number) {
  if (!props.readonly) emit('update:modelValue', star)
}
</script>

<template>
  <span class="star-rating" :class="{ 'star-rating--readonly': readonly }">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star-rating__star"
      :class="{ 'star-rating__star--active': n <= (hoverIndex || modelValue) }"
      :disabled="readonly"
      @click="select(n)"
      @mouseenter="hoverIndex = n"
      @mouseleave="hoverIndex = 0"
    >
      {{ n <= (hoverIndex || modelValue) ? '★' : '☆' }}
    </button>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 2px;
}

.star-rating__star {
  background: none;
  border: none;
  padding: 0;
  font-size: 1.5rem;
  color: #ccc;
  cursor: pointer;
  line-height: 1;
  transition: color 0.1s;
}

.star-rating__star--active {
  color: #f5a623;
}

.star-rating__star:disabled {
  cursor: default;
}

.star-rating--readonly .star-rating__star {
  pointer-events: none;
}
</style>
