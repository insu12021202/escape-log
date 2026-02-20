<script setup lang="ts">
import ReviewCreateForm from '@/features/review-create/ui/ReviewCreateForm.vue'
</script>

<template>
  <div class="review-create">
    <h2 class="review-create__title">리뷰 작성</h2>
    <ReviewCreateForm />
  </div>
</template>

<style scoped>
.review-create__title {
  margin-bottom: 20px;
}
</style>
