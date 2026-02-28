<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Review, SubMetrics, Visibility } from '@/entities/review/types'
import { fetchGenreTags, createReview, updateReview, attachReviewPhoto } from '@/entities/review/api'
import { uploadPhoto } from '@/shared/api/storage'
import { searchRooms, createRoom } from '@/entities/room/api'
import type { Room } from '@/entities/room/types'
import StarRating from '@/shared/ui/StarRating.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import SubMetricsSection from './SubMetricsSection.vue'
import GenreTagSelector from './GenreTagSelector.vue'
import PhotoUploader from './PhotoUploader.vue'
import { useToastStore } from '@/shared/model/toast'

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    reviewId?: string
    initialData?: Partial<{
      roomId: string
      visitedAt: string | null
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
      hasSpoiler: boolean
      visibility: Visibility
      photos: string[]
    }>
  }>(),
  { mode: 'create' },
)

const router = useRouter()
const toast = useToastStore()

// ── 임시 저장 (create 모드 전용) ──────────────────────
const DRAFT_KEY = 'escape-log:review-draft'
const showRestoreDialog = ref(false)

function saveDraft() {
  if (props.mode !== 'create') return
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, currentStep: currentStep.value }))
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as { form: typeof form; currentStep: number }
    Object.assign(form, saved.form)
    currentStep.value = saved.currentStep ?? 1
  } catch {
    clearDraft()
  }
}
// ────────────────────────────────────────────────────

const rooms = ref<Room[]>([])
const genreTagOptions = ref<Array<{ id: string; name: string }>>([])
const submitting = ref(false)

// 인라인 방 등록
const showRoomForm = ref(false)
const roomForm = reactive({ vendorName: '', themeName: '', region: '' })
const roomFormError = ref('')
const roomFormSubmitting = ref(false)

// 위자드 스텝 (create 모드 전용)
const TOTAL_STEPS = 4
const currentStep = ref(1)

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
  hasSpoiler: props.initialData?.hasSpoiler ?? false,
  visibility: (props.initialData?.visibility ?? 'group') as Visibility,
})

const roomOptions = computed(() => [
  { value: '', label: '테마를 선택하세요' },
  ...rooms.value.map((r) => ({ value: r.id, label: `${r.vendorName} · ${r.themeName} (${r.region})` })),
])

const visibilityOptions = [
  { value: 'group', label: '회원 공개' },
  { value: 'private', label: '나만 보기' },
]

onMounted(async () => {
  const [roomList, tagList] = await Promise.all([searchRooms(''), fetchGenreTags()])
  rooms.value = roomList
  genreTagOptions.value = tagList

  if (props.mode === 'create' && localStorage.getItem(DRAFT_KEY)) {
    showRestoreDialog.value = true
  }
})

watch([() => ({ ...form }), currentStep], saveDraft, { deep: true })

async function handleCreateRoom() {
  roomFormError.value = ''
  if (!roomForm.vendorName.trim()) { roomFormError.value = '업체명을 입력해주세요.'; return }
  if (!roomForm.themeName.trim()) { roomFormError.value = '테마명을 입력해주세요.'; return }
  if (!roomForm.region.trim()) { roomFormError.value = '지역을 입력해주세요.'; return }

  roomFormSubmitting.value = true
  try {
    const newRoom = await createRoom({
      vendorName: roomForm.vendorName.trim(),
      themeName: roomForm.themeName.trim(),
      region: roomForm.region.trim(),
    })
    rooms.value.unshift(newRoom)
    form.roomId = newRoom.id
    showRoomForm.value = false
    roomForm.vendorName = ''
    roomForm.themeName = ''
    roomForm.region = ''
  } catch (e) {
    console.error(e)
    roomFormError.value = '방 등록에 실패했습니다. 다시 시도해주세요.'
  } finally {
    roomFormSubmitting.value = false
  }
}

function validateStep(step: number): boolean {
  switch (step) {
    case 1:
      errors.room = ''
      if (props.mode === 'create' && !form.roomId) {
        errors.room = '방을 선택해주세요.'
        return false
      }
      return true
    case 2:
      errors.rating = ''
      errors.summary = ''
      if (form.rating < 1) {
        errors.rating = '총평 별점을 1점 이상 입력해주세요.'
        return false
      }
      if (!form.summary.trim()) {
        errors.summary = '한줄평을 입력해주세요.'
        return false
      }
      if (form.summary.length > 100) {
        errors.summary = '한줄평은 100자 이내로 입력해주세요.'
        return false
      }
      return true
    case 3:
      errors.isSuccess = ''
      errors.headcount = ''
      if (form.isSuccess === null) {
        errors.isSuccess = '성공/실패 여부를 선택해주세요.'
        return false
      }
      if (!form.headcount || form.headcount < 1) {
        errors.headcount = '인원 수를 1명 이상 입력해주세요.'
        return false
      }
      return true
    case 4:
      errors.general = ''
      if (form.body.length > 3000) {
        errors.general = '본문은 3000자 이내로 입력해주세요.'
        return false
      }
      return true
  }
  return true
}

