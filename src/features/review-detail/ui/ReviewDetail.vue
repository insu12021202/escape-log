<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import StarRating from '@/shared/ui/StarRating.vue'
import AppBadge from '@/shared/ui/AppBadge.vue'
import { getPhotoPublicUrl } from '@/shared/api/storage'
import { makeSerial } from '@/shared/lib/serial'
import { formatFullDate, formatVisitedDate } from '@/shared/lib/date'
import { useFocusTrap } from '@/shared/lib/useFocusTrap'
import { hasRevealedSpoiler, markSpoilerRevealed } from '@/shared/lib/spoiler'

const props = defineProps<{
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
  link: '링크 공개',
}

// 스포일러 — 이전에 펼친 적 있는 리뷰는 자동 노출
const spoilerRevealed = ref(hasRevealedSpoiler(props.review.id))

function revealSpoiler() {
  spoilerRevealed.value = true
  markSpoilerRevealed(props.review.id)
}

const serial = computed(() => makeSerial(props.review.id))
const spoilerLocked = computed(
  () => props.review.hasSpoiler && !spoilerRevealed.value,
)
const photoCount = computed(() => props.review.photos.length)

// 라이트박스
const lightboxPhotos = ref<string[]>([])
const lightboxIndex = ref<number | null>(null)
const lightboxRef = ref<HTMLElement | null>(null)
const lightboxOpen = computed(() => lightboxIndex.value !== null)

useFocusTrap(lightboxRef, lightboxOpen)

const lightboxUrl = computed(() =>
  lightboxIndex.value !== null
    ? getPhotoPublicUrl(lightboxPhotos.value[lightboxIndex.value]!)
    : null,
)

function openLightbox(photos: string[], index: number) {
  lightboxPhotos.value = photos
  lightboxIndex.value = index
  document.addEventListener('keydown', onKeydown)
}

function closeLightbox() {
  lightboxIndex.value = null
  document.removeEventListener('keydown', onKeydown)
}

function prev() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value =
    (lightboxIndex.value - 1 + lightboxPhotos.value.length) % lightboxPhotos.value.length
}

