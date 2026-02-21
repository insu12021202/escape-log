<script setup lang="ts">
// SharedReviewPage — /share/:token  Spec: §6
import { ref, onMounted } from 'vue'
import { getSharedReview } from '@/entities/review/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'

const props = defineProps<{ token: string }>()

const review = ref<Review | null>(null)
const room = ref<Room | null>(null)
const loading = ref(true)
const fetchError = ref(false)

onMounted(async () => {
  try {
    const result = await getSharedReview(props.token)
    if (result) {
      review.value = result.review
      room.value = result.room
    }
  } catch (e) {
    fetchError.value = true
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="shared-review">
    <div v-if="loading" class="shared-review__status">불러오는 중...</div>
    <p v-else-if="fetchError" class="shared-review__status shared-review__status--error">
      리뷰를 불러오는 데 실패했습니다.
    </p>
    <template v-else-if="review && room">
      <p class="shared-review__badge">공유된 리뷰</p>
      <ReviewDetail :review="review" :room="room" />
    </template>
    <div v-else class="shared-review__error">
      <p class="shared-review__error-title">유효하지 않은 링크입니다.</p>
      <p class="shared-review__error-desc">링크가 만료되었거나 존재하지 않는 리뷰입니다.</p>
    </div>
  </div>
</template>

<style scoped>
.shared-review {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shared-review__status {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.shared-review__status--error {
  color: #e53935;
}

.shared-review__badge {
  font-size: 0.8125rem;
  color: #4a90d9;
  background: #e8f0fe;
  padding: 4px 12px;
  border-radius: 4px;
  align-self: flex-start;
}

.shared-review__error {
  padding: 48px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shared-review__error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #e53935;
}

.shared-review__error-desc {
  font-size: 0.875rem;
  color: #999;
}
</style>
