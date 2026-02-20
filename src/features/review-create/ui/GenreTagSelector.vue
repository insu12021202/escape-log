<script setup lang="ts">
import { GENRE_TAGS } from '@/entities/review/lib/genre-tags'

defineProps<{
  modelValue: string[]
  customGenre: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
  'update:customGenre': [value: string | null]
}>()

function toggle(tag: string, current: string[]) {
  if (current.includes(tag)) {
    emit(
      'update:modelValue',
      current.filter((t) => t !== tag),
    )
  } else {
    emit('update:modelValue', [...current, tag])
  }
}

function onCustomInput(e: Event) {
  const value = (e.target as HTMLInputElement).value.trim()
  emit('update:customGenre', value || null)
}
</script>

<template>
  <fieldset class="genre-selector">
    <legend class="genre-selector__legend">장르 태그</legend>
    <div class="genre-selector__tags">
      <button
        v-for="tag in GENRE_TAGS"
        :key="tag"
        type="button"
        class="genre-selector__chip"
        :class="{ 'genre-selector__chip--active': modelValue.includes(tag) }"
        @click="toggle(tag, modelValue)"
      >
        {{ tag }}
      </button>
    </div>
    <input
      class="genre-selector__custom"
      type="text"
      placeholder="기타 장르 (직접 입력)"
      maxlength="20"
      :value="customGenre ?? ''"
      @input="onCustomInput"
    />
  </fieldset>
</template>

<style scoped>
.genre-selector {
  border: none;
  padding: 0;
  margin: 0;
}

.genre-selector__legend {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.genre-selector__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.genre-selector__chip {
  font-size: 0.8125rem;
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #fff;
  color: #555;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.genre-selector__chip--active {
  background: #4a90d9;
  border-color: #4a90d9;
  color: #fff;
}

.genre-selector__custom {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
}
</style>
