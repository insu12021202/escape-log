<script setup lang="ts">
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import StarRating from '@/shared/ui/StarRating.vue'

defineProps<{
  review: Review
  room: Room
}>()

const SUB_METRIC_LABELS: Record<string, string> = {
  puzzleQuality: '퍼즐 퀄리티',
  storyDirection: '스토리/연출',
  setQuality: '장치/세트 퀄리티',
  horror: '공포도',
  puzzleDifficulty: '퍼즐 난이도',
  clearDifficulty: '클리어 난이도',
}

const VISIBILITY_LABEL: Record<string, string> = {
  group: '회원 공개',
  private: '나만 보기',
  link: '링크 공유',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <article class="review-detail">
    <!-- 방 정보 -->
    <div class="review-detail__room">
      <span class="review-detail__vendor">{{ room.vendorName }}</span>
      <span class="review-detail__theme">{{ room.themeName }}</span>
      <span class="review-detail__region">{{ room.region }}</span>
    </div>

    <!-- 총평 -->
    <div class="review-detail__header">
      <StarRating :model-value="review.rating" readonly />
      <span
        class="review-detail__result"
        :class="{ 'review-detail__result--fail': !review.visitMeta.isSuccess }"
      >
        {{ review.visitMeta.isSuccess ? '성공' : '실패' }}
      </span>
    </div>

    <p class="review-detail__summary">{{ review.summary }}</p>

    <!-- 보조 지표 -->
    <section class="review-detail__section">
      <h3 class="review-detail__section-title">보조 지표</h3>
      <div class="review-detail__metrics">
        <div
          v-for="(value, key) in review.subMetrics"
          :key="key"
          class="review-detail__metric-row"
        >
          <span class="review-detail__metric-label">{{ SUB_METRIC_LABELS[key] ?? key }}</span>
          <StarRating :model-value="value" readonly size="sm" />
        </div>
      </div>
    </section>

    <!-- 방문 정보 -->
    <section class="review-detail__section">
      <h3 class="review-detail__section-title">방문 정보</h3>
      <dl class="review-detail__dl">
        <div class="review-detail__dl-row">
          <dt>인원</dt>
          <dd>{{ review.visitMeta.headcount }}명</dd>
        </div>
        <div v-if="review.visitMeta.remainingMinutes !== null" class="review-detail__dl-row">
          <dt>남은 시간</dt>
          <dd>{{ review.visitMeta.remainingMinutes }}분</dd>
        </div>
        <div class="review-detail__dl-row">
          <dt>재방문 의사</dt>
          <dd>{{ review.visitMeta.wouldRevisit ? 'Yes' : 'No' }}</dd>
        </div>
      </dl>
      <div v-if="review.visitMeta.genreTags.length" class="review-detail__tags">
        <span
          v-for="tag in review.visitMeta.genreTags"
          :key="tag"
          class="review-detail__tag"
        >
          {{ tag }}
        </span>
      </div>
    </section>

    <!-- 본문 -->
    <section v-if="review.body" class="review-detail__section">
      <h3 class="review-detail__section-title">본문</h3>
      <p class="review-detail__body">{{ review.body }}</p>
    </section>

    <!-- 메타 -->
    <footer class="review-detail__footer">
      <div class="review-detail__footer-left">
        <span v-if="review.authorName" class="review-detail__author">{{ review.authorName }}</span>
        <span class="review-detail__visibility">{{ VISIBILITY_LABEL[review.visibility] }}</span>
      </div>
      <span class="review-detail__date">{{ formatDate(review.createdAt) }}</span>
    </footer>
  </article>
</template>

<style scoped>
.review-detail {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-detail__room {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.review-detail__vendor {
  font-weight: 700;
  font-size: 1.125rem;
}

.review-detail__theme {
  font-size: 1.125rem;
  color: #555;
}

.review-detail__region {
  font-size: 0.8125rem;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.review-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-detail__result {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4caf50;
}

.review-detail__result--fail {
  color: #e53935;
}

.review-detail__summary {
  font-size: 1.0625rem;
  line-height: 1.5;
  color: #333;
}

.review-detail__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-detail__section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.review-detail__metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-detail__metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-detail__metric-label {
  font-size: 0.875rem;
  color: #555;
}

.review-detail__dl {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-detail__dl-row {
  display: flex;
  justify-content: space-between;
}

.review-detail__dl-row dt {
  font-size: 0.875rem;
  color: #666;
}

.review-detail__dl-row dd {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.review-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.review-detail__tag {
  font-size: 0.75rem;
  padding: 2px 10px;
  background: #f0f0f0;
  border-radius: 4px;
  color: #555;
}

.review-detail__body {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #444;
  white-space: pre-wrap;
}

.review-detail__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.review-detail__footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-detail__author {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #444;
}

.review-detail__visibility {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #e8f0fe;
  border-radius: 4px;
  color: #4a90d9;
}

.review-detail__date {
  font-size: 0.8125rem;
  color: #999;
}
</style>
