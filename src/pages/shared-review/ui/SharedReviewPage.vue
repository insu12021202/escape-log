<script setup lang="ts">
// SharedReviewPage — /share/:token  Spec: §6
import { computed } from 'vue'
import { MOCK_REVIEWS } from '@/entities/review/lib/mock-reviews'
import { MOCK_ROOMS } from '@/entities/room/lib/mock-rooms'
import ReviewDetail from '@/features/review-detail/ui/ReviewDetail.vue'

const props = defineProps<{ token: string }>()

const review = computed(() => MOCK_REVIEWS.find(r => r.shareToken === props.token) ?? null)
const room = computed(() =>
  review.value ? (MOCK_ROOMS.find(r => r.id === review.value!.roomId) ?? null) : null,
)
</script>

<template>
  <div class="shared-review">
    <template v-if="review && room">
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