function next() {
  if (lightboxIndex.value === null) return
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxPhotos.value.length
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
    <!-- 다크 hero 카드 -->
    <header class="review-detail__hero dot-bg-dark">
      <div class="review-detail__hero-top">
        <span class="review-detail__hero-label">리뷰 기록</span>
        <span class="review-detail__hero-serial mono">{{ serial }}</span>
      </div>

      <p class="review-detail__hero-vendor">{{ room.vendorName }}</p>
      <h2 class="review-detail__hero-theme">{{ room.themeName }}</h2>
      <span class="review-detail__hero-region">{{ room.region }}</span>

      <div class="review-detail__hero-result">
        <div class="review-detail__hero-rating">
          <StarRating :model-value="review.rating" readonly :size="18" />
          <span class="review-detail__hero-rating-num mono tnum">
            {{ review.rating.toFixed(1) }}
          </span>
        </div>
        <AppBadge :kind="review.visitMeta.isSuccess ? 'success' : 'error'" size="md">
          {{ review.visitMeta.isSuccess ? '성공' : '실패' }}
        </AppBadge>
      </div>
    </header>

    <!-- 한줄평 카드 -->
    <div class="review-detail__summary-card">
      <div v-if="spoilerLocked" class="review-detail__scratch-veil scratch">
        <div class="review-detail__scratch-label">
          <span class="review-detail__scratch-eyebrow">스포일러</span>
          <p>가려진 내용이에요</p>
          <button type="button" @click="revealSpoiler">내용 보기</button>
        </div>
      </div>
      <p v-else class="review-detail__summary-text">{{ review.summary }}</p>
    </div>

    <!-- 보조 지표 -->
    <section class="review-detail__section">
      <span class="review-detail__section-title">세부 평가</span>
      <div class="review-detail__metrics">
        <div
          v-for="(value, key) in review.subMetrics"
          :key="key"
          class="review-detail__metric"
        >
          <div class="review-detail__metric-row">
            <span class="review-detail__metric-label">
              {{ SUB_METRIC_LABELS[key] ?? key }}
            </span>
            <span class="review-detail__metric-value mono tnum">
              {{ value.toFixed(1) }}
            </span>
          </div>
          <div class="review-detail__metric-track">
            <div
              class="review-detail__metric-fill"
              :style="{ width: (value / 5) * 100 + '%' }"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 방문 정보 -->
    <section class="review-detail__section">
      <span class="review-detail__section-title">방문 정보</span>
      <div class="review-detail__meta-grid">
        <div class="review-detail__meta-cell">
          <span class="review-detail__meta-cell-label">인원</span>
          <span class="review-detail__meta-cell-value">
            {{ review.visitMeta.headcount }}명
          </span>
        </div>
        <div
          v-if="review.visitMeta.remainingMinutes !== null"
          class="review-detail__meta-cell"
        >
          <span class="review-detail__meta-cell-label">남은 시간</span>
          <span class="review-detail__meta-cell-value">
            {{ review.visitMeta.remainingMinutes }}분
          </span>
        </div>
        <div class="review-detail__meta-cell">
          <span class="review-detail__meta-cell-label">재방문</span>
          <span class="review-detail__meta-cell-value">
            {{ review.visitMeta.wouldRevisit ? '다시 갈래요' : '안 갈래요' }}
          </span>
        </div>
        <div v-if="review.visitedAt" class="review-detail__meta-cell">
          <span class="review-detail__meta-cell-label">방문일</span>
          <span class="review-detail__meta-cell-value mono tnum">
            {{ formatVisitedDate(review.visitedAt) }}
          </span>
        </div>
      </div>

      <div v-if="review.visitMeta.genreTags.length" class="review-detail__tag-block">
        <span class="review-detail__tag-title">태그</span>
        <div class="review-detail__tags">
          <span
            v-for="tag in review.visitMeta.genreTags"
            :key="tag"
            class="review-detail__tag"
          >{{ tag }}</span>
        </div>
      </div>
    </section>

    <!-- 본문 -->
    <section v-if="review.body" class="review-detail__section">
      <span class="review-detail__section-title">후기</span>
      <div v-if="spoilerLocked" class="review-detail__scratch-veil scratch">
        <div class="review-detail__scratch-label">
          <span class="review-detail__scratch-eyebrow">스포일러</span>
          <p>가려진 내용이에요</p>
          <button type="button" @click="revealSpoiler">내용 보기</button>
        </div>
      </div>
      <p v-else class="review-detail__body">{{ review.body }}</p>
    </section>

    <!-- 사진 -->
    <section v-if="review.photos.length" class="review-detail__section">
      <span class="review-detail__section-title">
        사진 {{ photoCount }}
      </span>
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
        ref="lightboxRef"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="사진 크게 보기"
        @click="closeLightbox"
      >
        <img
          :src="lightboxUrl"
          class="lightbox__img"
          alt="사진 크게 보기"
          @click.stop
        />
        <button class="lightbox__close mono" aria-label="닫기" @click="closeLightbox">✕</button>
        <template v-if="lightboxPhotos.length > 1">
          <button class="lightbox__nav lightbox__nav--prev" aria-label="이전 사진" @click.stop="prev">‹</button>
          <button class="lightbox__nav lightbox__nav--next" aria-label="다음 사진" @click.stop="next">›</button>
          <span class="lightbox__counter mono tnum">
            {{ (lightboxIndex ?? 0) + 1 }} / {{ lightboxPhotos.length }}
          </span>
        </template>
      </div>
    </Teleport>

    <!-- 메타 푸터 -->
    <footer class="review-detail__footer">
      <div class="review-detail__footer-left">
        <RouterLink
          v-if="review.authorName"
          :to="`/author/${review.userId}`"
          class="review-detail__author"
        >
          {{ review.authorName }}
        </RouterLink>
        <AppBadge kind="soft" size="sm">
          {{ VISIBILITY_LABEL[review.visibility] ?? review.visibility }}
        </AppBadge>
      </div>
      <span class="review-detail__date mono tnum">{{ formatFullDate(review.createdAt) }}</span>
    </footer>
  </article>
</template>

<style scoped>
.review-detail {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── 다크 hero ── */
.review-detail__hero {
  position: relative;
  background-color: var(--ink-1000);
  color: var(--paper);
  border-radius: 14px;
  padding: 22px 20px 20px;
}

.review-detail__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-detail__hero-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(244, 237, 224, 0.5);
}

.review-detail__hero-serial {
  font-size: 10.5px;
  color: rgba(244, 237, 224, 0.4);
  letter-spacing: 0.08em;
}

.review-detail__hero-vendor {
  margin-top: 14px;
  font-size: 12.5px;
  color: rgba(244, 237, 224, 0.6);
  letter-spacing: 0.02em;
}

.review-detail__hero-theme {
  margin-top: 2px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--paper);
}

