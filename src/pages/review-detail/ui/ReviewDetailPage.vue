<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <h2>리뷰 상세</h2>
    <p>route: /review/:id</p>
    <p>id: {{ id }}</p>
  </div>
</template>
