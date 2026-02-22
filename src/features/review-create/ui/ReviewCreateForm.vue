<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Review, SubMetrics, Visibility } from '@/entities/review/types'
import { fetchGenreTags, createReview, updateReview, attachReviewPhoto } from '@/entities/review/api'
import { uploadPhoto } from '@/shared/api/storage'
import { searchRooms } from '@/entities/room/api'
import type { Room } from '@/entities/room/types'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import StarRating from '@/shared/ui/StarRating.vue'
import SubMetricsSection from './SubMetricsSection.vue'
import GenreTagSelector from './GenreTagSelector.vue'
import PhotoUploader from './PhotoUploader.vue'

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    reviewId?: string
    initialData?: Partial<{
      roomId: string
      visitedAt: string
      rating: number
      summary: string
      subMetrics: SubMetrics
      isSuccess: boolean
      remainingMinutes: number | null
      headcount: number
      genreTags: string[]
      customGenre: string | null
      wouldRevisit: boolean
      body: string
      visibility: Visibility
      photos: string[]
    }>
  }>(),
  { mode: 'create' },
)

const router = useRouter()

const rooms = ref<Room[]>([])
const genreTagOptions = ref<Array<{ id: string; name: string }>>([])
const submitting = ref(false)

// 사진 업로드 상태. Spec: §3.4
const selectedPhotos = ref<File[]>([])
const existingPhotos = ref<string[]>(props.initialData?.photos ?? [])
type PhotoState = 'idle' | 'uploading' | 'done' | 'error'
const photoUploadState = ref<PhotoState[]>([])
const pendingReviewId = ref<string | null>(null)

const errors = reactive({
  room: '',
  rating: '',
  summary: '',
  isSuccess: '',
  headcount: '',
  general: '',
})

const form = reactive({
  roomId: props.initialData?.roomId ?? '',
  visitedAt: props.initialData?.visitedAt ?? new Date().toISOString().slice(0, 10),
  rating: props.initialData?.rating ?? 0,
  summary: props.initialData?.summary ?? '',
  subMetrics: (props.initialData?.subMetrics ?? {
    puzzleQuality: 3,
    storyDirection: 3,
    setQuality: 3,
    horror: 3,
    puzzleDifficulty: 3,
    clearDifficulty: 3,
  }) as SubMetrics,
  isSuccess: (props.initialData?.isSuccess ?? null) as boolean | null,
  remainingMinutes: (props.initialData?.remainingMinutes ?? null) as number | null,
  headcount: props.initialData?.headcount ?? 0,
  genreTags: props.initialData?.genreTags ?? ([] as string[]),
  customGenre: (props.initialData?.customGenre ?? null) as string | null,
  wouldRevisit: props.initialData?.wouldRevisit ?? true,
  body: props.initialData?.body ?? '',
  visibility: (props.initialData?.visibility ?? 'group') as Visibility,
})

onMounted(async () => {
  const [roomList, tagList] = await Promise.all([searchRooms(''), fetchGenreTags()])
  rooms.value = roomList
  genreTagOptions.value = tagList
})

