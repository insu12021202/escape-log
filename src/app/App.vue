<script setup lang="ts">
import { onMounted } from 'vue'
import AppLayout from '@/widgets/layout/ui/AppLayout.vue'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()
onMounted(() => session.init())
</script>

<template>
  <AppLayout />
</template>
