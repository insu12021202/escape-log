<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchReviewById } from '@/entities/review/api'
import type { Review } from '@/entities/review/types'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import ReviewCreateForm from '@/features/review-create/ui/ReviewCreateForm.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'

const route = useRoute()
const review = ref<Review | null>(null)
const loading = ref(true)
const fetchError = ref(false)

onMounted(async () => {
  try {
    const id = route.params.id as string
    review.value = await fetchReviewById(id)
  } catch (e) {
    fetchError.value = true
    console.error(e)
  } finally {
    loading.value = false
  }
})

const initialData = computed(() => {
  if (!review.value) return undefined
  const r = review.value
  return {
    roomId: r.roomId,
    visitedAt: r.visitedAt,
    rating: r.rating,
    summary: r.summary,
    subMetrics: r.subMetrics,
    isSuccess: r.visitMeta.isSuccess,
    remainingMinutes: r.visitMeta.remainingMinutes,
    headcount: r.visitMeta.headcount,
    genreTags: r.visitMeta.genreTags,
    customGenre: r.visitMeta.customGenre,
    wouldRevisit: r.visitMeta.wouldRevisit,
    body: r.body,
    hasSpoiler: r.hasSpoiler,
    visibility: r.visibility,
    photos: r.photos,
  }
})
</script>

<template>
  <div class="review-edit-page">
    <RouterLink :to="`/review/${$route.params.id}`" class="review-edit-page__back">
      <ArrowLeftIcon class="review-edit-page__back-icon" /> 돌아가기
    </RouterLink>
    <h2 class="review-edit-page__title">리뷰 수정</h2>
    <AppSpinner v-if="loading" />
    <p v-else-if="fetchError" class="review-edit-page__status review-edit-page__status--error">
      리뷰를 불러오는 데 실패했습니다.
    </p>
    <ReviewCreateForm
      v-else-if="review && initialData"
      mode="edit"
      :review-id="review.id"
      :initial-data="initialData"
    />
    <p v-else class="review-edit-page__status">리뷰를 찾을 수 없습니다.</p>
  </div>
</template>

<style scoped>
.review-edit-page__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #4a90d9;
  text-decoration: none;
}

.review-edit-page__back:hover {
  text-decoration: underline;
}

.review-edit-page__back-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.review-edit-page__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #222;
}

.review-edit-page__status {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.review-edit-page__status--error {
  color: #e53935;
}
</style>
