<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Review, SubMetrics, Visibility } from '@/entities/review/types'
import { fetchGenreTags, createReview, updateReview, attachReviewPhoto, detachReviewPhoto } from '@/entities/review/api'
import { uploadPhoto } from '@/shared/api/storage'
import { searchRooms, createRoom, fetchRoomsByVendor, updateRoomPosterPath } from '@/entities/room/api'
import type { Room } from '@/entities/room/types'
import { fetchVendors, findOrCreateVendor } from '@/entities/vendor/api'
import type { Vendor } from '@/entities/vendor/types'
import StarRating from '@/shared/ui/StarRating.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import PosterPicker from '@/shared/ui/PosterPicker.vue'
import AppChip from '@/shared/ui/AppChip.vue'
import AppStepper from '@/shared/ui/AppStepper.vue'
import BigToggle from '@/shared/ui/BigToggle.vue'
import SubMetricsSection from './SubMetricsSection.vue'
import GenreTagSelector from './GenreTagSelector.vue'
import PhotoUploader from './PhotoUploader.vue'
import { uploadRoomPoster } from '@/shared/api/storage'
import { useToastStore } from '@/shared/model/toast'
import { REVIEW_DRAFT_KEY } from '@/shared/lib/storage-keys'

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
const showRestoreDialog = ref(false)

function saveDraft() {
  if (props.mode !== 'create') return
  localStorage.setItem(REVIEW_DRAFT_KEY, JSON.stringify({ form, currentStep: currentStep.value }))
}

function clearDraft() {
  localStorage.removeItem(REVIEW_DRAFT_KEY)
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(REVIEW_DRAFT_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as { form: typeof form; currentStep: number }
    Object.assign(form, saved.form)
    currentStep.value = saved.currentStep ?? 1
  } catch {
    clearDraft()
  }
}
// ────────────────────────────────────────────────────

const vendors = ref<Vendor[]>([])
const selectedVendorId = ref('')
const isNewVendor = ref(false)
const newVendorName = ref('')
const newVendorRegion = ref('')
const vendorRooms = ref<Room[]>([])
const rooms = ref<Room[]>([]) // edit 모드에서 현재 방 표시용
const genreTagOptions = ref<Array<{ id: string; name: string }>>([])
const submitting = ref(false)

// 인라인 테마 추가
const showRoomForm = ref(false)
const roomForm = reactive({ themeName: '' })
const roomFormError = ref('')
const roomFormSubmitting = ref(false)
const roomPosterFile = ref<File | null>(null)

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
  headcount: props.initialData?.headcount ?? 1,
  genreTags: props.initialData?.genreTags ?? ([] as string[]),
  customGenre: (props.initialData?.customGenre ?? null) as string | null,
  wouldRevisit: props.initialData?.wouldRevisit ?? true,
  body: props.initialData?.body ?? '',
  hasSpoiler: props.initialData?.hasSpoiler ?? false,
  visibility: (props.initialData?.visibility ?? 'group') as Visibility,
})

const vendorOptions = computed(() => [
  { value: '', label: '지점을 선택하세요' },
  ...vendors.value.map((v) => ({ value: v.id, label: `${v.name} (${v.region})` })),
])

const roomOptions = computed(() => [
  { value: '', label: '테마를 선택하세요' },
  ...vendorRooms.value.map((r) => ({ value: r.id, label: r.themeName })),
])

const wizardTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return '어느 방을 다녀오셨어요?'
    case 2: return '방은 어땠어요?'
    case 3: return '탈출은 성공하셨어요?'
    case 4: return '조금 더 적어볼까요?'
    default: return ''
  }
})

const sectionShortTitles: Record<number, string> = {
  1: '다녀온 방',
  2: '방 평가',
  3: '방문 정보',
  4: '추가 기록',
}

const successToggleValue = computed(() =>
  form.isSuccess === null ? '' : form.isSuccess ? 'success' : 'fail',
)

