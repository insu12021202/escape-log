<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <h1 class="app-title">
        <RouterLink to="/">방탈출 리뷰</RouterLink>
      </h1>
      <nav class="app-nav">
        <RouterLink to="/">목록</RouterLink>
        <RouterLink to="/review/new">리뷰 작성</RouterLink>
        <RouterLink to="/room/search">방 검색</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.app-title {
  font-size: 1.25rem;
}

.app-title a {
  text-decoration: none;
  color: inherit;
}

.app-nav {
  display: flex;
  gap: 16px;
}

.app-nav a {
  text-decoration: none;
  color: #213547;
  font-size: 0.875rem;
}

.app-nav a.router-link-active {
  font-weight: 600;
}

.app-main {
  flex: 1;
  padding: 24px;
}
</style>
