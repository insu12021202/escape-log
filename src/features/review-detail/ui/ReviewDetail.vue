<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import StarRating from '@/shared/ui/StarRating.vue'
import { getPhotoPublicUrl } from '@/shared/api/storage'

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

// 라이트박스
const lightboxIndex = ref<number | null>(null)
let lightboxPhotos: string[] = []

const lightboxUrl = computed(() =>
  lightboxIndex.value !== null ? getPhotoPublicUrl(lightboxPhotos[lightboxIndex.value]!) : null,
)

function openLightbox(photos: string[], index: number) {
  lightboxPhotos = photos
  lightboxIndex.value = index
  document.addEventListener('keydown', onKeydown)
}

function closeLightbox() {
  lightboxIndex.value = null
  document.removeEventListener('keydown', onKeydown)
}

function prev() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value - 1 + lightboxPhotos.length) % lightboxPhotos.length
}

function next() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxPhotos.length
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
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

    <!-- 사진 Spec: §3.4 -->
    <section v-if="review.photos.length" class="review-detail__section">
      <h3 class="review-detail__section-title">사진</h3>
      <div class="review-detail__photos">
        <img
          v-for="(path, i) in review.photos"
          :key="i"
          :src="getPhotoPublicUrl(path)"
          :alt="`사진 ${i + 1}`"
          class="review-detail__photo"
          @click="openLightbox(review.photos, i)"
        />
      </div>
    </section>

    <!-- 라이트박스 -->
    <Teleport to="body">
      <div
        v-if="lightboxUrl"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        @click="closeLightbox"
      >
        <img
          :src="lightboxUrl"
          class="lightbox__img"
          alt="사진 크게 보기"
          @click.stop
        />
        <button class="lightbox__close" aria-label="닫기" @click="closeLightbox">✕</button>
        <template v-if="lightboxPhotos.length > 1">
          <button class="lightbox__nav lightbox__nav--prev" aria-label="이전 사진" @click.stop="prev">‹</button>
          <button class="lightbox__nav lightbox__nav--next" aria-label="다음 사진" @click.stop="next">›</button>
          <span class="lightbox__counter">{{ (lightboxIndex ?? 0) + 1 }} / {{ lightboxPhotos.length }}</span>
        </template>
      </div>
    </Teleport>

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

.review-detail__photos {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.review-detail__photo {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: opacity 0.15s;
}

.review-detail__photo:hover {
  opacity: 0.85;
}

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lightbox__img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
}

.lightbox__close {
  position: fixed;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
}

.lightbox__close:hover {
  opacity: 0.7;
}

.lightbox__nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 2.5rem;
  line-height: 1;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.lightbox__nav:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox__nav--prev {
  left: 12px;
}

.lightbox__nav--next {
  right: 12px;
}

.lightbox__counter {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
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