function onSuccessToggle(v: string) {
  form.isSuccess = v === 'success' ? true : v === 'fail' ? false : null
}

onMounted(async () => {
  const [vendorList, tagList] = await Promise.all([fetchVendors(), fetchGenreTags()])
  vendors.value = vendorList
  genreTagOptions.value = tagList

  // edit 모드: 현재 방 정보 로드하여 표시
  if (props.mode === 'edit' && props.initialData?.roomId) {
    const roomList = await searchRooms('')
    rooms.value = roomList
    const currentRoom = roomList.find((r) => r.id === props.initialData!.roomId)
    if (currentRoom) {
      selectedVendorId.value = currentRoom.vendorId
    }
  }

  if (props.mode === 'create' && localStorage.getItem(REVIEW_DRAFT_KEY)) {
    showRestoreDialog.value = true
  }
})

// 지점 선택 시 해당 지점의 테마 목록 로드
watch(selectedVendorId, async (vendorId) => {
  if (props.mode === 'edit') return
  form.roomId = ''
  if (!vendorId) {
    vendorRooms.value = []
    return
  }
  vendorRooms.value = await fetchRoomsByVendor(vendorId)
})

watch([() => ({ ...form }), currentStep], saveDraft, { deep: true })

async function handleCreateRoom() {
  roomFormError.value = ''

  // 새 지점 모드: 지점 생성 후 테마 추가
  if (isNewVendor.value) {
    if (!newVendorName.value.trim()) { roomFormError.value = '지점명을 입력해주세요.'; return }
    if (!newVendorRegion.value.trim()) { roomFormError.value = '지역을 입력해주세요.'; return }
  } else {
    if (!selectedVendorId.value) { roomFormError.value = '지점을 선택해주세요.'; return }
  }
  if (!roomForm.themeName.trim()) { roomFormError.value = '테마명을 입력해주세요.'; return }

  roomFormSubmitting.value = true
  try {
    let vendorId = selectedVendorId.value

    if (isNewVendor.value) {
      const vendor = await findOrCreateVendor(newVendorName.value.trim(), newVendorRegion.value.trim())
      vendorId = vendor.id
      if (!vendors.value.find((v) => v.id === vendor.id)) {
        vendors.value.push(vendor)
      }
      selectedVendorId.value = vendor.id
      isNewVendor.value = false
      newVendorName.value = ''
      newVendorRegion.value = ''
    }

    const newRoom = await createRoom({
      vendorId,
      themeName: roomForm.themeName.trim(),
    })

    if (roomPosterFile.value) {
      try {
        const posterPath = await uploadRoomPoster(newRoom.id, roomPosterFile.value)
        await updateRoomPosterPath(newRoom.id, posterPath)
        newRoom.posterPath = posterPath
      } catch (err) {
        console.error('포스터 업로드 실패:', err)
        toast.error('포스터 업로드에 실패했습니다.')
      }
    }

    vendorRooms.value.push(newRoom)
    form.roomId = newRoom.id
    showRoomForm.value = false
    roomForm.themeName = ''
    roomPosterFile.value = null
  } catch (e) {
    console.error(e)
    roomFormError.value = '등록에 실패했습니다. 다시 시도해주세요.'
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

/** 기존 사진 삭제 (Storage + DB 즉시 반영) */
async function handleRemoveExistingPhoto(path: string) {
  if (!props.reviewId) return
  try {
    await detachReviewPhoto(props.reviewId, path)
    existingPhotos.value = existingPhotos.value.filter((p) => p !== path)
    toast.success('사진이 삭제되었습니다.')
  } catch (e) {
    console.error(e)
    toast.error('사진 삭제에 실패했습니다.')
  }
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

    <!-- 위자드 다크 헤더 카드: create 모드만 -->
    <div v-if="mode === 'create'" class="wizard-head dot-bg-dark">
      <div class="wizard-head__top">
        <span class="wizard-head__step label">STEP {{ String(currentStep).padStart(2, '0') }}</span>
        <div class="wizard-head__top-right">
          <span class="wizard-head__serial label">LOG · NEW</span>
          <span class="wizard-head__count mono">{{ String(currentStep).padStart(2, '0') }} / 04</span>
        </div>
      </div>
      <h2 class="wizard-head__title">{{ wizardTitle }}</h2>
      <div class="wizard-head__dots">
        <span
          v-for="i in TOTAL_STEPS"
          :key="i"
          class="wizard-head__dot"
          :class="{ 'wizard-head__dot--filled': i <= currentStep }"
        />
      </div>
      <div v-if="currentStep > 1" class="wizard-head__nav">
        <button type="button" class="wizard-head__back" @click="goPrev">← 이전</button>
      </div>
    </div>

    <!-- 섹션 1: 어디서 -->
    <section v-if="mode === 'edit' || currentStep === 1" class="review-form__section">
      <header class="section-head">
        <span class="label">{{ mode === 'edit' ? 'SECTION' : 'STEP' }} 01</span>
        <h3 class="section-head__title">{{ sectionShortTitles[1] }}</h3>
      </header>

      <div class="review-form__field">
        <label class="review-form__label">지점 선택 *</label>
        <template v-if="mode === 'edit'">
          <p class="review-form__room-fixed">
            {{ rooms.find((r) => r.id === form.roomId)?.vendorName }} ·
            {{ rooms.find((r) => r.id === form.roomId)?.themeName }}
          </p>
        </template>
        <template v-else-if="!isNewVendor">
          <BaseSelect v-model="selectedVendorId" :options="vendorOptions" variant="input" />
          <button type="button" class="review-form__add-room-toggle" @click="isNewVendor = true; showRoomForm = true">
            + 지점이 없나요? 직접 등록
          </button>
        </template>
        <template v-else>
          <div class="review-form__row">
            <div class="review-form__field review-form__field--inline review-form__field--grow">
              <input v-model="newVendorName" class="review-form__input" type="text" placeholder="지점명 (예: 키이스케이프)" />
            </div>
            <div class="review-form__field review-form__field--inline">
              <input v-model="newVendorRegion" class="review-form__input" type="text" placeholder="지역 (예: 홍대)" />
            </div>
          </div>
          <button type="button" class="review-form__add-room-toggle" @click="isNewVendor = false; newVendorName = ''; newVendorRegion = ''; showRoomForm = false">
            기존 지점에서 선택
          </button>
        </template>
      </div>

      <div v-if="mode !== 'edit'" class="review-form__field">
        <label class="review-form__label">테마 선택 *</label>
        <BaseSelect v-if="!isNewVendor" v-model="form.roomId" :options="roomOptions" variant="input" :disabled="!selectedVendorId" />
        <p v-if="errors.room" class="review-form__field-error" role="alert">{{ errors.room }}</p>

          <!-- 인라인 테마 추가 -->
          <button v-if="!showRoomForm && (selectedVendorId || isNewVendor)" type="button" class="review-form__add-room-toggle" @click="showRoomForm = true">
            + 테마가 없나요? 직접 추가
          </button>
          <button v-if="showRoomForm && !isNewVendor" type="button" class="review-form__add-room-toggle" @click="showRoomForm = false">
            − 취소
          </button>

          <Transition name="expand">
            <div v-if="showRoomForm" class="review-form__room-mini">
              <div class="review-form__field">
                <label class="review-form__label">테마명 *</label>
                <input v-model="roomForm.themeName" class="review-form__input" type="text" placeholder="예: 탈옥" />
              </div>
              <div class="review-form__field">
                <label class="review-form__label">포스터 (선택)</label>
                <PosterPicker v-model="roomPosterFile" :disabled="roomFormSubmitting" />
              </div>
              <p v-if="roomFormError" class="review-form__field-error" role="alert">{{ roomFormError }}</p>
              <button type="button" class="review-form__room-submit" :disabled="roomFormSubmitting" @click="handleCreateRoom">
                {{ roomFormSubmitting ? '등록 중...' : isNewVendor ? '지점 + 테마 등록' : '테마 추가' }}
              </button>
            </div>
          </Transition>
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

    <!-- 섹션 2: 어땠나 -->
    <section v-if="mode === 'edit' || currentStep === 2" class="review-form__section">
      <header class="section-head">
        <span class="label">{{ mode === 'edit' ? 'SECTION' : 'STEP' }} 02</span>
        <h3 class="section-head__title">{{ sectionShortTitles[2] }}</h3>
      </header>

      <div class="review-form__field">
        <label class="review-form__label">총평 별점 *</label>
        <StarRating v-model="form.rating" />
        <p v-if="errors.rating" class="review-form__field-error" role="alert">{{ errors.rating }}</p>
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
          :aria-invalid="!!errors.summary"
          :aria-describedby="errors.summary ? 'summary-error' : undefined"
        />
        <span class="review-form__counter mono tnum">{{ form.summary.length }}/100</span>
        <p
          v-if="errors.summary"
          id="summary-error"
          class="review-form__field-error"
          role="alert"
        >{{ errors.summary }}</p>
      </div>

      <!-- 보조 지표 Spec: §3.2 -->
      <SubMetricsSection v-model="form.subMetrics" />
    </section>

    <!-- 섹션 3: 어떻게 -->
    <section v-if="mode === 'edit' || currentStep === 3" class="review-form__section">
      <header class="section-head">
        <span class="label">{{ mode === 'edit' ? 'SECTION' : 'STEP' }} 03</span>
        <h3 class="section-head__title">{{ sectionShortTitles[3] }}</h3>
      </header>

      <div class="review-form__field">
        <label class="review-form__label">결과 *</label>
        <BigToggle
          :model-value="successToggleValue"
          :options="[
            { value: 'success', label: 'CLEAR', icon: 'check', accent: 'var(--color-success)' },
            { value: 'fail',    label: 'FAIL',  icon: 'cross', accent: 'var(--color-error)' },
          ]"
          @update:model-value="onSuccessToggle"
        />
        <p v-if="errors.isSuccess" class="review-form__field-error" role="alert">{{ errors.isSuccess }}</p>
      </div>

      <div class="review-form__row">
        <div class="review-form__field review-form__field--stepper">
          <label class="review-form__label">인원 수 *</label>
          <AppStepper v-model="form.headcount" :min="1" :max="10" unit="명" />
          <p v-if="errors.headcount" class="review-form__field-error" role="alert">{{ errors.headcount }}</p>
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
        <div class="review-form__chip-row">
          <AppChip :active="form.wouldRevisit === true" @click="form.wouldRevisit = true">다시 가요</AppChip>
          <AppChip :active="form.wouldRevisit === false" @click="form.wouldRevisit = false">충분해요</AppChip>
        </div>
      </div>
    </section>

    <!-- 섹션 4: 더 남길 것 -->
    <section v-if="mode === 'edit' || currentStep === 4" class="review-form__section">
      <header class="section-head">
        <span class="label">{{ mode === 'edit' ? 'SECTION' : 'STEP' }} 04</span>
        <h3 class="section-head__title">{{ sectionShortTitles[4] }}</h3>
      </header>

      <div class="review-form__field">
        <label class="review-form__label" for="body-input">본문</label>
        <textarea
          id="body-input"
          v-model="form.body"
          class="review-form__textarea"
          maxlength="3000"
          rows="5"
          placeholder="자유롭게 작성 (3000자 이내)"
          :aria-invalid="!!errors.general"
          :aria-describedby="errors.general ? 'body-error' : undefined"
        />
        <span class="review-form__counter mono tnum">{{ form.body.length }}/3000</span>
      </div>

      <div
        class="review-form__spoiler-card"
        :class="{ 'review-form__spoiler-card--active': form.hasSpoiler }"
      >
        <label class="review-form__spoiler-label">
          <input type="checkbox" v-model="form.hasSpoiler" class="review-form__checkbox" />
          <span>스포일러 포함</span>
        </label>
        <p class="review-form__spoiler-hint">체크하면 다른 사용자에게 한줄평과 본문이 블러 처리됩니다.</p>
      </div>

      <div class="review-form__field">
        <label class="review-form__label">사진 (최대 3장)</label>
        <PhotoUploader
          v-model="selectedPhotos"
          :existing-paths="existingPhotos"
          :disabled="!!pendingReviewId"
          @remove-existing="handleRemoveExistingPhoto"
        />
      </div>

      <div class="review-form__field">
        <label class="review-form__label">공개 범위</label>
        <div class="review-form__chip-row">
          <AppChip :active="form.visibility === 'group'" @click="form.visibility = 'group'">회원 공개</AppChip>
          <AppChip :active="form.visibility === 'private'" @click="form.visibility = 'private'">나만 보기</AppChip>
        </div>
      </div>
    </section>

    <p
      v-if="(mode === 'edit' || currentStep === 4) && errors.general"
      id="body-error"
      class="review-form__field-error"
      role="alert"
    >{{ errors.general }}</p>

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
      <!-- create 모드: 마지막 스텝 전까지 "다음 →", 마지막은 "리뷰 저장" -->
      <button
        v-if="mode === 'create' && currentStep < TOTAL_STEPS"
        type="button"
        class="review-form__submit"
        @click="goNext"
      >
        다음<span class="review-form__submit-arrow">→</span>
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
  gap: 14px;
  padding-bottom: 80px;
}

/* ── 위자드 다크 헤더 카드 ── */
.wizard-head {
  padding: 18px 20px 16px;
  margin-bottom: 0;
  background-color: var(--ink-1000);
  color: var(--paper);
  border-radius: 12px;
}

.wizard-head__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wizard-head__top-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.wizard-head__serial {
  color: rgba(244, 237, 224, 0.35);
  font-size: 9.5px;
  letter-spacing: 0.08em;
}

.wizard-head__step {
  color: rgba(244, 237, 224, 0.55);
  letter-spacing: 0.08em;
}

.wizard-head__count {
  font-size: 11.5px;
  color: rgba(244, 237, 224, 0.7);
  letter-spacing: 0.04em;
}

.wizard-head__title {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--paper);
  letter-spacing: -0.005em;
}

