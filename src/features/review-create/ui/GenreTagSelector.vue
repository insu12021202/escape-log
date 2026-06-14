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
  font-size: 12.5px;
  padding: 7px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--ink-700);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.genre-selector__chip--active {
  background: var(--brand-500);
  border-color: var(--brand-500);
  color: var(--paper);
}

.genre-selector__custom {
  width: 100%;
  height: var(--control-height);
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--control-radius);
  background: var(--color-surface);
  font-size: 15px;
  color: var(--ink-1000);
  box-sizing: border-box;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.genre-selector__custom::placeholder {
  color: var(--ink-400);
}

.genre-selector__custom:focus {
  outline: none;
  border-color: var(--brand-500);
  box-shadow: var(--control-focus-ring);
}
</style>