function validateForm(): boolean {
  errors.room = ''
  errors.rating = ''
  errors.summary = ''
  errors.isSuccess = ''
  errors.headcount = ''
  errors.general = ''

  let valid = true

  if (props.mode === 'create' && !form.roomId) {
    errors.room = '방을 선택해주세요.'
    valid = false
  }
  if (form.rating < 1) {
    errors.rating = '총평 별점을 1점 이상 입력해주세요.'
    valid = false
  }
  if (!form.summary.trim()) {
    errors.summary = '한줄평을 입력해주세요.'
    valid = false
  } else if (form.summary.length > 100) {
    errors.summary = '한줄평은 100자 이내로 입력해주세요.'
    valid = false
  }
  if (form.isSuccess === null) {
    errors.isSuccess = '성공/실패 여부를 선택해주세요.'
    valid = false
  }
  if (!form.headcount || form.headcount < 1) {
    errors.headcount = '인원 수를 1명 이상 입력해주세요.'
    valid = false
  }
  if (form.body.length > 3000) {
    errors.general = '본문은 3000자 이내로 입력해주세요.'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  // 이미 리뷰가 생성된 상태라면 사진 재시도만 수행
  if (pendingReviewId.value) {
    await retryPhotoUpload()
    return
  }

  submitting.value = true

  try {
    // 선택한 태그 이름 → ID 매핑
    const genreTagIds = form.genreTags
      .map((name) => genreTagOptions.value.find((t) => t.name === name)?.id)
      .filter((id): id is string => !!id)

    const payload = {
      visitedAt: form.visitedAt,
      rating: form.rating,
      summary: form.summary,
      subMetrics: form.subMetrics as Review['subMetrics'],
      visitMeta: {
        isSuccess: form.isSuccess as boolean,
        remainingMinutes: form.remainingMinutes,
        headcount: form.headcount,
        wouldRevisit: form.wouldRevisit,
      },
      genreTagIds,
      customGenre: form.customGenre,
      body: form.body,
      visibility: form.visibility,
    }

    let reviewId: string
    if (props.mode === 'edit' && props.reviewId) {
      await updateReview(props.reviewId, payload)
      reviewId = props.reviewId
    } else {
      const defaultGroupId = import.meta.env.VITE_DEFAULT_GROUP_ID as string
      const created = await createReview({ roomId: form.roomId, groupId: defaultGroupId, ...payload })
      reviewId = created.id
    }

    if (selectedPhotos.value.length > 0) {
      pendingReviewId.value = reviewId
      const allDone = await uploadPhotos(reviewId)
      if (!allDone) {
        // 업로드 실패 — 리뷰는 저장됨, 사진 재시도 안내
        errors.general = '리뷰가 저장됐지만 일부 사진 업로드에 실패했습니다. 재시도하거나 그대로 이동할 수 있습니다.'
        return
      }
    }

    navigateAfterSave(reviewId)
  } catch (e) {
    console.error(e)
    errors.general = '리뷰 저장 중 오류가 발생했습니다.'
  } finally {
    submitting.value = false
  }
}

/** 사진 업로드 시도. 모두 성공하면 true 반환. */
async function uploadPhotos(reviewId: string): Promise<boolean> {
  photoUploadState.value = selectedPhotos.value.map(() => 'uploading' as PhotoState)

  let anyError = false
  for (let i = 0; i < selectedPhotos.value.length; i++) {
    if (photoUploadState.value[i] === 'done') continue
    try {
      const path = await uploadPhoto(reviewId, selectedPhotos.value[i]!, i)
      await attachReviewPhoto(reviewId, path, i)
      photoUploadState.value[i] = 'done'
    } catch (e) {
      console.error(e)
      photoUploadState.value[i] = 'error'
      anyError = true
    }
  }
  return !anyError
}

/** 실패한 사진만 재시도 */
async function retryPhotoUpload() {
  if (!pendingReviewId.value) return
  submitting.value = true
  errors.general = ''
  try {
    const allDone = await uploadPhotos(pendingReviewId.value)
    if (allDone) {
      navigateAfterSave(pendingReviewId.value)
    } else {
      errors.general = '일부 사진 업로드에 실패했습니다. 다시 시도해주세요.'
    }
  } finally {
    submitting.value = false
  }
}

/** 사진 없이 이동 (리뷰는 이미 저장된 상태) */
function skipPhotosAndNavigate() {
  if (pendingReviewId.value) navigateAfterSave(pendingReviewId.value)
}

function navigateAfterSave(reviewId: string) {
  if (props.mode === 'edit') {
    router.push(`/review/${reviewId}`)
  } else {
    router.push('/')
  }
}
</script>

<template>
  <form class="review-form" @submit.prevent="handleSubmit">
    <!-- 방 선택 (수정 모드에서는 고정) -->
    <div class="review-form__field">
      <label class="review-form__label" for="room-select">방 선택 *</label>
      <template v-if="mode === 'edit'">
        <p class="review-form__room-fixed">
          {{ rooms.find((r) => r.id === form.roomId)?.vendorName }} ·
          {{ rooms.find((r) => r.id === form.roomId)?.themeName }}
        </p>
      </template>
      <template v-else>
        <div class="review-form__select-wrapper">
          <select id="room-select" v-model="form.roomId" class="review-form__select">
            <option value="" disabled>테마를 선택하세요</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">
              {{ room.vendorName }} · {{ room.themeName }} ({{ room.region }})
            </option>
          </select>
          <ChevronDownIcon class="review-form__select-icon" />
        </div>
        <p v-if="errors.room" class="review-form__field-error">{{ errors.room }}</p>
      </template>
    </div>

    <!-- 방문일 -->
    <div class="review-form__field">
      <label class="review-form__label" for="visited-at-input">방문일 *</label>
      <input
        id="visited-at-input"
        v-model="form.visitedAt"
        class="review-form__input"
        type="date"
        required
      />
    </div>

    <!-- 총평 별점 Spec: §3.1 -->
    <div class="review-form__field">
      <label class="review-form__label">총평 별점 *</label>
      <StarRating v-model="form.rating" />
      <p v-if="errors.rating" class="review-form__field-error">{{ errors.rating }}</p>
    </div>

    <!-- 한줄평 Spec: §3.1 -->
    <div class="review-form__field">
      <label class="review-form__label" for="summary-input">한줄평 *</label>
      <input
        id="summary-input"
        v-model="form.summary"
        class="review-form__input"
        type="text"
        maxlength="100"
        placeholder="100자 이내로 작성"
      />
      <span class="review-form__counter">{{ form.summary.length }}/100</span>
      <p v-if="errors.summary" class="review-form__field-error">{{ errors.summary }}</p>
    </div>

    <!-- 보조 지표 Spec: §3.2 -->
    <SubMetricsSection v-model="form.subMetrics" />

    <!-- 방문 메타 Spec: §3.3 -->
    <fieldset class="review-form__fieldset">
      <legend class="review-form__legend">방문 정보</legend>

      <div class="review-form__row">
        <label class="review-form__label">결과 *</label>
        <div class="review-form__radio-group">
          <label class="review-form__radio">
            <input v-model="form.isSuccess" type="radio" :value="true" />
            성공
          </label>
          <label class="review-form__radio">
            <input v-model="form.isSuccess" type="radio" :value="false" />
            실패
          </label>
        </div>
      </div>
      <p v-if="errors.isSuccess" class="review-form__field-error">{{ errors.isSuccess }}</p>

      <div class="review-form__row">
        <label class="review-form__label" for="remaining-input">남은 시간(분)</label>
        <input
          id="remaining-input"
          v-model.number="form.remainingMinutes"
          class="review-form__input review-form__input--short"
          type="number"
          min="0"
          max="120"
          placeholder="선택"
        />
      </div>

      <div class="review-form__row">
        <label class="review-form__label" for="headcount-input">인원 수 *</label>
        <input
          id="headcount-input"
          v-model.number="form.headcount"
          class="review-form__input review-form__input--short"
          type="number"
          min="1"
          max="10"
        />
      </div>
      <p v-if="errors.headcount" class="review-form__field-error">{{ errors.headcount }}</p>

      <GenreTagSelector
        v-model="form.genreTags"
        :custom-genre="form.customGenre"
        @update:custom-genre="form.customGenre = $event"
      />

      <div class="review-form__row">
        <label class="review-form__label">재방문 의사</label>
        <div class="review-form__radio-group">
          <label class="review-form__radio">
            <input v-model="form.wouldRevisit" type="radio" :value="true" />
            Yes
          </label>
          <label class="review-form__radio">
            <input v-model="form.wouldRevisit" type="radio" :value="false" />
            No
          </label>
        </div>
      </div>
    </fieldset>

    <!-- 본문 Spec: §3.4 -->
    <div class="review-form__field">
      <label class="review-form__label" for="body-input">본문</label>
      <textarea
        id="body-input"
        v-model="form.body"
        class="review-form__textarea"
        maxlength="3000"
        rows="6"
        placeholder="자유롭게 작성 (3000자 이내)"
      />
      <span class="review-form__counter">{{ form.body.length }}/3000</span>
    </div>

    <!-- 사진 Spec: §3.4 -->
    <div class="review-form__field">
      <label class="review-form__label">사진 (1~3장)</label>
      <PhotoUploader
        v-model="selectedPhotos"
        :existing-paths="existingPhotos"
        :disabled="!!pendingReviewId"
      />
    </div>

    <!-- 공개 범위 -->
    <div class="review-form__field">
      <label class="review-form__label" for="visibility-select">공개 범위</label>
      <div class="review-form__select-wrapper">
        <select id="visibility-select" v-model="form.visibility" class="review-form__select">
          <option value="group">회원 공개</option>
          <option value="private">나만 보기</option>
        </select>
        <ChevronDownIcon class="review-form__select-icon" />
      </div>
    </div>

    <p v-if="errors.general" class="review-form__field-error">{{ errors.general }}</p>

    <!-- 사진 업로드 실패 시 retry / skip 버튼 -->
    <div v-if="pendingReviewId && photoUploadState.some((s) => s === 'error')" class="review-form__photo-actions">
      <button type="button" class="review-form__retry-btn" :disabled="submitting" @click="retryPhotoUpload">
        {{ submitting ? '재시도 중...' : '사진 재시도' }}
      </button>
      <button type="button" class="review-form__skip-btn" :disabled="submitting" @click="skipPhotosAndNavigate">
        사진 없이 이동
      </button>
    </div>

    <button
      v-if="!pendingReviewId"
      type="submit"
      class="review-form__submit"
      :disabled="submitting"
    >
      {{ submitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '리뷰 저장' }}
    </button>
  </form>
</template>

<style scoped>
.review-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
}

