<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { getRoomPosterUrl } from '@/shared/api/storage'

const props = defineProps<{
  modelValue: File | null
  existingPath?: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [file: File | null] }>()

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const fileInput = ref<HTMLInputElement | null>(null)
const sizeError = ref('')

function openPicker() {
  if (props.disabled) return
  fileInput.value?.click()
}

function acceptFile(file: File): boolean {
  sizeError.value = ''
  if (!file.type.startsWith('image/')) return false
  if (file.size > MAX_BYTES) {
    sizeError.value = '파일 크기가 5MB를 초과합니다.'
    return false
  }
  emit('update:modelValue', file)
  return true
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return
  acceptFile(input.files[0])
  input.value = ''
}

function onPaste(e: ClipboardEvent) {
  if (props.disabled) return
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        acceptFile(file)
      }
      return
    }
  }
}

function remove() {
  if (props.disabled) return
  emit('update:modelValue', null)
}

function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}
</script>

<template>
  <div class="poster-picker" tabindex="0" @paste="onPaste">
    <!-- 기존 포스터 (편집 모드) -->
    <div v-if="existingPath && !modelValue" class="poster-picker__thumb poster-picker__thumb--existing">
      <img :src="getRoomPosterUrl(existingPath)" alt="현재 포스터" class="poster-picker__img" />
    </div>

    <!-- 새로 선택한 포스터 -->
    <div v-else-if="modelValue" class="poster-picker__thumb">
      <img :src="getPreviewUrl(modelValue)" alt="포스터 미리보기" class="poster-picker__img" />
      <button
        type="button"
        class="poster-picker__remove"
        :disabled="disabled"
        @click="remove"
      >
        <XMarkIcon class="poster-picker__remove-icon" />
      </button>
    </div>

    <!-- 추가 버튼 -->
    <button
      v-else
      type="button"
      class="poster-picker__add"
      :disabled="disabled"
      @click="openPicker"
    >
      <PhotoIcon class="poster-picker__add-icon" />
      <span>포스터</span>
      <span class="poster-picker__hint">Ctrl+V</span>
    </button>

    <p v-if="sizeError" class="poster-picker__error">{{ sizeError }}</p>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="poster-picker__hidden"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped>
.poster-picker__thumb {
  position: relative;
  width: 72px;
  height: 108px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.poster-picker__thumb--existing {
  opacity: 0.85;
}

.poster-picker__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-picker__remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.poster-picker__remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.poster-picker__remove-icon {
  width: 11px;
  height: 11px;
}

.poster-picker__add {
  width: 72px;
  height: 108px;
  border: 1.5px dashed #ccc;
  border-radius: 6px;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #888;
}

.poster-picker__add:hover:not(:disabled) {
  border-color: #4a90d9;
  color: #4a90d9;
}

.poster-picker__add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.poster-picker:focus {
  outline: none;
}

.poster-picker__add-icon {
  width: 20px;
  height: 20px;
}

.poster-picker__hint {
  font-size: 0.625rem;
  color: #bbb;
}

.poster-picker__hidden {
  display: none;
}

.poster-picker__error {
  font-size: 0.8125rem;
  color: #e53935;
  margin-top: 4px;
}
</style>