function goNext() {
  if (!validateStep(currentStep.value)) return
  currentStep.value++
}

function goPrev() {
  currentStep.value--
}

function validateForm(): boolean {
  return (
    validateStep(1) &&
    validateStep(2) &&
    validateStep(3) &&
    validateStep(4)
  )
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
      visitedAt: form.visitedAt || null,
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
      hasSpoiler: form.hasSpoiler,
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
  clearDraft()
  if (props.mode === 'edit') {
    toast.success('리뷰가 수정되었습니다.')
    router.push(`/review/${reviewId}`)
  } else {
    toast.success('리뷰가 저장되었습니다.')
    router.push('/')
  }
}
</script>

<template>
  <!-- 임시 저장 복원 다이얼로그 -->
  <Teleport to="body">
    <div v-if="showRestoreDialog" class="draft-overlay">
      <div class="draft-dialog">
        <p class="draft-dialog__title">이전에 작성하던 리뷰가 있어요</p>
        <p class="draft-dialog__desc">이어서 작성하시겠어요?</p>
        <div class="draft-dialog__actions">
          <button
            type="button"
            class="draft-dialog__btn draft-dialog__btn--secondary"
            @click="clearDraft(); showRestoreDialog = false"
          >새로 작성</button>
          <button
            type="button"
            class="draft-dialog__btn draft-dialog__btn--primary"
            @click="loadDraft(); showRestoreDialog = false"
          >이어서 쓰기</button>
        </div>
      </div>
    </div>
  </Teleport>

  <form class="review-form" @submit.prevent="handleSubmit">

    <!-- 위자드 헤더: create 모드만 표시 -->
    <div v-if="mode === 'create'" class="review-form__wizard-header">
      <div class="review-form__wizard-nav">
        <button v-if="currentStep > 1" type="button" class="review-form__back" @click="goPrev">← 이전</button>
        <span class="review-form__step-counter">{{ currentStep }} / {{ TOTAL_STEPS }}</span>
      </div>
      <div class="review-form__progress-track">
        <div class="review-form__progress-fill" :style="{ width: (currentStep / TOTAL_STEPS * 100) + '%' }" />
      </div>
    </div>

    <!-- 섹션 1: 기본 -->
    <section v-if="mode === 'edit' || currentStep === 1" class="review-form__section">
      <h3 class="review-form__section-title">기본 정보</h3>

      <div class="review-form__field">
        <label class="review-form__label" for="room-select">방 선택 *</label>
        <template v-if="mode === 'edit'">
          <p class="review-form__room-fixed">
            {{ rooms.find((r) => r.id === form.roomId)?.vendorName }} ·
            {{ rooms.find((r) => r.id === form.roomId)?.themeName }}
          </p>
        </template>
        <template v-else>
          <BaseSelect v-model="form.roomId" :options="roomOptions" variant="input" />
          <p v-if="errors.room" class="review-form__field-error">{{ errors.room }}</p>

          <!-- 인라인 방 등록 -->
          <button type="button" class="review-form__add-room-toggle" @click="showRoomForm = !showRoomForm">
            {{ showRoomForm ? '− 등록 취소' : '+ 방이 없어요? 직접 등록' }}
          </button>

          <Transition name="expand">
            <div v-if="showRoomForm" class="review-form__room-mini">
              <div class="review-form__row">
                <div class="review-form__field review-form__field--inline">
                  <label class="review-form__label">업체명 *</label>
                  <input v-model="roomForm.vendorName" class="review-form__input" type="text" placeholder="예: 키이스케이프" />
                </div>
                <div class="review-form__field review-form__field--inline">
                  <label class="review-form__label">테마명 *</label>
                  <input v-model="roomForm.themeName" class="review-form__input" type="text" placeholder="예: 탈옥" />
                </div>
              </div>
              <div class="review-form__field">
                <label class="review-form__label">지역 *</label>
                <input v-model="roomForm.region" class="review-form__input" type="text" placeholder="예: 홍대" />
              </div>
              <p v-if="roomFormError" class="review-form__field-error">{{ roomFormError }}</p>
              <button type="button" class="review-form__room-submit" :disabled="roomFormSubmitting" @click="handleCreateRoom">
                {{ roomFormSubmitting ? '등록 중...' : '방 등록하기' }}
              </button>
            </div>
          </Transition>
        </template>
      </div>

      <div class="review-form__field">
        <label class="review-form__label" for="visited-at-input">방문일</label>
        <input
          id="visited-at-input"
          v-model="form.visitedAt"
          class="review-form__input"
          type="date"
        />
      </div>
    </section>

    <!-- 섹션 2: 평가 -->
    <section v-if="mode === 'edit' || currentStep === 2" class="review-form__section">
      <h3 class="review-form__section-title">평가</h3>

      <div class="review-form__field">
        <label class="review-form__label">총평 별점 *</label>
        <StarRating v-model="form.rating" />
        <p v-if="errors.rating" class="review-form__field-error">{{ errors.rating }}</p>
      </div>

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
    </section>

    <!-- 섹션 3: 방문 정보 -->
    <section v-if="mode === 'edit' || currentStep === 3" class="review-form__section">
      <h3 class="review-form__section-title">방문 정보</h3>

      <div class="review-form__field">
        <label class="review-form__label">결과 *</label>
        <div class="review-form__pill-group">
          <button
            type="button"
            class="review-form__pill"
            :class="{ 'review-form__pill--active-success': form.isSuccess === true }"
            @click="form.isSuccess = true"
          >성공</button>
          <button
            type="button"
            class="review-form__pill"
            :class="{ 'review-form__pill--active-fail': form.isSuccess === false }"
            @click="form.isSuccess = false"
          >실패</button>
        </div>
        <p v-if="errors.isSuccess" class="review-form__field-error">{{ errors.isSuccess }}</p>
      </div>

      <div class="review-form__row">
        <div class="review-form__field review-form__field--inline">
          <label class="review-form__label" for="headcount-input">인원 수 *</label>
          <input
            id="headcount-input"
            v-model.number="form.headcount"
            class="review-form__input review-form__input--short"
            type="number"
            min="1"
            max="10"
          />
          <p v-if="errors.headcount" class="review-form__field-error">{{ errors.headcount }}</p>
        </div>

        <div class="review-form__field review-form__field--inline">
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
      </div>

      <GenreTagSelector
        v-model="form.genreTags"
        :custom-genre="form.customGenre"
        @update:custom-genre="form.customGenre = $event"
      />

      <div class="review-form__field">
        <label class="review-form__label">재방문 의사</label>
        <div class="review-form__pill-group">
          <button
            type="button"
            class="review-form__pill"
            :class="{ 'review-form__pill--active': form.wouldRevisit === true }"
            @click="form.wouldRevisit = true"
          >Yes</button>
          <button
            type="button"
            class="review-form__pill"
            :class="{ 'review-form__pill--active': form.wouldRevisit === false }"
            @click="form.wouldRevisit = false"
          >No</button>
        </div>
      </div>
    </section>

    <!-- 섹션 4: 기록 -->
    <section v-if="mode === 'edit' || currentStep === 4" class="review-form__section">
      <h3 class="review-form__section-title">기록</h3>

      <div class="review-form__field">
        <label class="review-form__label" for="body-input">본문</label>
        <textarea
          id="body-input"
          v-model="form.body"
          class="review-form__textarea"
          maxlength="3000"
          rows="5"
          placeholder="자유롭게 작성 (3000자 이내)"
        />
        <span class="review-form__counter">{{ form.body.length }}/3000</span>
      </div>

      <div class="review-form__field">
        <label class="review-form__checkbox-label">
          <input
            type="checkbox"
            v-model="form.hasSpoiler"
            class="review-form__checkbox"
          />
          <span>스포일러 포함</span>
        </label>
        <p class="review-form__field-hint">체크하면 다른 사용자에게 한줄평과 본문이 블러 처리됩니다.</p>
      </div>

      <div class="review-form__field">
        <label class="review-form__label">사진 (최대 3장)</label>
        <PhotoUploader
          v-model="selectedPhotos"
          :existing-paths="existingPhotos"
          :disabled="!!pendingReviewId"
        />
      </div>

      <div class="review-form__field">
        <label class="review-form__label">공개 범위</label>
        <BaseSelect v-model="form.visibility" :options="visibilityOptions" variant="input" />
      </div>
    </section>

    <p v-if="(mode === 'edit' || currentStep === 4) && errors.general" class="review-form__field-error">{{ errors.general }}</p>

    <!-- 사진 업로드 실패 시 retry / skip 버튼 -->
    <div v-if="pendingReviewId && photoUploadState.some((s) => s === 'error')" class="review-form__photo-actions">
      <button type="button" class="review-form__retry-btn" :disabled="submitting" @click="retryPhotoUpload">
        {{ submitting ? '재시도 중...' : '사진 재시도' }}
      </button>
      <button type="button" class="review-form__skip-btn" :disabled="submitting" @click="skipPhotosAndNavigate">
        사진 없이 이동
      </button>
    </div>

    <div v-if="!pendingReviewId" class="review-form__footer">
      <!-- create 모드: 마지막 스텝 전까지 "다음", 마지막은 "리뷰 저장" -->
      <button
        v-if="mode === 'create' && currentStep < TOTAL_STEPS"
        type="button"
        class="review-form__submit"
        @click="goNext"
      >
        다음
      </button>
      <button v-else type="submit" class="review-form__submit" :disabled="submitting">
        {{ submitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '리뷰 저장' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.review-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 80px; /* sticky footer 여백 */
}

/* 위자드 헤더 */
.review-form__wizard-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 0 4px;
}

