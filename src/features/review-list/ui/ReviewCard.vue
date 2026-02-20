<script setup lang="ts">
defineProps<{
  rating: number
  summary: string
  vendorName: string
  themeName: string
  region: string
  isSuccess: boolean
  genreTags: string[]
}>()
</script>

<template>
  <RouterLink :to="`/review/${$attrs['data-id']}`" class="review-card">
    <div class="review-card__header">
      <span class="review-card__rating">
        {{ '★'.repeat(rating) }}{{ '☆'.repeat(5 - rating) }}
      </span>
      <span class="review-card__result" :class="{ 'review-card__result--fail': !isSuccess }">
        {{ isSuccess ? '성공' : '실패' }}
      </span>
    </div>
    <p class="review-card__summary">{{ summary }}</p>
    <div class="review-card__meta">
      <span class="review-card__theme">{{ vendorName }} · {{ themeName }}</span>
      <span class="review-card__region">{{ region }}</span>
    </div>
    <div v-if="genreTags.length" class="review-card__tags">
      <span v-for="tag in genreTags" :key="tag" class="review-card__tag">{{ tag }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.review-card {
  display: block;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s;
}

.review-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-card__rating {
  color: #f5a623;
  font-size: 1rem;
  letter-spacing: 1px;
}

.review-card__result {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4caf50;
}

.review-card__result--fail {
  color: #e53935;
}

.review-card__summary {
  font-size: 0.9375rem;
  line-height: 1.4;
  margin-bottom: 8px;
}

.review-card__meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #666;
  margin-bottom: 8px;
}

.review-card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.review-card__tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #555;
}
</style>
