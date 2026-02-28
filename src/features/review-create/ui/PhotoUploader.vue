<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { getPhotoPublicUrl } from '@/shared/api/storage'

const props = defineProps<{
  /** 새로 선택한 로컬 파일들 */
  modelValue: File[]
  /** 이미 저장된 사진 경로들 (편집 모드) */
  existingPaths?: string[]
  /** true면 파일 추가/제거 불가 (업로드 진행 중 등) */
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  'remove-existing': [path: string]
}>()

const MAX_PHOTOS = 3
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

const fileInput = ref<HTMLInputElement | null>(null)
const sizeError = ref('')

function openPicker() {
  if (props.disabled) return
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return

  sizeError.value = ''
  const newFiles = Array.from(input.files)

  const oversized = newFiles.filter((f) => f.size > MAX_BYTES)
  if (oversized.length > 0) {
    sizeError.value = `파일당 최대 5MB까지 가능합니다. (${oversized.map((f) => f.name).join(', ')})`
    input.value = ''
    return
  }

  const existingCount = props.existingPaths?.length ?? 0
  const combined = [...props.modelValue, ...newFiles].slice(0, MAX_PHOTOS - existingCount)
  emit('update:modelValue', combined)
  input.value = ''
}

function removeNewFile(index: number) {
  if (props.disabled) return
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

function removeExisting(path: string) {
  if (props.disabled) return
  emit('remove-existing', path)
}

function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

const existingCount = () => props.existingPaths?.length ?? 0
const totalCount = () => existingCount() + props.modelValue.length
const canAddMore = () => !props.disabled && totalCount() < MAX_PHOTOS
</script>

<template>
  <div class="photo-uploader">
    <div class="photo-uploader__grid">
      <!-- 기존 사진 (편집 모드) -->
      <div
        v-for="(path, i) in existingPaths"
        :key="`existing-${i}`"
        class="photo-uploader__thumb"
      >
        <img :src="getPhotoPublicUrl(path)" :alt="`기존 사진 ${i + 1}`" class="photo-uploader__img" />
        <button
          type="button"
          class="photo-uploader__remove"
          :disabled="disabled"
          @click="removeExisting(path)"
        >
          <XMarkIcon class="photo-uploader__remove-icon" />
        </button>
      </div>

      <!-- 새로 선택한 사진 -->
      <div
        v-for="(file, i) in modelValue"
        :key="`new-${i}`"
        class="photo-uploader__thumb"
      >
        <img :src="getPreviewUrl(file)" :alt="`사진 ${i + 1}`" class="photo-uploader__img" />
        <button
          type="button"
          class="photo-uploader__remove"
          :disabled="disabled"
          @click="removeNewFile(i)"
        >
          <XMarkIcon class="photo-uploader__remove-icon" />
        </button>
      </div>

      <!-- 추가 버튼 -->
      <button
        v-if="canAddMore()"
        type="button"
        class="photo-uploader__add"
        @click="openPicker"
      >
        <PhotoIcon class="photo-uploader__add-icon" />
        <span>{{ totalCount() === 0 ? '사진 추가' : '추가' }}</span>
      </button>
    </div>

    <p v-if="sizeError" class="photo-uploader__error">{{ sizeError }}</p>
    <p class="photo-uploader__hint">최대 {{ MAX_PHOTOS }}장 · 각 5MB 이하</p>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="photo-uploader__hidden"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped>
.photo-uploader__grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.photo-uploader__thumb {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.photo-uploader__thumb--existing {
  opacity: 0.85;
}

.photo-uploader__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-uploader__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
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

.photo-uploader__remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.photo-uploader__remove-icon {
  width: 12px;
  height: 12px;
}

.photo-uploader__add {
  width: 88px;
  height: 88px;
  border: 1.5px dashed #ccc;
  border-radius: 8px;
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

.photo-uploader__add:hover {
  border-color: #4a90d9;
  color: #4a90d9;
}

.photo-uploader__add-icon {
  width: 22px;
  height: 22px;
}

.photo-uploader__hidden {
  display: none;
}

.photo-uploader__error {
  font-size: 0.8125rem;
  color: #e53935;
  margin-top: 4px;
}

.photo-uploader__hint {
  font-size: 0.75rem;
  color: #bbb;
  margin-top: 4px;
}
</style>