.review-form__wizard-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 28px;
}

.review-form__back {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.review-form__back:hover {
  color: var(--color-text-sub);
}

.review-form__progress-track {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: 99px;
  overflow: hidden;
}

.review-form__progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 99px;
  transition: width 0.3s ease;
}

.review-form__step-counter {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

/* 섹션 */
.review-form__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-form__section-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

/* 필드 */
.review-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-form__field--inline {
  flex: 1;
  min-width: 0;
}

.review-form__row {
  display: flex;
  gap: 16px;
}

.review-form__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-sub);
}

/* 입력 */
.review-form__input,
.review-form__select,
.review-form__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color var(--transition-fast);
  min-height: 48px;
  max-width: 100%;
}

.review-form__input:focus,
.review-form__select:focus,
.review-form__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}


.review-form__textarea {
  resize: vertical;
  min-height: 120px;
}

.review-form__counter {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: right;
}

/* 체크박스 */
.review-form__checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  color: var(--color-text);
  cursor: pointer;
}

.review-form__checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.review-form__field-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

/* 에러 */
.review-form__field-error {
  font-size: 0.8125rem;
  color: var(--color-error);
}

/* 고정 방 표시 */
.review-form__room-fixed {
  font-size: 0.9375rem;
  color: var(--color-text-sub);
  padding: 11px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  min-height: 48px;
  display: flex;
  align-items: center;
}

