<script setup lang="ts">
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="review-card-skeleton">
    <!-- 업체/테마 + 결과 배지 -->
    <div class="review-card-skeleton__top">
      <div class="review-card-skeleton__title">
        <SkeletonBlock width="120px" height="14px" />
        <SkeletonBlock width="90px" height="13px" />
      </div>
      <SkeletonBlock width="44px" height="22px" border-radius="99px" />
    </div>

    <!-- 별점 -->
    <div class="review-card-skeleton__rating">
      <SkeletonBlock width="100px" height="14px" />
      <SkeletonBlock width="24px" height="14px" />
    </div>

    <!-- 한줄평 -->
    <SkeletonBlock width="85%" height="14px" />

    <!-- 태그 -->
    <div class="review-card-skeleton__tags">
      <SkeletonBlock width="52px" height="22px" border-radius="99px" />
      <SkeletonBlock width="44px" height="22px" border-radius="99px" />
      <SkeletonBlock width="56px" height="22px" border-radius="99px" />
    </div>

    <!-- 푸터 -->
    <div class="review-card-skeleton__footer">
      <SkeletonBlock width="48px" height="12px" />
      <SkeletonBlock width="80px" height="12px" />
    </div>
  </div>
</template>

<style scoped>
.review-card-skeleton {
  padding: 18px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-card-skeleton__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.review-card-skeleton__title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-card-skeleton__rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.review-card-skeleton__tags {
  display: flex;
  gap: 6px;
}

.review-card-skeleton__footer {
  display: flex;
  justify-content: space-between;
}
</style>
