<script setup lang="ts">
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
</script>

<template>
  <div class="review-card-skeleton">
    <SkeletonBlock width="72px" height="96px" border-radius="6px" />

    <div class="review-card-skeleton__body">
      <SkeletonBlock width="60px" height="12px" />
      <SkeletonBlock width="140px" height="16px" />

      <div class="review-card-skeleton__summary">
        <SkeletonBlock width="90%" height="14px" />
        <SkeletonBlock width="60%" height="14px" />
      </div>

      <div class="review-card-skeleton__tags">
        <SkeletonBlock width="52px" height="22px" border-radius="999px" />
        <SkeletonBlock width="52px" height="22px" border-radius="999px" />
        <SkeletonBlock width="52px" height="22px" border-radius="999px" />
      </div>

      <SkeletonBlock width="80px" height="12px" />
    </div>
  </div>
</template>

<style scoped>
.review-card-skeleton {
  display: flex;
  gap: 14px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.review-card-skeleton__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-card-skeleton__summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.review-card-skeleton__tags {
  display: flex;
  gap: 6px;
}
</style>