.wizard-head__dots {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.wizard-head__dot {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(244, 237, 224, 0.18);
  transition: background var(--transition-base);
}

.wizard-head__dot--filled {
  background: var(--brand-500);
}

.wizard-head__nav {
  margin-top: 12px;
}

.wizard-head__back {
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 12px;
  color: rgba(244, 237, 224, 0.7);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.wizard-head__back:hover {
  color: var(--paper);
}

/* ── 섹션 헤더 ── */
.section-head {
  margin-bottom: 14px;
}

.section-head :deep(.label) {
  color: var(--ink-500);
}

.section-head__title {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-1000);
}

/* ── 섹션 카드 ── */
.review-form__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── 필드 ── */
.review-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-form__field--inline {
  flex: 1;
  min-width: 0;
}

.review-form__field--grow {
  flex: 2;
}

.review-form__field--stepper {
  flex: 0 0 180px;
  max-width: 180px;
}

.review-form__row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.review-form__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
}

/* ── 입력 ── */
.review-form__input,
.review-form__select,
.review-form__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 15px;
  color: var(--ink-1000);
  background: var(--color-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  min-height: 44px;
  max-width: 100%;
}

.review-form__input--short {
  max-width: 120px;
  height: 44px;
  min-height: 0;
  padding-top: 8px;
  padding-bottom: 8px;
  line-height: 1.2;
}