.review-form__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.review-form__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
}

.review-form__select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.review-form__select-icon {
  position: absolute;
  right: 8px;
  width: 16px;
  height: 16px;
  color: #666;
  pointer-events: none;
}

.review-form__input,
.review-form__select,
.review-form__textarea {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
}

.review-form__select {
  appearance: none;
  padding-right: 32px;
  width: 100%;
  cursor: pointer;
}

.review-form__input--short {
  width: 100px;
}

.review-form__textarea {
  resize: vertical;
}

.review-form__counter {
  font-size: 0.75rem;
  color: #999;
  text-align: right;
}

.review-form__fieldset {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-form__legend {
  font-weight: 600;
  font-size: 0.9375rem;
  padding: 0 4px;
}

.review-form__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-form__radio-group {
  display: flex;
  gap: 12px;
}

.review-form__radio {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.review-form__placeholder {
  font-size: 0.8125rem;
  color: #999;
  padding: 16px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  text-align: center;
}

.review-form__field-error {
  font-size: 0.8125rem;
  color: #e53935;
  margin-top: 2px;
}

.review-form__room-fixed {
  font-size: 0.875rem;
  color: #555;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f9f9f9;
}

.review-form__submit {
  padding: 12px;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.review-form__submit:hover:not(:disabled) {
  background: #357abd;
}

.review-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.review-form__photo-actions {
  display: flex;
  gap: 8px;
}

.review-form__retry-btn {
  flex: 1;
  padding: 10px;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}

.review-form__retry-btn:hover:not(:disabled) {
  background: #357abd;
}

.review-form__skip-btn {
  padding: 10px 16px;
  background: #fff;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9375rem;
  cursor: pointer;
}

.review-form__skip-btn:hover:not(:disabled) {
  border-color: #aaa;
  color: #666;
}

.review-form__retry-btn:disabled,
.review-form__skip-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
