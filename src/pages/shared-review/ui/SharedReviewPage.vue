<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const token = route.params.token
</script>

<template>
  <div>
    <h2>공유된 리뷰</h2>
    <p>route: /share/:token</p>
    <p>token: {{ token }}</p>
  </div>
</template>
