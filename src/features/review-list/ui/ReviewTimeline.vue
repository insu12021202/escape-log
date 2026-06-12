<script setup lang="ts">
import { computed } from 'vue'
import type { JourneyPoint, Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import TrailPath from '@/features/review-list/ui/TrailPath.vue'
import TrailMilestone from '@/features/review-list/ui/TrailMilestone.vue'
import { formatMonth } from '@/shared/lib/date'

const props = withDefaults(
  defineProps<{
    reviews: Review[]
    rooms: Record<string, Room>
    /** 전체 여정(페이지네이션 무관) — 여정 선용 경량 데이터 */
    journey: JourneyPoint[]
    /** 월 구분 헤더 표시 — 날짜순이 아닌 정렬(꽃길순 등)에서는 끈다 */
    groupByMonth?: boolean
  }>(),
  { groupByMonth: true },
)

interface TimelineItem {
  review: Review
  room: Room
  /** 진입 애니메이션 stagger용 전역 인덱스 */
  index: number
}

// 룸 정보가 있는 리뷰만 마일스톤으로. (목록 화면과 동일 규칙)
const items = computed(() =>
  props.reviews
    .map((review) => ({ review, room: props.rooms[review.roomId] }))
    .filter((it): it is { review: Review; room: Room } => !!it.room),
)

/** 월 단위 섹션 — groupByMonth가 꺼지면 단일 섹션 */
const sections = computed(() => {
  const out: Array<{ label: string | null; items: TimelineItem[] }> = []
  items.value.forEach(({ review, room }, index) => {
    const label = props.groupByMonth
      ? formatMonth(review.visitedAt ?? review.createdAt)
      : null
    const last = out[out.length - 1]
    if (last && last.label === label) last.items.push({ review, room, index })
    else out.push({ label, items: [{ review, room, index }] })
  })
  return out
})
</script>

<template>
  <div class="review-timeline">
    <TrailPath :points="journey" />

    <div class="review-timeline__body">
      <template v-for="(section, si) in sections" :key="section.label ?? si">
        <div
          v-if="section.label"
          :id="`month-${section.label}`"
          class="review-timeline__month"
        >
          <span class="review-timeline__month-label mono">{{ section.label }}</span>
          <span class="review-timeline__month-line" aria-hidden="true" />
        </div>
        <div class="review-timeline__track">
          <TrailMilestone
            v-for="{ review, room, index } in section.items"
            :key="review.id"
            :index="index"
            :review-id="review.id"
            :rating="review.rating"
            :summary="review.summary"
            :vendor-name="room.vendorName"
            :theme-name="room.themeName"
            :region="room.region"
            :is-success="review.visitMeta.isSuccess"
            :would-revisit="review.visitMeta.wouldRevisit"
            :visited-at="review.visitedAt"
            :remaining-minutes="review.visitMeta.remainingMinutes"
            :has-spoiler="review.hasSpoiler"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.review-timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 14px;
}

.review-timeline__body {
  display: flex;
  flex-direction: column;
}

/* ── 월 구분 헤더 ── */
.review-timeline__month {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0 12px;
}

.review-timeline__body > .review-timeline__month:not(:first-child) {
  margin-top: 10px;
}

.review-timeline__month-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-500);
  letter-spacing: 0.05em;
}

.review-timeline__month-line {
  flex: 1;
  border-top: 1px dashed var(--ink-200);
}

.review-timeline__track {
  display: flex;
  flex-direction: column;
}
</style>
