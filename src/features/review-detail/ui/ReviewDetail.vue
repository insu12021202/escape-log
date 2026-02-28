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

// 스포일러
const spoilerRevealed = ref(false)

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

    <!-- 스포일러 경고 -->
    <div v-if="review.hasSpoiler && !spoilerRevealed" class="review-detail__spoiler-warning">
      <p class="review-detail__spoiler-text">이 리뷰에는 스포일러가 포함되어 있습니다.</p>
      <button class="review-detail__spoiler-reveal" @click="spoilerRevealed = true">내용 보기</button>
    </div>

    <p
      class="review-detail__summary"
      :class="{ 'review-detail__summary--blurred': review.hasSpoiler && !spoilerRevealed }"
    >{{ review.summary }}</p>

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
      <p
        class="review-detail__body"
        :class="{ 'review-detail__body--blurred': review.hasSpoiler && !spoilerRevealed }"
      >{{ review.body }}</p>
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
  gap: 12px;
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
  color: var(--color-text);
}

.review-detail__theme {
  font-size: 1.125rem;
  color: var(--color-text-sub);
}

.review-detail__region {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.review-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-detail__result {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 99px;
  background: var(--color-success-bg);
  color: var(--color-success);
}

.review-detail__result--fail {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.review-detail__summary {
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--color-text);
  padding: 4px 0;
}

.review-detail__summary--blurred,
.review-detail__body--blurred {
  filter: blur(8px);
  user-select: none;
}

.review-detail__spoiler-warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.review-detail__spoiler-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.review-detail__spoiler-reveal {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  flex-shrink: 0;
}

.review-detail__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-detail__section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.review-detail__metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-detail__metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-detail__metric-label {
  font-size: 0.875rem;
  color: var(--color-text-sub);
}

.review-detail__dl {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-detail__dl-row {
  display: flex;
  justify-content: space-between;
}

.review-detail__dl-row dt {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.review-detail__dl-row dd {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin: 0;
}

.review-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.review-detail__tag {
  font-size: 0.75rem;
  padding: 3px 10px;
  background: var(--color-bg);
  border-radius: 99px;
  color: var(--color-text-sub);
}

.review-detail__body {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--color-text);
  white-space: pre-wrap;
}

.review-detail__photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.review-detail__photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.review-detail__photo:hover {
  opacity: 0.82;
}

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lightbox__img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
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
  opacity: 0.85;
}

.lightbox__close:hover {
  opacity: 1;
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
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.lightbox__nav:hover {
  background: rgba(255, 255, 255, 0.28);
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
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.875rem;
}

.review-detail__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}

.review-detail__footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-detail__author {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-sub);
}

.review-detail__visibility {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
}

.review-detail__date {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>
