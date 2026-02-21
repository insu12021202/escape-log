<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Review, SubMetrics, Visibility } from '@/entities/review/types'
import { fetchGenreTags, createReview, updateReview } from '@/entities/review/api'
import { searchRooms } from '@/entities/room/api'
import type { Room } from '@/entities/room/types'
import StarRating from '@/shared/ui/StarRating.vue'
import SubMetricsSection from './SubMetricsSection.vue'
import GenreTagSelector from './GenreTagSelector.vue'

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
    }>
  }>(),
  { mode: 'create' },
)

const router = useRouter()

const rooms = ref<Room[]>([])
const genreTagOptions = ref<Array<{ id: string; name: string }>>([])
const submitting = ref(false)
const submitError = ref<string | null>(null)

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
  isSuccess: props.initialData?.isSuccess ?? true,
  remainingMinutes: (props.initialData?.remainingMinutes ?? null) as number | null,
  headcount: props.initialData?.headcount ?? 2,
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

async function handleSubmit() {
  submitting.value = true
  submitError.value = null

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
        isSuccess: form.isSuccess,
        remainingMinutes: form.remainingMinutes,
        headcount: form.headcount,
        wouldRevisit: form.wouldRevisit,
      },
      genreTagIds,
      customGenre: form.customGenre,
      body: form.body,
      visibility: form.visibility,
    }

    if (props.mode === 'edit' && props.reviewId) {
      await updateReview(props.reviewId, payload)
      router.push(`/review/${props.reviewId}`)
    } else {
      if (!form.roomId) {
        submitError.value = '방을 선택해주세요.'
        return
      }
      const defaultGroupId = import.meta.env.VITE_DEFAULT_GROUP_ID as string
      await createReview({ roomId: form.roomId, groupId: defaultGroupId, ...payload })
      router.push('/')
    }
  } catch (e) {
    console.error(e)
    submitError.value = '리뷰 저장 중 오류가 발생했습니다.'
  } finally {
    submitting.value = false
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
        <select id="room-select" v-model="form.roomId" class="review-form__select" required>
          <option value="" disabled>테마를 선택하세요</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.vendorName }} · {{ room.themeName }} ({{ room.region }})
          </option>
        </select>
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
        required
      />
      <span class="review-form__counter">{{ form.summary.length }}/100</span>
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
          required
        />
      </div>

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

    <!-- 사진 — Phase 3(Supabase Storage)에서 구현 예정 -->
    <div class="review-form__field">
      <label class="review-form__label">사진 (1~3장)</label>
      <p class="review-form__placeholder">사진 업로드는 추후 지원 예정입니다.</p>
    </div>

    <!-- 공개 범위 -->
    <div class="review-form__field">
      <label class="review-form__label" for="visibility-select">공개 범위</label>
      <select id="visibility-select" v-model="form.visibility" class="review-form__select">
        <option value="group">회원 공개</option>
        <option value="private">나만 보기</option>
      </select>
    </div>

    <p v-if="submitError" class="review-form__error">{{ submitError }}</p>

    <button type="submit" class="review-form__submit" :disabled="submitting">
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

.review-form__input,
.review-form__select,
.review-form__textarea {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
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

.review-form__error {
  font-size: 0.875rem;
  color: #e53935;
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
</style>
