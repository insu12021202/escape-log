<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchReviewsByUser } from '@/entities/review/api'
import { fetchAllRooms } from '@/entities/room/api'
import type { Review } from '@/entities/review/types'
import type { Room } from '@/entities/room/types'
import ReviewCard from '@/features/review-list/ui/ReviewCard.vue'
import ReviewCardSkeleton from '@/features/review-list/ui/ReviewCardSkeleton.vue'
import { getRoomPosterUrl } from '@/shared/api/storage'

const route = useRoute()
const router = useRouter()
const userId = computed(() => route.params.id as string)

const reviews = ref<Review[]>([])
const rooms = ref<Record<string, Room>>({})
const loading = ref(true)
const error = ref<string | null>(null)

const authorName = computed(
  () => reviews.value[0]?.authorName ?? '익명',
)

const totalCount = computed(() => reviews.value.length)
const successRate = computed(() => {
  if (!totalCount.value) return null
  const ok = reviews.value.filter((r) => r.visitMeta.isSuccess).length
  return Math.round((ok / totalCount.value) * 100)
})

const avgRating = computed(() => {
  if (!totalCount.value) return null
  const sum = reviews.value.reduce((s, r) => s + r.rating, 0)
  return +(sum / totalCount.value).toFixed(1)
})

onMounted(async () => {
  try {
    const [data, allRooms] = await Promise.all([
      fetchReviewsByUser(userId.value),
      fetchAllRooms(),
    ])
    reviews.value = data
    rooms.value = Object.fromEntries(allRooms.map((r) => [r.id, r]))
  } catch (e) {
    error.value = '리뷰를 불러오는 데 실패했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="author-page">
    <button class="author-page__back" @click="router.back()">← 돌아가기</button>

    <header class="author-page__hero dot-bg-dark">
      <span class="author-page__hero-label label">AUTHOR</span>
      <h1 class="author-page__hero-name">{{ authorName }}</h1>
      <div v-if="!loading" class="author-page__hero-stats mono tnum">
        <span>TOTAL <strong>{{ totalCount }}</strong></span>
        <template v-if="successRate !== null">
          <span class="author-page__hero-sep">·</span>
          <span>SUCCESS <strong>{{ successRate }}%</strong></span>
        </template>
        <template v-if="avgRating !== null">
          <span class="author-page__hero-sep">·</span>
          <span>AVG <strong>{{ avgRating }}</strong></span>
        </template>
      </div>
    </header>

    <div v-if="loading" class="author-page__grid">
      <ReviewCardSkeleton v-for="i in 3" :key="i" />
    </div>

    <p v-else-if="error" class="author-page__status author-page__status--error">
      {{ error }}
    </p>

    <div v-else-if="reviews.length" class="author-page__grid">
      <ReviewCard
        v-for="review in reviews"
        :key="review.id"
        :data-id="review.id"
        :rating="review.rating"
        :summary="review.summary"
        :vendor-name="rooms[review.roomId]?.vendorName ?? ''"
        :theme-name="rooms[review.roomId]?.themeName ?? ''"
        :region="rooms[review.roomId]?.region ?? ''"
        :is-success="review.visitMeta.isSuccess"
        :genre-tags="review.visitMeta.genreTags"
        :author-name="null"
        :visited-at="review.visitedAt"
        :remaining-minutes="review.visitMeta.remainingMinutes"
        :has-spoiler="review.hasSpoiler"
        :poster-url="
          rooms[review.roomId]?.posterPath
            ? getRoomPosterUrl(rooms[review.roomId]!.posterPath!)
            : null
        "
      />
    </div>

    <p v-else class="author-page__status">아직 작성한 리뷰가 없어요.</p>
  </div>
</template>

<style scoped>
.author-page {
  position: relative;
}

.author-page__back {
  background: none;
  border: none;
  color: var(--ink-500);
  font-size: 14px;
  padding: 4px 0;
  cursor: pointer;
  margin-bottom: 8px;
}

.author-page__back:hover {
  color: var(--ink-1000);
}

.author-page__hero {
  margin: 0 -16px 16px;
  padding: 22px 20px 18px;
  background-color: var(--ink-1000);
  color: var(--paper);
  border-radius: 12px;
}

.author-page__hero-label {
  color: rgba(244, 237, 224, 0.55);
}

.author-page__hero-name {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: var(--paper);
}

.author-page__hero-stats {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  letter-spacing: 0.04em;
  color: rgba(244, 237, 224, 0.7);
}

.author-page__hero-stats strong {
  color: var(--paper);
  font-weight: 600;
}

.author-page__hero-sep {
  opacity: 0.4;
}

.author-page__grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.author-page__status {
  text-align: center;
  padding: 60px 0;
  color: var(--ink-500);
}

.author-page__status--error {
  color: var(--color-error);
}

@media (min-width: 640px) {
  .author-page__hero {
    margin: 0 -24px 20px;
    padding: 28px 28px 22px;
  }
}
</style>