.review-form__input:focus,
.review-form__select:focus,
.review-form__textarea:focus {
  outline: none;
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-50);
}

.review-form__textarea {
  resize: vertical;
  min-height: 120px;
}

.review-form__counter {
  font-size: 11px;
  color: var(--ink-400);
  text-align: right;
}

/* ── 칩 row ── */
.review-form__chip-row {
  display: flex;
  gap: 8px;
}

/* ── 스포일러 카드 ── */
.review-form__spoiler-card {
  position: relative;
  padding: 12px 14px;
  background: var(--ink-100);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.review-form__spoiler-card--active::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: var(--ink-1000);
}

.review-form__spoiler-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-1000);
  cursor: pointer;
}

.review-form__checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--ink-1000);
}

.review-form__spoiler-hint {
  padding-top: 6px;
  font-size: 12px;
  color: var(--ink-500);
}

/* ── 에러 ── */
.review-form__field-error {
  font-size: 12.5px;
  color: var(--color-error);
}

/* ── 고정 방 표시 ── */
.review-form__room-fixed {
  font-size: 15px;
  color: var(--ink-700);
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--ink-50);
  min-height: 44px;
  display: flex;
  align-items: center;
}

/* ── 인라인 방 등록 ── */
.review-form__add-room-toggle {
  font-size: 13px;
  color: var(--brand-500);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: color var(--transition-fast);
}

