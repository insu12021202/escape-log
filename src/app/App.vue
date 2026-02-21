<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@/widgets/layout/ui/AppLayout.vue'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()
const route = useRoute()
onMounted(() => session.init())
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <AppLayout v-else />
</template>