.review-detail__hero-region {
  display: inline-block;
  margin-top: 10px;
  padding: 3px 9px;
  background: rgba(244, 237, 224, 0.12);
  color: var(--paper);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
}

.review-detail__hero-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(244, 237, 224, 0.1);
}

.review-detail__hero-rating {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.review-detail__hero-rating-num {
  font-size: 17px;
  font-weight: 700;
  color: var(--paper);
}

/* ── 한줄평 카드 ── */
.review-detail__summary-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 20px;
}

.review-detail__summary-card::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 4px;
  background: var(--brand-500);
  border-radius: 0 2px 2px 0;
}

.review-detail__summary-text {
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink-1000);
  font-weight: 500;
}

.review-detail__summary-text::before {
  content: '“';
  font-size: 28px;
  color: var(--ink-300);
  float: left;
  margin: -4px 8px 0 -4px;
  line-height: 1;
}

/* ── 스크래치 베일 ── */
.review-detail__scratch-veil {
  min-height: 90px;
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.review-detail__scratch-label {
  text-align: center;
}

.review-detail__scratch-eyebrow {
  font-size: 11px;
  font-weight: 600;
  color: rgba(244, 237, 224, 0.6);
}

.review-detail__scratch-label p {
  margin-top: 4px;
  font-size: 13px;
  color: var(--paper);
}

.review-detail__scratch-label button {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--paper);
  color: var(--ink-1000);
  border: none;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.review-detail__scratch-label button:hover {
  opacity: 0.9;
}

/* ── 섹션 ── */
.review-detail__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.review-detail__section-title {
  margin-bottom: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-600);
}

/* ── 보조 지표 (horizontal bars) ── */
.review-detail__metrics {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.review-detail__metric-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.review-detail__metric-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-600);
}

.review-detail__metric-value {
  font-size: 12px;
  color: var(--ink-900);
}

.review-detail__metric-track {
  margin-top: 6px;
  height: 4px;
  background: var(--ink-150);
  border-radius: 2px;
  overflow: hidden;
}

.review-detail__metric-fill {
  height: 100%;
  background: var(--ink-1000);
  border-radius: 2px;
  transition: width var(--transition-base);
}

/* ── 방문 메타 그리드 ── */
.review-detail__meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.review-detail__meta-cell {
  background: var(--ink-50);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}

.review-detail__meta-cell-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-500);
}

.review-detail__meta-cell-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-1000);
}

.review-detail__tag-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-detail__tag-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-500);
}

.review-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.review-detail__tag {
  padding: 4px 11px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-700);
  font-size: 11.5px;
  white-space: nowrap;
}

/* ── 본문 ── */
.review-detail__body {
  font-size: 15px;
  line-height: 1.75;
  color: var(--ink-800);
  white-space: pre-wrap;
  padding: 0 2px;
}

/* ── 사진 ── */
.review-detail__photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.review-detail__photo {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.18s, opacity 0.18s;
}

.review-detail__photo:hover {
  opacity: 1;
  transform: scale(1.01);
}

/* ── 라이트박스 ── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 15, 0.92);
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
  color: var(--paper);
  font-size: 1.4rem;
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
  background: rgba(244, 237, 224, 0.12);
  border: none;
  color: var(--paper);
  font-size: 2.4rem;
  line-height: 1;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: background var(--transition-fast);
}

.lightbox__nav:hover {
  background: rgba(244, 237, 224, 0.22);
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
  color: rgba(244, 237, 224, 0.75);
  font-size: 12.5px;
  letter-spacing: 0.04em;
}

/* ── 푸터 ── */
.review-detail__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  background: transparent;
}

.review-detail__footer-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.review-detail__author {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.review-detail__author:hover {
  color: var(--brand-500);
  text-decoration: underline;
}

.review-detail__date {
  font-size: 12px;
  color: var(--ink-500);
  letter-spacing: 0.02em;
}
</style>