.review-form__add-room-toggle:hover {
  color: var(--brand-600);
}

.review-form__room-mini {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--ink-50);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.review-form__room-submit {
  padding: 10px;
  background: var(--ink-1000);
  color: var(--paper);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast);
}

.review-form__room-submit:hover:not(:disabled) {
  background: var(--ink-900);
}

.review-form__room-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── 제출 푸터 ── */
.review-form__footer {
  position: sticky;
  bottom: 0;
  background: var(--color-bg);
  margin: 0 -16px;
  padding: 12px 16px;
}

.review-form__submit {
  width: 100%;
  padding: 14px;
  background: var(--ink-1000);
  color: var(--paper);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background var(--transition-fast);
  min-height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.review-form__submit:hover:not(:disabled) {
  background: var(--ink-900);
}

.review-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-form__submit-arrow {
  margin-left: 10px;
}

/* ── expand 애니메이션 ── */
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

/* ── 사진 재시도 ── */
.review-form__photo-actions {
  display: flex;
  gap: 8px;
}

.review-form__retry-btn {
  flex: 1;
  padding: 12px;
  background: var(--brand-500);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  min-height: 48px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.review-form__retry-btn:hover:not(:disabled) {
  background: var(--brand-600);
}

.review-form__skip-btn {
  padding: 12px 16px;
  background: transparent;
  color: var(--ink-700);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  min-height: 48px;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.review-form__skip-btn:hover:not(:disabled) {
  background: var(--ink-100);
}

.review-form__retry-btn:disabled,
.review-form__skip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── 임시 저장 복원 다이얼로그 ── */
.draft-overlay {
  position: fixed;
  inset: 0;
  background: rgba(11, 14, 20, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.draft-dialog {
  background: var(--color-surface);
  border-radius: 14px 14px 0 0;
  padding: 22px;
  width: 100%;
  max-width: 640px;
  box-shadow: var(--shadow-modal);
}

.draft-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-1000);
  margin-bottom: 6px;
}

.draft-dialog__desc {
  font-size: 13px;
  color: var(--ink-500);
  margin-bottom: 20px;
}

.draft-dialog__actions {
  display: flex;
  gap: 8px;
}

.draft-dialog__btn {
  flex: 1;
  padding: 13px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  min-height: 48px;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.draft-dialog__btn--secondary {
  background: transparent;
  color: var(--ink-700);
  border: 1px solid var(--color-border);
}

.draft-dialog__btn--secondary:hover {
  background: var(--ink-100);
}

.draft-dialog__btn--primary {
  background: var(--ink-1000);
  color: var(--paper);
  border: none;
}

.draft-dialog__btn--primary:hover {
  background: var(--ink-900);
}
</style>