/* Pill 버튼 (성공/실패, 재방문) */
.review-form__pill-group {
  display: flex;
  gap: 8px;
}

.review-form__pill {
  flex: 1;
  padding: 10px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-sub);
  background: var(--color-surface);
  transition: all var(--transition-fast);
  min-height: 44px;
}

.review-form__pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.review-form__pill--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}

.review-form__pill--active-success {
  border-color: var(--color-success);
  background: var(--color-success-bg);
  color: var(--color-success);
  font-weight: 600;
}

.review-form__pill--active-fail {
  border-color: var(--color-error);
  background: var(--color-error-bg);
  color: var(--color-error);
  font-weight: 600;
}

/* 제출 푸터 */
.review-form__footer {
  position: sticky;
  bottom: 0;
  background: var(--color-bg);
  padding: 12px 0;
  margin: 0 -16px;
  padding: 12px 16px;
}

.review-form__submit {
  width: 100%;
  padding: 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  transition: background var(--transition-fast);
  min-height: 52px;
}

.review-form__submit:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.review-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 인라인 방 등록 */
.review-form__add-room-toggle {
  font-size: 0.8125rem;
  color: var(--color-primary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: color var(--transition-fast);
}

.review-form__add-room-toggle:hover {
  color: var(--color-primary-dark);
}

.review-form__room-mini {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.review-form__room-submit {
  padding: 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.review-form__room-submit:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.review-form__room-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* expand 애니메이션 */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.28s ease, opacity 0.22s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 400px;
  opacity: 1;
}

/* 사진 재시도 */
.review-form__photo-actions {
  display: flex;
  gap: 8px;
}

.review-form__retry-btn {
  flex: 1;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  min-height: 48px;
}

.review-form__retry-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.review-form__skip-btn {
  padding: 12px 16px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  min-height: 48px;
}

.review-form__skip-btn:hover:not(:disabled) {
  border-color: var(--color-text-sub);
  color: var(--color-text-sub);
}

.review-form__retry-btn:disabled,
.review-form__skip-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 임시 저장 복원 다이얼로그 */
.draft-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.draft-dialog {
  background: var(--color-surface);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  padding: 24px 20px 20px;
  width: 100%;
  max-width: 640px;
}

.draft-dialog__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 6px;
}

.draft-dialog__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.draft-dialog__actions {
  display: flex;
  gap: 8px;
}

.draft-dialog__btn {
  flex: 1;
  padding: 13px;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  min-height: 48px;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.draft-dialog__btn--secondary {
  background: var(--color-bg);
  color: var(--color-text-sub);
  border: 1.5px solid var(--color-border);
}

.draft-dialog__btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.draft-dialog__btn:hover {
  opacity: 0.85;
}
</style>
